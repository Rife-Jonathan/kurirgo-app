import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth";
import prisma from "../prisma";
import bcrypt from "bcryptjs";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));

router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrdersToday, activeOrders, completedOrders, activeCouriers] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PICKED_UP", "ON_DELIVERY"] } } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({ where: { role: "COURIER", isActive: true } })
    ]);

    res.json({ totalOrdersToday, activeOrders, completedOrders, activeCouriers });
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const { status, date } = req.query;
    let where: any = {};
    if (status) where.status = status;
    if (date) {
      const gte = new Date(date as string);
      const lt = new Date(gte);
      lt.setDate(lt.getDate() + 1);
      where.createdAt = { gte, lt };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { name: true } },
        courier: { select: { name: true } }
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/couriers", async (req, res) => {
  try {
    const couriers = await prisma.user.findMany({
      where: { role: "COURIER" },
      orderBy: { createdAt: "desc" }
    });
    res.json(couriers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch couriers" });
  }
});

router.post("/couriers", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const courier = await prisma.user.create({
      data: { name, email, phone, password: hashedPassword, role: "COURIER" }
    });
    res.json(courier);
  } catch (error) {
    res.status(500).json({ error: "Failed to create courier" });
  }
});

router.patch("/couriers/:id", async (req, res) => {
  try {
    const { isActive } = req.body;
    const courier = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    res.json(courier);
  } catch (error) {
    res.status(500).json({ error: "Failed to update courier" });
  }
});

router.patch("/orders/:id/assign", async (req, res) => {
  try {
    const { courierId } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { courierId, status: "CONFIRMED" }
    });
    
    await prisma.statusLog.create({
      data: { orderId: order.id, status: "CONFIRMED", note: "Assigned to courier by admin" }
    });

    const io = req.app.get("io");
    io.to(order.senderId).emit("order:status_updated", { orderId: order.id, status: order.status, updatedAt: order.updatedAt });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign courier" });
  }
});

router.patch("/orders/:id/cancel", async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" }
    });
    
    await prisma.statusLog.create({
      data: { orderId: order.id, status: "CANCELLED", note: "Approved cancel request by admin" }
    });

    const io = req.app.get("io");
    io.to(order.senderId).emit("order:status_updated", { orderId: order.id, status: order.status, updatedAt: order.updatedAt });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

export default router;
