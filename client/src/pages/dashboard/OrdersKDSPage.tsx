import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ChefHat,
  Volume2,
  VolumeX,
  Search,
  Check,
  Leaf,
  Flame,
  Filter,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";
import useSocket from "../../hooks/useSocket";
import audioChime from "../../components/AudioChime";
import { formatCurrency } from "../../utils/currency";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
  dish: {
    id: string;
    name: string;
    isVegetarian?: boolean;
    isSpicy?: boolean;
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
    id?: string;
    tableNumber: number;
    label?: string;
  };
  restaurant?: {
    id?: string;
    name?: string;
    currency?: string;
    accentColor?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("ALL");

  // Keep elapsed minutes ticking every 10 seconds
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

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket || !activeRestaurant?.id) return;

    const handleNewOrder = (newOrder: Order) => {
      audioChime.playNewOrderChime();
      setOrders((prev) => {
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

  // Helper to format elapsed minutes and urgency level
  const getTimerDetails = (dateStr: string) => {
    const created = new Date(dateStr).getTime();
    const diffMinutes = Math.floor((time - created) / 60000);

    let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let level: "normal" | "warning" | "urgent" = "normal";

    if (diffMinutes >= 12) {
      colorClass = "bg-rose-50 text-rose-700 border-rose-300 animate-pulse";
      level = "urgent";
    } else if (diffMinutes >= 5) {
      colorClass = "bg-amber-50 text-amber-700 border-amber-300";
      level = "warning";
    }

    return { diffMinutes, colorClass, level };
  };

  // Get unique table numbers for the filter dropdown
  const uniqueTables = Array.from(
    new Set(orders.map((o) => o.table?.tableNumber).filter(Boolean))
  ).sort((a, b) => (a || 0) - (b || 0));

  // Filter orders by search and table
  const filteredOrders = orders.filter((o) => {
    const matchesTable =
      tableFilter === "ALL" || String(o.table?.tableNumber) === tableFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.table?.label && o.table.label.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTable && matchesSearch;
  });

  const pendingOrders = filteredOrders.filter(
    (o) => o.status === "PENDING" || o.status === "CONFIRMED"
  );
  const preparingOrders = filteredOrders.filter((o) => o.status === "PREPARING");
  const readyOrders = filteredOrders.filter(
    (o) => o.status === "READY" || o.status === "SERVED"
  );

  return (
    <div className="space-y-6">
      {/* KDS Control Header & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-950">
              Kitchen Display System (KDS)
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time kitchen Kanban order pipeline for {activeRestaurant?.name || "your restaurant"}.
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Order / Table */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search #ticket or guest..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          {/* Table Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Tables ({orders.length})</option>
              {uniqueTables.map((tNum) => (
                <option key={tNum} value={String(tNum)}>
                  Table {tNum}
                </option>
              ))}
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              isMuted
                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="hidden sm:inline">{isMuted ? "Sound Muted" : "Chime Active"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Refresh active tickets"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: PENDING / INCOMING */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b-2 border-amber-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
              <h2 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Pending ({pendingOrders.length})
              </h2>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Action Needed
            </span>
          </div>

          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const { diffMinutes, colorClass, level } = getTimerDetails(order.createdAt);
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3.5 transition-all duration-200 ${
                    level === "urgent"
                      ? "border-rose-400 ring-2 ring-rose-200/60"
                      : "border-amber-200/90 hover:border-amber-400"
                  }`}
                >
                  {/* Card Header: Table Badge + Order # */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-display font-bold text-xs uppercase tracking-wide shadow-xs">
                          {order.table?.label || `Table ${order.table?.tableNumber}`}
                        </span>
                        <span className="font-display font-bold text-sm text-slate-900">
                          #{order.orderNumber}
                        </span>
                      </div>
                      {order.customerName && (
                        <p className="text-[11px] text-slate-500 font-medium pl-0.5">
                          Guest: {order.customerName}
                        </p>
                      )}
                    </div>

                    {/* Timer Badge */}
                    <div className="text-right space-y-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{diffMinutes}m</span>
                      </span>
                      <p className="text-[11px] font-bold text-slate-700">
                        {formatCurrency(order.totalAmount, order.restaurant?.currency || activeRestaurant?.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Kitchen Notes Alert Callout */}
                  {order.notes && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 shadow-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="font-bold block text-[10px] uppercase text-amber-700">Kitchen Note</span>
                        <span>"{order.notes}"</span>
                      </div>
                    </div>
                  )}

                  {/* Itemized Dish List */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {item.quantity}
                            </span>
                            <span className="font-bold text-slate-900 leading-tight">
                              {item.dish.name}
                            </span>
                            {item.dish.isVegetarian && (
                              <span title="Vegetarian">
                                <Leaf className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                              </span>
                            )}
                            {item.dish.isSpicy && (
                              <span title="Spicy">
                                <Flame className="w-3.5 h-3.5 text-red-500 inline shrink-0" />
                              </span>
                            )}
                          </div>
                          {item.specialInstructions && (
                            <p className="text-[11px] text-amber-800 pl-7 font-medium italic">
                              ↳ {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono shrink-0">
                          {formatCurrency(item.subtotal, order.restaurant?.currency || activeRestaurant?.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Large Full-Width Action Button */}
                  <button
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4" /> Accept & Start Cooking
                  </button>
                </div>
              );
            })}

            {pendingOrders.length === 0 && !loading && (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No new orders waiting. Ready for the next rush!
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PREPARATION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b-2 border-blue-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <h2 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Cooking ({preparingOrders.length})
              </h2>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              At the Pass
            </span>
          </div>

          <div className="space-y-4">
            {preparingOrders.map((order) => {
              const { diffMinutes, colorClass } = getTimerDetails(order.createdAt);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-blue-200/90 shadow-sm p-4 space-y-3.5 hover:border-blue-400 transition"
                >
                  {/* Card Header: Table Badge + Order # */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-display font-bold text-xs uppercase tracking-wide shadow-xs">
                          {order.table?.label || `Table ${order.table?.tableNumber}`}
                        </span>
                        <span className="font-display font-bold text-sm text-slate-900">
                          #{order.orderNumber}
                        </span>
                      </div>
                      {order.customerName && (
                        <p className="text-[11px] text-slate-500 font-medium pl-0.5">
                          Guest: {order.customerName}
                        </p>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{diffMinutes}m cooking</span>
                    </span>
                  </div>

                  {/* Customer Notes */}
                  {order.notes && (
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 italic">
                      "{order.notes}"
                    </div>
                  )}

                  {/* Itemized Dish List */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {item.quantity}
                            </span>
                            <span className="font-bold text-slate-900 leading-tight">
                              {item.dish.name}
                            </span>
                          </div>
                          {item.specialInstructions && (
                            <p className="text-[11px] text-blue-800 pl-7 italic">
                              ↳ {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button: Mark Ready */}
                  <button
                    onClick={() => updateStatus(order.id, "READY")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Order Ready
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
          <div className="flex items-center justify-between pb-2.5 border-b-2 border-emerald-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <h2 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Ready / Served ({readyOrders.length})
              </h2>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Deliver to Table
            </span>
          </div>

          <div className="space-y-4">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 space-y-3.5 opacity-95 hover:opacity-100 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-display font-bold text-xs uppercase tracking-wide">
                      {order.table?.label || `Table ${order.table?.tableNumber}`}
                    </span>
                    <span className="font-display font-bold text-sm text-slate-900">
                      #{order.orderNumber}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-1.5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between font-medium">
                      <span>{item.quantity}x {item.dish.name}</span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {formatCurrency(item.subtotal, order.restaurant?.currency || activeRestaurant?.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.status === "READY" && (
                  <button
                    onClick={() => updateStatus(order.id, "SERVED")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-400" /> Mark Delivered & Complete
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
