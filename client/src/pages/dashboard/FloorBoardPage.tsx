import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  RotateCw,
  ExternalLink,
  ChevronRight,
  X,
  CreditCard,
  DollarSign,
  QrCode,
  Split,
  Receipt,
  Minus,
  Plus,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";
import useSocket from "../../hooks/useSocket";
import { formatCurrency } from "../../utils/currency";

export type FloorStatus = "AVAILABLE" | "WAITING_FOOD" | "READY_TO_SERVE" | "BILL_PENDING";

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
    price: number;
  };
}

interface TableOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerName?: string;
  notes?: string;
  paymentStatus: "UNPAID" | "PAID";
  paymentMethod?: string;
  splitCount?: number;
  createdAt: string;
  items: OrderItem[];
}

interface EnrichedTable {
  id: string;
  restaurantId: string;
  tableNumber: number;
  label?: string;
  capacity: number;
  qrToken: string;
  isActive: boolean;
  floorStatus: FloorStatus;
  unpaidRunningTotal: number;
  elapsedMinutes: number;
  activeOrdersCount: number;
  activeOrders: TableOrder[];
}

export const FloorBoardPage: React.FC = () => {
  const { activeRestaurant } = useAuthStore();
  const socket = useSocket("restaurant", activeRestaurant?.id);

  const [tables, setTables] = useState<EnrichedTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedTable, setSelectedTable] = useState<EnrichedTable | null>(null);

  // Split Bill Calculator state in drawer
  const [splitCount, setSplitCount] = useState<number>(1);
  const [settlingPayment, setSettlingPayment] = useState(false);
  const [settleSuccessMessage, setSettleSuccessMessage] = useState<string | null>(null);

  const currency = activeRestaurant?.currency || "USD";

  const fetchFloorStatus = async () => {
    if (!activeRestaurant?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/tables/status?restaurantId=${activeRestaurant.id}`);
      setTables(res.data.tables || []);

      // If a table is open in drawer, update its active copy
      if (selectedTable) {
        const updatedSelected = (res.data.tables || []).find(
          (t: EnrichedTable) => t.id === selectedTable.id
        );
        if (updatedSelected) {
          setSelectedTable(updatedSelected);
        }
      }
    } catch (err) {
      console.error("Failed to fetch floor status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorStatus();
  }, [activeRestaurant?.id]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket || !activeRestaurant?.id) return;

    const handleFloorUpdate = () => {
      fetchFloorStatus();
    };

    socket.on("new_order", handleFloorUpdate);
    socket.on("order_status_updated", handleFloorUpdate);
    socket.on("order_item_updated", handleFloorUpdate);

    return () => {
      socket.off("new_order", handleFloorUpdate);
      socket.off("order_status_updated", handleFloorUpdate);
      socket.off("order_item_updated", handleFloorUpdate);
    };
  }, [socket, activeRestaurant?.id, selectedTable?.id]);

  // Handle Mark Paid / Settle Bill
  const handleSettleTable = async (paymentMethod: "CASH" | "CARD" | "ONLINE") => {
    if (!selectedTable) return;
    const unpaidOrders = selectedTable.activeOrders.filter((o) => o.paymentStatus === "UNPAID");
    if (unpaidOrders.length === 0) return;

    setSettlingPayment(true);
    setSettleSuccessMessage(null);

    try {
      // Settle all unpaid orders at this table
      await Promise.all(
        unpaidOrders.map((order) =>
          api.patch(`/api/orders/${order.id}/payment`, {
            paymentMethod,
            splitCount,
          })
        )
      );

      setSettleSuccessMessage(
        `Table ${selectedTable.tableNumber} settled with ${paymentMethod}! Bill marked paid.`
      );

      // Re-fetch floor state and close drawer after brief feedback
      await fetchFloorStatus();
      setTimeout(() => {
        setSettleSuccessMessage(null);
        setSelectedTable(null);
        setSplitCount(1);
      }, 1200);
    } catch (err) {
      console.error("Payment settlement failed:", err);
      alert("Failed to settle table payment. Please check your network connection.");
    } finally {
      setSettlingPayment(false);
    }
  };

  // Filter Tables
  const filteredTables = tables.filter((table) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "OCCUPIED") return table.floorStatus !== "AVAILABLE";
    return table.floorStatus === statusFilter;
  });

  // Metric strip counters
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.floorStatus !== "AVAILABLE").length;
  const readyToServeCount = tables.filter((t) => t.floorStatus === "READY_TO_SERVE").length;
  const billPendingCount = tables.filter((t) => t.floorStatus === "BILL_PENDING").length;
  const totalUnpaidBalance = tables.reduce((sum, t) => sum + (t.unpaidRunningTotal || 0), 0);

  // Status visual color tokens
  const getStatusBadge = (status: FloorStatus) => {
    switch (status) {
      case "AVAILABLE":
        return {
          label: "Available",
          border: "border-emerald-200",
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
        };
      case "WAITING_FOOD":
        return {
          label: "Cooking / In Queue",
          border: "border-amber-200",
          bg: "bg-amber-50",
          text: "text-amber-800",
          dot: "bg-amber-500 animate-pulse",
        };
      case "READY_TO_SERVE":
        return {
          label: "Ready at Pass",
          border: "border-blue-300 ring-2 ring-blue-400/20",
          bg: "bg-blue-50",
          text: "text-blue-800",
          dot: "bg-blue-500 animate-ping",
        };
      case "BILL_PENDING":
        return {
          label: "Bill Pending",
          border: "border-rose-300 ring-2 ring-rose-400/20",
          bg: "bg-rose-50",
          text: "text-rose-800",
          dot: "bg-rose-500",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Floor KPI Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <span>Live Floor & Table Board</span>
            <span className="text-xs font-bold font-sans px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time floor occupancy, kitchen stage tracking, and split-bill settlement for{" "}
            <span className="font-semibold text-slate-700">{activeRestaurant?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFloorStatus}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Refresh floor state"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Floor KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Occupancy Rate
          </span>
          <div className="text-xl font-extrabold font-display text-slate-900 mt-1">
            {occupiedCount} / {totalTables} Tables
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0}% seated
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Ready to Deliver
          </span>
          <div className="text-xl font-extrabold font-display text-blue-600 mt-1">
            {readyToServeCount} Tables
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Plated food waiting at pass
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Pending Settlement
          </span>
          <div className="text-xl font-extrabold font-display text-rose-600 mt-1">
            {billPendingCount} Tables
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Guests ready for check
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Unpaid Floor Balance
          </span>
          <div className="text-xl font-extrabold font-display text-emerald-600 mt-1">
            {formatCurrency(totalUnpaidBalance, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Open tabs across all tables
          </p>
        </div>
      </div>

      {/* Filter Tabs Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: "ALL", label: `All Tables (${totalTables})` },
          { key: "OCCUPIED", label: `Occupied (${occupiedCount})` },
          { key: "READY_TO_SERVE", label: `Ready at Pass (${readyToServeCount})` },
          { key: "BILL_PENDING", label: `Bill Pending (${billPendingCount})` },
          { key: "AVAILABLE", label: `Available (${totalTables - occupiedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
              statusFilter === tab.key
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const badge = getStatusBadge(table.floorStatus);
          const isOccupied = table.floorStatus !== "AVAILABLE";

          return (
            <div
              key={table.id}
              onClick={() => {
                if (isOccupied) {
                  setSelectedTable(table);
                  setSplitCount(1);
                }
              }}
              className={`p-5 rounded-2xl border bg-white shadow-xs transition-all duration-200 flex flex-col justify-between ${
                badge.border
              } ${isOccupied ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}`}
            >
              {/* Card Top: Table # & Capacity */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-lg text-slate-900">
                        Table {String(table.tableNumber).padStart(2, "0")}
                      </span>
                      {table.label && (
                        <span className="text-[11px] font-semibold text-slate-400">
                          • {table.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Up to {table.capacity} guests</span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Table Occupancy Metrics */}
                {isOccupied ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Seated:
                      </span>
                      <span className="font-bold text-slate-800">
                        {table.elapsedMinutes} mins ago
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-slate-400" /> Open Balance:
                      </span>
                      <span className="font-extrabold text-sm text-slate-900 font-display">
                        {formatCurrency(table.unpaidRunningTotal, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Table is sanitized & ready for new guests
                  </div>
                )}
              </div>

              {/* Card Footer: Action */}
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                {isOccupied ? (
                  <button
                    type="button"
                    className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>View Bill & Settle</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                ) : (
                  <a
                    href={`/m/${table.qrToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Preview Guest Menu</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {filteredTables.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
            No tables matching the selected filter.
          </div>
        )}
      </div>

      {/* Slide-Over Table & Split-Bill Drawer */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-extrabold text-lg text-slate-900">
                    Table {String(selectedTable.tableNumber).padStart(2, "0")}
                  </h3>
                  {selectedTable.label && (
                    <span className="text-xs text-slate-400 font-semibold">
                      • {selectedTable.label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedTable.activeOrdersCount} active order{selectedTable.activeOrdersCount === 1 ? "" : "s"} • Seated {selectedTable.elapsedMinutes} mins ago
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedTable(null);
                  setSplitCount(1);
                  setSettleSuccessMessage(null);
                }}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content: Orders & Split Calculator */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {settleSuccessMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{settleSuccessMessage}</span>
                </div>
              )}

              {/* Active Orders List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Table Orders
                </h4>

                {selectedTable.activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          #{order.orderNumber}
                        </span>
                        {order.customerName && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({order.customerName})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(order.totalAmount, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Itemized lines */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/60 text-xs">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <span className="font-bold">{item.quantity}x</span>
                            <span>{item.dish.name}</span>
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono">
                            {formatCurrency(item.subtotal, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Split-Bill Calculator */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Split Bill Calculator
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Even Share per Guest
                  </span>
                </div>

                {/* Stepper & Quick Guest Count */}
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSplitCount((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-extrabold text-sm text-slate-900 min-w-8 text-center font-display">
                      {splitCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSplitCount((prev) => Math.min(20, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      {splitCount === 1 ? "Guest" : "Guests"}
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitCount(num)}
                        className={`w-6 h-6 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          splitCount === num
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Per-Person Result Banner */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[11px] text-emerald-800">
                      Total: {formatCurrency(selectedTable.unpaidRunningTotal, currency)} ÷ {splitCount}
                    </p>
                    <p className="text-xs font-bold text-emerald-950">
                      Per Person Share:
                    </p>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-700 font-display">
                    {formatCurrency(
                      selectedTable.unpaidRunningTotal / (splitCount || 1),
                      currency
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer: Payment Settlement Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">
                  Total Outstanding Balance:
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-display">
                  {formatCurrency(selectedTable.unpaidRunningTotal, currency)}
                </span>
              </div>

              {selectedTable.unpaidRunningTotal > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Settle Table Payment:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={settlingPayment}
                      onClick={() => handleSettleTable("CASH")}
                      className="py-3 px-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      disabled={settlingPayment}
                      onClick={() => handleSettleTable("CARD")}
                      className="py-3 px-2 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>POS Card</span>
                    </button>

                    <button
                      type="button"
                      disabled={settlingPayment}
                      onClick={() => handleSettleTable("ONLINE")}
                      className="py-3 px-2 rounded-xl bg-white border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <QrCode className="w-4 h-4 text-purple-600" />
                      <span>Online QR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl text-center text-xs font-bold text-emerald-800 border border-emerald-200">
                  All orders at this table are paid!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorBoardPage;
