import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface AuthTokenPayload {
  userId: string;
  role: string;
}

export const initializeSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_here", (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication error"));
      socket.data.user = decoded as AuthTokenPayload;
      next();
    });
  });

  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.data.user?.userId} (${socket.data.user?.role})`);
    const userId = socket.data.user?.userId;
    const role = socket.data.user?.role;

    if (userId) {
      socket.join(userId);
    }
    if (role === "ADMIN") {
      socket.join("admin_room");
    }

    socket.on("courier:location_update", (data: { lat: number, lng: number }) => {
      if (role === "COURIER") {
        // Emit to admin room
        io.to("admin_room").emit("courier:location", {
          courierId: userId,
          lat: data.lat,
          lng: data.lng
        });
        
        // Let's broadcast to the specific order sender if needed.
        // For simplicity, the client API will update the courier location in DB
        // and standard order tracking will occur there. Or we just broadcast it.
        // We'll trust the active order system to fetch from DB or emit properly.
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
};
