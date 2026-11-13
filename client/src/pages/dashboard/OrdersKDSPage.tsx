import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ChefHat,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";
import useSocket from "../../hooks/useSocket";
import audioChime from "../../components/AudioChime";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
  dish: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  table: {
    tableNumber: number;
    label?: string;
  };
  items: OrderItem[];
}

export const OrdersKDSPage: React.FC = () => {
  const { activeRestaurant } = useAuthStore();
  const socket = useSocket("restaurant", activeRestaurant?.id);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(audioChime.getMuted());
  const [time, setTime] = useState(Date.now());

  // Update timer tick every 10 seconds to keep elapsed minutes accurate
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    if (!activeRestaurant) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/orders?restaurantId=${activeRestaurant.id}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeRestaurant?.id]);

  // Real-time socket event handling
  useEffect(() => {
    if (!socket || !activeRestaurant?.id) return;

    const handleNewOrder = (newOrder: Order) => {
      // Play chime sound
      audioChime.playNewOrderChime();

      setOrders((prev) => {
        // Prevent duplicate insertions
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    };

    const handleStatusUpdate = (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_status_updated", handleStatusUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, [socket, activeRestaurant?.id]);

  const updateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, {
        status: nextStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? res.data.order : o))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const toggleSound = () => {
    const muted = audioChime.toggleMute();
    setIsMuted(muted);
  };

  // Helper to format elapsed minutes
  const getElapsedMinutes = (dateStr: string) => {
    const created = new Date(dateStr).getTime();
    const diffMs = time - created;
    return Math.floor(diffMs / 60000);
  };

  // Column categorization
  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY" || o.status === "SERVED");

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900">
              Kitchen Display System (KDS)
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live ticket feed for {activeRestaurant?.name || "your restaurant"}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              isMuted
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span>{isMuted ? "Audio Muted" : "Audio Active"}</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Refresh orders"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: PENDING */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-amber-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-slate-800">
                New Orders ({pendingOrders.length})
              </h2>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              Action Needed
            </span>
          </div>

          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsed > 10;
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 transition ${
                    isUrgent ? "border-rose-400 ring-2 ring-rose-200/50" : "border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display font-extrabold text-base text-slate-900 block">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {order.table?.label || `Table ${order.table?.tableNumber}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold inline-flex items-center gap-1 ${
                          isUrgent ? "text-rose-600" : "text-slate-500"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" /> {elapsed}m ago
                      </span>
                      <span className="text-xs font-bold text-slate-700 block">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-2 bg-amber-50/60 border border-amber-200/50 rounded-xl text-xs text-amber-900 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="font-medium">"{order.notes}"</span>
                    </div>
                  )}

                  {/* Order items */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-800 mr-2">{item.quantity}x</span>
                          <span className="text-slate-700 font-medium">{item.dish.name}</span>
                          {item.specialInstructions && (
                            <p className="text-[11px] text-amber-700 pl-6 italic">
                              ↳ {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <ChefHat className="w-4 h-4" /> Accept & Start Cooking
                  </button>
                </div>
              );
            })}

            {pendingOrders.length === 0 && !loading && (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No new orders waiting.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: PREPARING */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-slate-800">
                In the Kitchen ({preparingOrders.length})
              </h2>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
              Cooking
            </span>
          </div>

          <div className="space-y-4">
            {preparingOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display font-extrabold text-base text-slate-900 block">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {order.table?.label || `Table ${order.table?.tableNumber}`}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {elapsed}m cooking
                    </span>
                  </div>

                  {order.notes && (
                    <div className="p-2 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                      "{order.notes}"
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-800 mr-2">{item.quantity}x</span>
                          <span className="text-slate-700 font-medium">{item.dish.name}</span>
                          {item.specialInstructions && (
                            <p className="text-[11px] text-blue-700 pl-6 italic">
                              ↳ {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => updateStatus(order.id, "READY")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Food Ready
                  </button>
                </div>
              );
            })}

            {preparingOrders.length === 0 && !loading && (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No orders currently in preparation.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: READY / SERVED */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-slate-800">
                Ready / Served ({readyOrders.length})
              </h2>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Deliver to Table
            </span>
          </div>

          <div className="space-y-4">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 space-y-3 opacity-90 hover:opacity-100 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display font-extrabold text-base text-slate-900 block">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {order.table?.label || `Table ${order.table?.tableNumber}`}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.dish.name}</span>
                    </div>
                  ))}
                </div>

                {order.status === "READY" && (
                  <button
                    onClick={() => updateStatus(order.id, "SERVED")}
                    className="w-full py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" /> Mark Served & Complete
                  </button>
                )}
              </div>
            ))}

            {readyOrders.length === 0 && !loading && (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No orders waiting for pickup.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersKDSPage;

