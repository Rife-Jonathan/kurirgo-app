import { Router } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import prisma from "../prisma";
import { calculateDistance, calculatePricing } from "../utils/pricing";

const router = Router();

// Used by both sender and general estimates
router.get("/estimate", (req, res) => {
  const { pickupLat, pickupLng, destLat, destLng, itemType, itemWeight } = req.query;
  if (!pickupLat || !destLat) return res.status(400).json({ error: "Missing coordinates" });
  
  const distance = calculateDistance(
    Number(pickupLat), Number(pickupLng),
    Number(destLat), Number(destLng)
  );
  
  const pricing = calculatePricing(distance, String(itemType || "DOCUMENT"), Number(itemWeight || 1));
  res.json({ distance, ...pricing });
});

router.post("/", authenticate, requireRole(["SENDER"]), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const senderId = req.user!.userId;
    
    const distance = calculateDistance(data.pickupLat, data.pickupLng, data.destLat, data.destLng);
    const pricing = calculatePricing(distance, data.itemType, data.itemWeight);
    
    // Generate order code ORD-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    const orderCode = "ORD-" + dateStr + "-" + randomStr;
    
    const order = await prisma.order.create({
      data: {
        orderCode,
        senderId,
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        destAddress: data.destAddress,
        destLat: data.destLat,
        destLng: data.destLng,
        itemType: data.itemType,
        itemWeight: data.itemWeight,
        itemDescription: data.itemDescription,
        distance,
        basePrice: pricing.basePrice,
        totalPrice: pricing.totalPrice,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "COD" ? "UNPAID" : "PAID",
        status: "PENDING"
      }
    });

    await prisma.statusLog.create({
      data: { orderId: order.id, status: "PENDING", note: "Order created" }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/my", authenticate, requireRole(["SENDER"]), async (req: AuthRequest, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { senderId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      include: { courier: { select: { name: true, phone: true } } }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { 
        courier: true, 
        sender: { select: { name: true, phone: true } },
        statusLogs: { orderBy: { createdAt: "asc" } }
      }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.patch("/:id/pay", authenticate, requireRole(["SENDER"]), async (req: AuthRequest, res) => {
  // Simulating payment
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id, senderId: req.user!.userId },
      data: { paymentStatus: "PAID" }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to pay order" });
  }
});

router.patch("/:id/complete", authenticate, requireRole(["SENDER"]), async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.senderId !== req.user!.userId || order.status !== "DELIVERED") {
      return res.status(400).json({ error: "Cannot complete order" });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "COMPLETED" }
    });

    await prisma.statusLog.create({
      data: { orderId: updated.id, status: "COMPLETED", note: "Order completed by sender" }
    });

    // Emitting via socket
    const io = req.app.get("io");
    io.to(updated.senderId).emit('order:status_updated', { orderId: updated.id, status: updated.status, updatedAt: updated.updatedAt });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to complete order" });
  }
});

router.post("/:id/cancel", authenticate, requireRole(["SENDER"]), async (req: AuthRequest, res) => {
  try {
    const { cancelReason } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    
    if (!order || order.senderId !== req.user!.userId || order.status !== "PENDING") {
      return res.status(400).json({ error: "Can only cancel pending orders" });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED", cancelReason }
    });

    await prisma.statusLog.create({
      data: { orderId: updated.id, status: "CANCELLED", note: cancelReason || "Cancelled by sender" }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

export default router;
