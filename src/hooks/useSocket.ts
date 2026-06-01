import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuthStore from '../store/authStore';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (!token) return;

    // Connect socket
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "";
    const newSocket = io(socketUrl, {
      auth: { token }
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return socket;
};
