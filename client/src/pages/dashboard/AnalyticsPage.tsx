import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Star,
  Clock,
  AlertTriangle,
  RotateCw,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";
import { formatCurrency } from "../../utils/currency";

interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  averageRating: number;
  totalRatingsCount: number;
  soldOutCount: number;
}

interface DailyPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface PeakHourPoint {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
}

interface TopDish {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  imageUrl?: string | null;
}

interface AnalyticsData {
  range: "7d" | "30d";
  summary: AnalyticsSummary;
  dailySeries: DailyPoint[];
  peakHours: PeakHourPoint[];
  topDishes: TopDish[];
}

export const AnalyticsPage: React.FC = () => {
  const { activeRestaurant } = useAuthStore();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!activeRestaurant?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/api/analytics?restaurantId=${activeRestaurant.id}&range=${range}`
      );
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err.response?.data?.error || "Failed to load restaurant analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeRestaurant?.id, range]);

  const currency = activeRestaurant?.currency || "USD";
  const summary = data?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    aov: 0,
    averageRating: 5.0,
    totalRatingsCount: 0,
    soldOutCount: 0,
  };

  const dailySeries = data?.dailySeries || [];
  const peakHours = data?.peakHours || [];
  const topDishes = data?.topDishes || [];

  const maxDailyRevenue = Math.max(...dailySeries.map((d) => d.revenue), 10);
  const maxPeakOrders = Math.max(...peakHours.map((h) => h.orders), 1);
  const maxDishQuantity = Math.max(...topDishes.map((d) => d.quantity), 1);

  return (
    <div className="space-y-6">
      {/* Page Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <span>Executive Analytics</span>
            <span className="text-xs font-bold font-sans px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Pulse
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Revenue velocity, guest sentiment, and kitchen throughput for{" "}
            <span className="font-semibold text-slate-700">{activeRestaurant?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 7 Days / 30 Days Toggle Pill */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setRange("7d")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                range === "7d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRange("30d")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                range === "30d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Sold Out Warning Callout */}
      {summary.soldOutCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Inventory Notice:</strong> You currently have{" "}
              <strong className="text-amber-800">{summary.soldOutCount} dish{summary.soldOutCount > 1 ? "es" : ""}</strong> marked as Sold Out on the public customer menu.
            </span>
          </div>
          <a
            href="/dashboard/menu"
            className="text-[11px] font-bold text-amber-800 hover:underline inline-flex items-center gap-0.5"
          >
            Manage Availability <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-display text-slate-900 tracking-tight">
              {formatCurrency(summary.totalRevenue, currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across active dine-in orders
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Orders Fulfilled
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-display text-slate-900 tracking-tight">
              {summary.totalOrders}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Completed table orders
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Average Check (AOV)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-display text-slate-900 tracking-tight">
              {formatCurrency(summary.aov, currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Average ticket per table
            </p>
          </div>
        </div>

        {/* Average Guest Rating */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Guest Satisfaction
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{summary.averageRating.toFixed(1)}</span>
              <span className="text-xs font-bold text-slate-400 font-sans">/ 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              From {summary.totalRatingsCount} verified guest review{summary.totalRatingsCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Daily Revenue Bar Chart + Top Selling Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Bar Chart (Span 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900">
                Daily Sales Revenue Trend
              </h2>
              <p className="text-[11px] text-slate-400">
                Gross daily sales performance over the past {range === "7d" ? "7 days" : "30 days"}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Peak Day: {formatCurrency(maxDailyRevenue, currency)}
            </span>
          </div>

          {/* SVG / HTML CSS Bar Chart */}
          <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {dailySeries.map((point) => {
              const heightPercent = maxDailyRevenue > 0
                ? Math.max(8, Math.round((point.revenue / maxDailyRevenue) * 100))
                : 8;

              return (
                <div
                  key={point.date}
                  className="flex-1 min-w-8 flex flex-col items-center gap-2 group relative h-full justify-end"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                    <p className="font-bold">{formatCurrency(point.revenue, currency)}</p>
                    <p className="text-slate-300">{point.orders} orders</p>
                  </div>

                  {/* Revenue Bar */}
                  <div
                    className="w-full rounded-t-lg bg-emerald-500/85 group-hover:bg-emerald-500 transition-all duration-300 relative shadow-2xs"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {point.revenue > 0 && (
                      <div className="absolute top-1 left-0 right-0 text-center text-[9px] font-extrabold text-white/90 truncate px-0.5 hidden sm:block">
                        {point.orders}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap rotate-0 truncate max-w-full text-center">
                    {point.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Height represents daily gross revenue</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Daily Revenue
            </span>
          </div>
        </div>

        {/* Top 5 Best-Selling Dishes Leaderboard (Span 1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900">
                Top Performing Dishes
              </h2>
              <p className="text-[11px] text-slate-400">
                By order volume & gross sales
              </p>
            </div>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3.5">
            {topDishes.map((dish, idx) => {
              const relativePercent = maxDishQuantity > 0
                ? Math.round((dish.quantity / maxDishQuantity) * 100)
                : 0;

              return (
                <div key={dish.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800 font-extrabold"
                          : idx === 1
                          ? "bg-slate-200 text-slate-700 font-bold"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {dish.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-slate-900 font-display">
                        {dish.quantity} sold
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatCurrency(dish.revenue, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx === 0 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${relativePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {topDishes.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No dish sales recorded yet in this time window.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Peak Ordering Hours Breakdown Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Kitchen Rush & Peak Ordering Hours</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Distribution of incoming orders across all 24 hours of the day
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-200" /> Quiet
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 ml-1" /> Moderate
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 ml-1" /> Rush Hour
          </div>
        </div>

        {/* 24-Hour Grid Heatmap */}
        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5">
          {peakHours.map((h) => {
            const intensityRatio = maxPeakOrders > 0 ? h.orders / maxPeakOrders : 0;
            let bgClass = "bg-slate-50 text-slate-400 border border-slate-100";
            if (intensityRatio > 0.6) {
              bgClass = "bg-emerald-600 text-white font-extrabold shadow-xs";
            } else if (intensityRatio > 0.3) {
              bgClass = "bg-emerald-400 text-slate-900 font-bold";
            } else if (intensityRatio > 0) {
              bgClass = "bg-emerald-100 text-emerald-800 font-medium";
            }

            return (
              <div
                key={h.hour}
                className={`p-2 rounded-xl text-center flex flex-col items-center justify-between min-h-16 transition hover:scale-105 cursor-default ${bgClass}`}
                title={`${h.label}: ${h.orders} orders (${formatCurrency(h.revenue, currency)})`}
              >
                <span className="text-[9px] uppercase tracking-wider block opacity-75">
                  {h.label.split(" ")[0]}
                </span>
                <span className="text-xs my-0.5">
                  {h.orders}
                </span>
                <span className="text-[8px] opacity-70 block">
                  {h.label.split(" ")[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
