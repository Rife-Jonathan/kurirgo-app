import prisma from "./prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  
  // Admin
  await prisma.user.upsert({
    where: { email: "admin@kurir.com" },
    update: {},
    create: {
      email: "admin@kurir.com",
      name: "Super Admin",
      password: hash,
      role: "ADMIN"
    }
  });

  // Sender
  const senderHash = await bcrypt.hash("sender123", 10);
  const sender1 = await prisma.user.upsert({
    where: { email: "sender1@kurir.com" },
    update: {},
    create: {
      email: "sender1@kurir.com",
      name: "Budi Pengirim",
      password: senderHash,
      role: "SENDER",
      phone: "081234567890"
    }
  });

  const sender2 = await prisma.user.upsert({
    where: { email: "sender2@kurir.com" },
    update: {},
    create: {
      email: "sender2@kurir.com",
      name: "Siti Pengirim",
      password: senderHash,
      role: "SENDER",
      phone: "081234567891"
    }
  });

  // Courier
  const courierHash = await bcrypt.hash("kurir123", 10);
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: "kurir" + i + "@kurir.com" },
      update: {},
      create: {
        email: "kurir" + i + "@kurir.com",
        name: "Kurir " + i,
        password: courierHash,
        role: "COURIER",
        phone: "0812345600" + i
      }
    });
  }

  // Create some orders for sender1 (Using static places in Jakarta)
  const orderCount = await prisma.order.count();
  if (orderCount === 0) {
    const courier = await prisma.user.findFirst({ where: { role: "COURIER" } });
    
    // 1. Pending Order
    await prisma.order.create({
      data: {
        orderCode: "ORD-20231025-0001",
        senderId: sender1.id,
        pickupAddress: "Monas, Jakarta",
        pickupLat: -6.1754,
        pickupLng: 106.8272,
        destAddress: "Bundaran HI, Jakarta",
        destLat: -6.1949,
        destLng: 106.8231,
        itemType: "DOCUMENT",
        itemWeight: 0.5,
        itemDescription: "Penting",
        distance: 2.2,
        basePrice: 5000,
        totalPrice: 11600, // 5000 + 2.2 * 3000
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        status: "PENDING",
        statusLogs: {
          create: [{ status: "PENDING", note: "Order created" }]
        }
      }
    });

    // 2. On Delivery Order
    await prisma.order.create({
      data: {
        orderCode: "ORD-20231025-0002",
        senderId: sender1.id,
        courierId: courier?.id,
        pickupAddress: "Kemang",
        pickupLat: -6.2559,
        pickupLng: 106.8122,
        destAddress: "Senayan",
        destLat: -6.2255,
        destLng: 106.8016,
        itemType: "SMALL_PACKAGE",
        itemWeight: 2,
        distance: 3.5,
        basePrice: 8000,
        totalPrice: 20000, // 8000 + (3.5*3000) + 1500
        paymentMethod: "TRANSFER",
        paymentStatus: "PAID",
        status: "ON_DELIVERY",
        statusLogs: {
          create: [
            { status: "PENDING" },
            { status: "CONFIRMED" },
            { status: "PICKED_UP" },
            { status: "ON_DELIVERY" }
          ]
        }
      }
    });
  }

  console.log("Database seeded completely");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
