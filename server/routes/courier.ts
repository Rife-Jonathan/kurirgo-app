import { Router, Request } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import prisma from "../prisma";
import multer from "multer";
import fs from "fs";

const router = Router();

// Setup Multer for proof of delivery
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.get("/orders/available", authenticate, requireRole(["COURIER"]), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "PENDING", courierId: null },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { name: true, phone: true } } }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/orders/my", authenticate, requireRole(["COURIER"]), async (req: AuthRequest, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { courierId: req.user!.userId },
      orderBy: { updatedAt: "desc" },
      include: { sender: { select: { name: true, phone: true } } }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active order" });
  }
});

router.patch("/orders/:id/accept", authenticate, requireRole(["COURIER"]), async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.status !== "PENDING" || order.courierId) {
      return res.status(400).json({ error: "Order is no longer available" });
    }

    // Check if courier already has an active order (optional, but good for MVP)
    const activeOrder = await prisma.order.findFirst({
      where: { courierId: req.user!.userId, status: { in: ["CONFIRMED", "PICKED_UP", "ON_DELIVERY"] } }
    });
    
    if (activeOrder) {
      return res.status(400).json({ error: "You already have an active order" });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "CONFIRMED", courierId: req.user!.userId }
    });

    await prisma.statusLog.create({
      data: { orderId: updated.id, status: "CONFIRMED", note: "Order accepted by courier" }
    });

    // Socket notification
    const io = req.app.get("io");
    io.to(updated.senderId).emit("order:status_updated", { orderId: updated.id, status: updated.status, updatedAt: updated.updatedAt });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to accept order" });
  }
});

router.patch("/orders/:id/status", authenticate, requireRole(["COURIER"]), async (req: AuthRequest, res) => {
  try {
    const { status, note } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    
    if (!order || order.courierId !== req.user!.userId) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });

    await prisma.statusLog.create({
      data: { orderId: updated.id, status, note }
    });

    // Socket notification
    const io = req.app.get("io");
    io.to(updated.senderId).emit("order:status_updated", { orderId: updated.id, status: updated.status, updatedAt: updated.updatedAt });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.post("/orders/:id/proof", authenticate, requireRole(["COURIER"]), upload.single("photo"), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.courierId !== req.user!.userId) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const fileUrl = "/uploads/" + req.file.filename;

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { proofPhotoUrl: fileUrl, status: "DELIVERED" }
    });
    
    await prisma.statusLog.create({
      data: { orderId: updated.id, status: "DELIVERED", note: "Proof of delivery uploaded" }
    });
    
    // Socket notification
    const io = req.app.get("io");
    io.to(updated.senderId).emit("order:status_updated", { orderId: updated.id, status: updated.status, updatedAt: updated.updatedAt });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload proof" });
  }
});

router.get("/earnings", authenticate, requireRole(["COURIER"]), async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { 
        courierId: req.user!.userId,
        status: "COMPLETED",
        updatedAt: { gte: today }
      }
    });

    const earnings = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    res.json({ totalOrders: orders.length, earnings });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

export default router;
