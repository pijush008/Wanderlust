import { useState, useEffect } from "react";
import { getSocket } from "../utils/socket";
import { useToast } from "../context/ToastContext";

export default function RealtimeIndicator({ listingId }) {
  const toast = useToast();
  const [viewers, setViewers] = useState(1);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => socket.emit("join:listing", listingId);
    const onViewers = (data) => {
      if (data.listingId === listingId) setViewers(data.count);
    };
    const onAvailability = (data) => {
      if (data.listingId !== listingId) return;
      const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const range = `${fmt(data.checkIn)} – ${fmt(data.checkOut)}`;
      toast.show(
        data.type === "booking_confirmed"
          ? `🔒 Dates just booked: ${range}`
          : `🔓 Dates now available: ${range}`,
        data.type === "booking_confirmed" ? "warning" : "success"
      );
    };
    const onConflict = (data) => {
      if (data.listingId !== listingId) return;
      const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      toast.show(`⚡ Someone is booking ${fmt(data.checkIn)}–${fmt(data.checkOut)} right now!`, "error");
    };

    if (socket.connected) onConnect();
    else socket.on("connect", onConnect);
    socket.on("viewers:count", onViewers);
    socket.on("availability:updated", onAvailability);
    socket.on("booking:conflict", onConflict);

    return () => {
      socket.emit("leave:listing", listingId);
      socket.off("connect", onConnect);
      socket.off("viewers:count", onViewers);
      socket.off("availability:updated", onAvailability);
      socket.off("booking:conflict", onConflict);
    };
  }, [listingId, toast]);

  if (viewers <= 1) return null;

  return (
    <div className="viewer-count-badge">
      <i className="fa-solid fa-eye me-1"></i>
      {viewers} people viewing
    </div>
  );
}
