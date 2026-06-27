import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket", "polling"], autoConnect: true });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
