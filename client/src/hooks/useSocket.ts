import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socketInstance;
};

export const useSocket = (roomType?: "restaurant" | "order", roomId?: string) => {
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    const handleConnect = () => {
      if (roomType && roomId) {
        if (roomType === "restaurant") {
          socket.emit("join_restaurant", roomId);
        } else if (roomType === "order") {
          socket.emit("join_order", roomId);
        }
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      if (roomType && roomId) {
        if (roomType === "restaurant") {
          socket.emit("leave_restaurant", roomId);
        } else if (roomType === "order") {
          socket.emit("leave_order", roomId);
        }
      }
    };
  }, [roomType, roomId]);

  return socketRef.current;
};

export default useSocket;

