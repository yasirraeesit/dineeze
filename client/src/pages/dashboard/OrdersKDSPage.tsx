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
  Moon,
  Sun,
  Keyboard,
  Star,
  CheckSquare,
  Square,
  X,
  Ban,
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
  isPrepared?: boolean;
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
  cancelReason?: string;
  estimatedWaitMinutes?: number;
  rating?: number;
  feedbackComment?: string;
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("dineeze_kds_dark") === "true";
  });

  // Cancel / Void Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState("Out of ingredients");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("dineeze_kds_dark", String(next));
      return next;
    });
  };

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

    const handleItemUpdated = (payload: { orderId: string; itemId: string; isPrepared: boolean }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== payload.orderId) return order;
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === payload.itemId ? { ...item, isPrepared: payload.isPrepared } : item
            ),
          };
        })
      );
    };

    const handleFeedbackReceived = (feedback: { orderId: string; rating: number; feedbackComment?: string }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== feedback.orderId) return order;
          return {
            ...order,
            rating: feedback.rating,
            feedbackComment: feedback.feedbackComment,
          };
        })
      );
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_status_updated", handleStatusUpdate);
    socket.on("order_item_updated", handleItemUpdated);
    socket.on("order_feedback_received", handleFeedbackReceived);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_updated", handleStatusUpdate);
      socket.off("order_item_updated", handleItemUpdated);
      socket.off("order_feedback_received", handleFeedbackReceived);
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

  // Toggle item-level prep status
  const toggleItemPrepared = async (orderId: string, itemId: string, currentPrepared: boolean) => {
    const nextPrepared = !currentPrepared;
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, isPrepared: nextPrepared } : item
          ),
        };
      })
    );

    try {
      await api.patch(`/api/orders/${orderId}/items/${itemId}/prepared`, {
        isPrepared: nextPrepared,
      });
    } catch (err) {
      console.error("Failed to toggle item prep:", err);
      // Revert optimistic update on error
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === itemId ? { ...item, isPrepared: currentPrepared } : item
            ),
          };
        })
      );
    }
  };

  // Handle Void / Cancel Order
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    const finalReason =
      cancelReasonPreset === "Custom"
        ? customCancelReason.trim()
        : cancelReasonPreset;

    if (!finalReason) {
      setCancelError("Please specify a cancellation reason.");
      return;
    }

    setIsSubmittingCancel(true);
    setCancelError(null);

    try {
      const res = await api.patch(`/api/orders/${cancellingOrder.id}/status`, {
        status: "CANCELLED",
        cancelReason: finalReason,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === cancellingOrder.id ? res.data.order : o))
      );
      setCancellingOrder(null);
      setCustomCancelReason("");
      setCancelReasonPreset("Out of ingredients");
    } catch (err: any) {
      console.error("Failed to cancel order:", err);
      setCancelError(err.response?.data?.error || "Failed to cancel order.");
    } finally {
      setIsSubmittingCancel(false);
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

  // Keyboard Shortcuts: Space (Accept oldest pending), Enter (Mark oldest preparing ready)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        const oldestPending = [...pendingOrders].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        if (oldestPending) {
          updateStatus(oldestPending.id, "PREPARING");
        }
      } else if (e.code === "Enter") {
        e.preventDefault();
        const oldestPreparing = [...preparingOrders].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        if (oldestPreparing) {
          updateStatus(oldestPreparing.id, "READY");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingOrders, preparingOrders]);

  return (
    <div
      className={`space-y-6 transition-colors duration-200 ${
        isDarkMode
          ? "bg-[#090D16] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen text-slate-100"
          : ""
      }`}
    >
      {/* KDS Control Header & Filter Bar */}
      <div
        className={`p-5 rounded-2xl border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
          isDarkMode
            ? "bg-[#0F172A] border-slate-800 text-slate-100 shadow-lg"
            : "bg-white border-slate-200/80"
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className={`text-xl sm:text-2xl font-bold font-display ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`}
            >
              Kitchen Display System (KDS)
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Real-time kitchen Kanban order pipeline for {activeRestaurant?.name || "your restaurant"}.
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subtle Keycap Hint Bar */}
          <div
            className={`hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition ${
              isDarkMode
                ? "bg-[#1E293B]/90 border-slate-700 text-slate-300"
                : "bg-slate-50 border-slate-200 text-slate-600 shadow-xs"
            }`}
          >
            <span className="flex items-center gap-1 font-semibold text-slate-400">
              <Keyboard className="w-3.5 h-3.5" /> Shortcuts:
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shadow-xs ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-600 text-amber-300"
                    : "bg-white border-slate-300 text-slate-800"
                }`}
              >
                Space
              </kbd>{" "}
              Accept
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shadow-xs ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-600 text-emerald-300"
                    : "bg-white border-slate-300 text-slate-800"
                }`}
              >
                ↵ Enter
              </kbd>{" "}
              Ready
            </span>
          </div>

          {/* Search Order / Table */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search #ticket or guest..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                isDarkMode
                  ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-400"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            />
          </div>

          {/* Table Filter Dropdown */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
              isDarkMode
                ? "bg-[#1E293B] border-slate-700 text-slate-200"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${
                isDarkMode ? "text-slate-200 [&>option]:bg-slate-900 [&>option]:text-white" : "text-slate-700"
              }`}
            >
              <option value="ALL">All Tables ({orders.length})</option>
              {uniqueTables.map((tNum) => (
                <option key={tNum} value={String(tNum)}>
                  Table {tNum}
                </option>
              ))}
            </select>
          </div>

          {/* Kitchen Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
              isDarkMode
                ? "bg-amber-400/15 text-amber-300 border-amber-500/40 hover:bg-amber-400/25 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
            title="Toggle high-contrast kitchen dark mode"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden sm:inline">{isDarkMode ? "Light KDS" : "Kitchen Dark Mode"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              isMuted
                ? isDarkMode
                  ? "bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/40"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                : isDarkMode
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/40"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Chime On"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            className={`p-2 rounded-xl transition ${
              isDarkMode
                ? "text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
                : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
            }`}
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
              <h2
                className={`font-display font-extrabold text-sm uppercase tracking-wider ${
                  isDarkMode ? "text-amber-400" : "text-slate-900"
                }`}
              >
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
                  className={`rounded-2xl border p-4 space-y-3.5 transition-all duration-200 ${
                    isDarkMode
                      ? "bg-[#111827] border-slate-800 text-white shadow-md hover:border-slate-700"
                      : "bg-white border-slate-200/90 shadow-sm hover:border-amber-400"
                  } ${
                    level === "urgent"
                      ? "border-rose-400 ring-2 ring-rose-400/20"
                      : level === "warning"
                      ? "border-amber-300 ring-2 ring-amber-300/20"
                      : ""
                  }`}
                >
                  {/* Card Header: Table Badge + Order # */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-display font-bold text-xs uppercase tracking-wide shadow-xs">
                          {order.table?.label || `Table ${order.table?.tableNumber}`}
                        </span>
                        <span
                          className={`font-display font-bold text-sm ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          #{order.orderNumber}
                        </span>
                      </div>
                      {order.customerName && (
                        <p className="text-[11px] text-slate-400 font-medium pl-0.5">
                          Guest: {order.customerName}
                        </p>
                      )}
                    </div>

                    {/* Timer & Wait Time Badges */}
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.estimatedWaitMinutes && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            ~{order.estimatedWaitMinutes}m est
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{diffMinutes}m</span>
                        </span>
                      </div>
                      <p
                        className={`text-[11px] font-bold ${
                          isDarkMode ? "text-amber-300" : "text-slate-700"
                        }`}
                      >
                        {formatCurrency(
                          order.totalAmount,
                          order.restaurant?.currency || activeRestaurant?.currency
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Customer Kitchen Notes Alert Callout */}
                  {order.notes && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-start gap-2 shadow-xs ${
                        isDarkMode
                          ? "bg-amber-950/40 border border-amber-800/80 text-amber-200"
                          : "bg-amber-50 border border-amber-200 text-amber-900"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="font-bold block text-[10px] uppercase text-amber-500">
                          Kitchen Note
                        </span>
                        <span>"{order.notes}"</span>
                      </div>
                    </div>
                  )}

                  {/* Itemized Dish List */}
                  <div
                    className={`space-y-2 pt-1 border-t ${
                      isDarkMode ? "border-slate-800" : "border-slate-100"
                    }`}
                  >
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md font-bold flex items-center justify-center text-xs shrink-0 ${
                                isDarkMode
                                  ? "bg-slate-800 text-slate-100"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <span
                              className={`font-bold leading-tight ${
                                isDarkMode ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {item.dish.name}
                            </span>
                            {item.dish.isVegetarian && (
                              <span title="Vegetarian">
                                <Leaf className="w-3.5 h-3.5 text-emerald-500 inline shrink-0" />
                              </span>
                            )}
                            {item.dish.isSpicy && (
                              <span title="Spicy">
                                <Flame className="w-3.5 h-3.5 text-red-500 inline shrink-0" />
                              </span>
                            )}
                          </div>
                          {item.specialInstructions && (
                            <p className="text-[11px] text-amber-500 pl-7 font-medium italic">
                              ↳ {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono shrink-0">
                          {formatCurrency(
                            item.subtotal,
                            order.restaurant?.currency || activeRestaurant?.currency
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons: Accept & Void */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => updateStatus(order.id, "PREPARING")}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4" /> Accept & Start Cooking
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancellingOrder(order)}
                      className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Void / Cancel Order"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingOrders.length === 0 && !loading && (
              <div
                className={`p-8 text-center rounded-2xl border border-dashed text-xs ${
                  isDarkMode
                    ? "bg-[#111827] border-slate-800 text-slate-400"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
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
              <h2
                className={`font-display font-extrabold text-sm uppercase tracking-wider ${
                  isDarkMode ? "text-sky-400" : "text-slate-900"
                }`}
              >
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
              const preppedCount = order.items.filter((i) => i.isPrepared).length;
              const totalCount = order.items.length;
              const allPrepped = totalCount > 0 && preppedCount === totalCount;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4 space-y-3.5 transition ${
                    isDarkMode
                      ? "bg-[#111827] border-sky-900/60 hover:border-sky-700 text-white shadow-md"
                      : "bg-white border-blue-200/90 shadow-sm hover:border-blue-400"
                  }`}
                >
                  {/* Card Header: Table Badge + Order # */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-display font-bold text-xs uppercase tracking-wide shadow-xs">
                          {order.table?.label || `Table ${order.table?.tableNumber}`}
                        </span>
                        <span
                          className={`font-display font-bold text-sm ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          #{order.orderNumber}
                        </span>
                      </div>
                      {order.customerName && (
                        <p className="text-[11px] text-slate-400 font-medium pl-0.5">
                          Guest: {order.customerName}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{diffMinutes}m cooking</span>
                      </span>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {order.notes && (
                    <div
                      className={`p-2 rounded-xl text-xs italic ${
                        isDarkMode
                          ? "bg-slate-800/60 border border-slate-700 text-slate-200"
                          : "bg-slate-50 border border-slate-200 text-slate-700"
                      }`}
                    >
                      "{order.notes}"
                    </div>
                  )}

                  {/* Item-Level Prep Progress Indicator */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span
                        className={
                          allPrepped
                            ? "text-emerald-500 font-extrabold"
                            : isDarkMode
                            ? "text-slate-300"
                            : "text-slate-600"
                        }
                      >
                        Dish Prep: {preppedCount}/{totalCount} completed
                      </span>
                      {allPrepped && (
                        <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-extrabold uppercase">
                          All Dishes Ready!
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${totalCount ? (preppedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Itemized Dish List with Clickable Prep Checkboxes */}
                  <div
                    className={`space-y-2 pt-1 border-t ${
                      isDarkMode ? "border-slate-800" : "border-slate-100"
                    }`}
                  >
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            {/* Prep Checkbox Button */}
                            <button
                              type="button"
                              onClick={() => toggleItemPrepared(order.id, item.id, !!item.isPrepared)}
                              className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                                item.isPrepared
                                  ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60"
                                  : "text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800"
                              }`}
                              title={item.isPrepared ? "Mark Unprepared" : "Mark Dish Prepared"}
                            >
                              {item.isPrepared ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <span
                              className={`w-5 h-5 rounded-md font-bold flex items-center justify-center text-xs shrink-0 ${
                                item.isPrepared
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : isDarkMode
                                  ? "bg-blue-950/70 text-sky-300"
                                  : "bg-blue-50 text-blue-800"
                              }`}
                            >
                              {item.quantity}
                            </span>

                            <span
                              className={`font-bold leading-tight ${
                                item.isPrepared
                                  ? "line-through text-slate-400 dark:text-slate-500"
                                  : isDarkMode
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {item.dish.name}
                            </span>

                            {item.dish.isVegetarian && (
                              <span title="Vegetarian">
                                <Leaf className="w-3.5 h-3.5 text-emerald-500 inline shrink-0" />
                              </span>
                            )}
                            {item.dish.isSpicy && (
                              <span title="Spicy">
                                <Flame className="w-3.5 h-3.5 text-red-500 inline shrink-0" />
                              </span>
                            )}
                          </div>
                          {item.specialInstructions && (
                            <p className="text-[11px] text-sky-400 pl-14 italic">
                              ↳ {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons: Mark Ready & Void */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => updateStatus(order.id, "READY")}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                        allPrepped
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Order Ready
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancellingOrder(order)}
                      className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Void / Cancel Order"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {preparingOrders.length === 0 && !loading && (
              <div
                className={`p-8 text-center rounded-2xl border border-dashed text-xs ${
                  isDarkMode
                    ? "bg-[#111827] border-slate-800 text-slate-400"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
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
              <h2
                className={`font-display font-extrabold text-sm uppercase tracking-wider ${
                  isDarkMode ? "text-emerald-400" : "text-slate-900"
                }`}
              >
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
                className={`rounded-2xl border p-4 space-y-3.5 transition opacity-95 hover:opacity-100 ${
                  isDarkMode
                    ? "bg-[#111827] border-emerald-900/50 hover:border-emerald-700 text-white shadow-md"
                    : "bg-white border-emerald-200 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-display font-bold text-xs uppercase tracking-wide">
                      {order.table?.label || `Table ${order.table?.tableNumber}`}
                    </span>
                    <span
                      className={`font-display font-bold text-sm ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      #{order.orderNumber}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                    {order.status}
                  </span>
                </div>

                {/* Guest Star Rating & Feedback Callout Banner */}
                {order.rating && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Guest Rating
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= (order.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-700"
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-200 ml-1">
                          {order.rating}/5
                        </span>
                      </div>
                    </div>
                    {order.feedbackComment && (
                      <p className="text-[11px] text-amber-950 dark:text-amber-200 italic font-medium leading-snug">
                        "{order.feedbackComment}"
                      </p>
                    )}
                  </div>
                )}

                <div
                  className={`space-y-1.5 text-xs border-t pt-1.5 ${
                    isDarkMode ? "text-slate-200 border-slate-800" : "text-slate-700 border-slate-100"
                  }`}
                >
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between font-medium">
                      <span>
                        {item.quantity}x {item.dish.name}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {formatCurrency(
                          item.subtotal,
                          order.restaurant?.currency || activeRestaurant?.currency
                        )}
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
              <div
                className={`p-8 text-center rounded-2xl border border-dashed text-xs ${
                  isDarkMode
                    ? "bg-[#111827] border-slate-800 text-slate-400"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                No orders waiting for pickup.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel / Void Order Reason Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Void Order #{cancellingOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {cancellingOrder.table?.label || `Table ${cancellingOrder.table?.tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCancellingOrder(null);
                  setCancelError(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {cancelError}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Reason for Cancellation:
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  "Out of ingredients",
                  "Guest cancelled",
                  "Duplicate order",
                  "Kitchen overloaded",
                  "Custom",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancelReasonPreset(reason)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition cursor-pointer ${
                      cancelReasonPreset === reason
                        ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {cancelReasonPreset === "Custom" && (
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-medium text-slate-500">
                    Custom Explanation:
                  </label>
                  <input
                    type="text"
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="e.g. Kitchen equipment malfunction..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingOrder(null);
                  setCancelError(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Nevermind
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmittingCancel ? "Cancelling..." : "Confirm Void Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersKDSPage;
