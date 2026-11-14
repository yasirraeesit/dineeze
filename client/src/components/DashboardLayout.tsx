import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  UtensilsCrossed,
  ChefHat,
  BookOpen,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
  ExternalLink,
  ShoppingBag,
  DollarSign,
  Clock,
  Sparkles,
  RotateCw,
} from "lucide-react";
import useAuthStore from "../stores/authStore";
import api from "../utils/api";
import audioChime from "./AudioChime";
import useSocket from "../hooks/useSocket";
import { formatCurrency } from "../utils/currency";

interface DashboardKPIs {
  todayOrdersCount: number;
  todayRevenue: number;
  activeQueueCount: number;
  menuAvailabilityPercent: number;
  totalDishesCount: number;
  activeDishesCount: number;
}

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRestaurant, restaurants, setAuth, setActiveRestaurant, logout } = useAuthStore();
  const socket = useSocket("restaurant", activeRestaurant?.id);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioChime.getMuted());
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [firstTableToken, setFirstTableToken] = useState<string | null>(null);

  // Live KPI metrics
  const [kpis, setKpis] = useState<DashboardKPIs>({
    todayOrdersCount: 0,
    todayRevenue: 0,
    activeQueueCount: 0,
    menuAvailabilityPercent: 100,
    totalDishesCount: 0,
    activeDishesCount: 0,
  });

  // Track socket connection
  useEffect(() => {
    if (!socket) return;
    setIsSocketConnected(socket.connected);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  // Unlock audio context on first click
  useEffect(() => {
    const handleInteraction = () => {
      audioChime.unlock();
      window.removeEventListener("click", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    return () => window.removeEventListener("click", handleInteraction);
  }, []);

  // Fetch restaurants if not already in store
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await api.get("/api/restaurants");
        if (res.data?.restaurants) {
          if (!activeRestaurant && res.data.restaurants.length > 0) {
            setActiveRestaurant(res.data.restaurants[0]);
          }
          if (user) {
            setAuth(localStorage.getItem("dineeze_token") || "", user, res.data.restaurants);
          }
        }
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
      }
    };

    fetchRestaurants();
  }, []);

  // Fetch KPI data & first table token for preview
  const refreshKPIs = async () => {
    if (!activeRestaurant) return;
    try {
      // 1. Fetch Orders for metrics
      const ordersRes = await api.get(`/api/orders?restaurantId=${activeRestaurant.id}`);
      const orders: any[] = ordersRes.data.orders || [];

      // Calculate today's orders & revenue
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayOrders = orders.filter((o) => o.createdAt?.slice(0, 10) === todayStr);

      const todayRevenue = todayOrders.reduce((sum, o) => {
        return sum + (Number(o.totalAmount) || 0);
      }, 0);

      const activeQueue = orders.filter(
        (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PREPARING"
      ).length;

      // 2. Fetch Menu dishes for availability percentage
      const menuRes = await api.get(`/api/menu/categories?restaurantId=${activeRestaurant.id}`);
      const categories: any[] = menuRes.data.categories || [];
      let totalDishes = 0;
      let activeDishes = 0;

      categories.forEach((c) => {
        if (c.dishes) {
          c.dishes.forEach((d: any) => {
            totalDishes++;
            if (d.isAvailable) activeDishes++;
          });
        }
      });

      const availabilityPercent = totalDishes > 0 ? Math.round((activeDishes / totalDishes) * 100) : 100;

      setKpis({
        todayOrdersCount: todayOrders.length > 0 ? todayOrders.length : orders.length,
        todayRevenue: todayRevenue > 0 ? todayRevenue : orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
        activeQueueCount: activeQueue,
        menuAvailabilityPercent: availabilityPercent,
        totalDishesCount: totalDishes,
        activeDishesCount: activeDishes,
      });

      // 3. Fetch first table token for Guest Preview button
      const tablesRes = await api.get(`/api/tables?restaurantId=${activeRestaurant.id}`);
      if (tablesRes.data?.tables?.length > 0) {
        setFirstTableToken(tablesRes.data.tables[0].qrToken);
      }
    } catch (err) {
      console.warn("Could not load dashboard metrics:", err);
    }
  };

  useEffect(() => {
    refreshKPIs();
  }, [activeRestaurant?.id]);

  // Listen to incoming orders for real-time KPI counter updates
  useEffect(() => {
    if (!socket || !activeRestaurant?.id) return;
    const handleOrderEvent = () => refreshKPIs();
    socket.on("new_order", handleOrderEvent);
    socket.on("order_status_updated", handleOrderEvent);
    return () => {
      socket.off("new_order", handleOrderEvent);
      socket.off("order_status_updated", handleOrderEvent);
    };
  }, [socket, activeRestaurant?.id]);

  const navItems = [
    { label: "Live KDS Orders", path: "/dashboard/orders", icon: ChefHat, badge: kpis.activeQueueCount > 0 ? kpis.activeQueueCount : undefined },
    { label: "Menu Builder", path: "/dashboard/menu", icon: BookOpen, subtext: `${kpis.totalDishesCount} dishes` },
    { label: "Tables & Posters", path: "/dashboard/tables", icon: QrCode },
    { label: "Brand & Settings", path: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSound = () => {
    const muted = audioChime.toggleMute();
    setIsMuted(muted);
  };

  const previewGuestUrl = firstTableToken
    ? `/m/${firstTableToken}`
    : `/m/table-1-${activeRestaurant?.slug || "demo"}`;

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-sidebar text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight block leading-tight">
              {activeRestaurant?.name || "Dineeze"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Kitchen Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Socket Indicator Mobile */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
            title={isSocketConnected ? "Kitchen Live (Connected)" : "Connecting..."}
          />

          <button
            onClick={toggleSound}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-sidebar text-white flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out border-r border-slate-800/80 shadow-xl md:shadow-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Logo & Wordmark Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <Link to="/dashboard/orders" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-tight block leading-tight text-white">
                  Dineeze
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                  B2B Kitchen OS
                </span>
              </div>
            </Link>
          </div>

          {/* Restaurant Switcher & Profile Card */}
          <div className="p-3 border-b border-slate-800/80 relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-left transition border border-slate-700/60 group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: activeRestaurant?.accentColor || "#10B981" }}
                >
                  {activeRestaurant?.logoUrl ? (
                    <img src={activeRestaurant.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    activeRestaurant?.name?.charAt(0) || "R"
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">
                    {activeRestaurant?.name || "Select Restaurant"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    /{activeRestaurant?.slug || ""}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-white transition-colors" />
            </button>

            {dropdownOpen && restaurants.length > 0 && (
              <div className="absolute top-full left-3 right-3 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 max-h-56 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Your Venues ({restaurants.length})
                </div>
                {restaurants.map((rest) => (
                  <button
                    key={rest.id}
                    onClick={() => {
                      setActiveRestaurant(rest);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition ${
                      activeRestaurant?.id === rest.id ? "text-emerald-400 font-bold bg-slate-800/40" : "text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: rest.accentColor || "#10B981" }}
                      />
                      <span className="truncate">{rest.name}</span>
                    </div>
                    {activeRestaurant?.id === rest.id && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links with Active Indicator Pill */}
          <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
                    <span>{item.label}</span>
                  </div>

                  {/* Active Indicator & Badge */}
                  <div className="flex items-center gap-1.5">
                    {item.badge && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Controls */}
        <div className="p-3 border-t border-slate-800/80 space-y-2.5 bg-slate-950/40">
          {/* Audio Chime Mute/Unmute */}
          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition border border-slate-700/40 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="font-medium">KDS Audio Chime</span>
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                isMuted ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {isMuted ? "MUTED" : "ON"}
            </span>
          </button>

          {/* Owner details & Logout */}
          <div className="flex items-center justify-between px-1.5 pt-1">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.name || "Restaurant Operator"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
              title="Sign Out of Kitchen Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-canvas">
        {/* Top Utility Bar (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/90">
          {/* Left: Venue Context & WebSocket Beacon */}
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm text-slate-900">
              {activeRestaurant?.name || "Restaurant Dashboard"}
            </span>
            <span className="text-slate-300">•</span>
            {/* Live Socket Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isSocketConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSocketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="font-mono text-[11px]">
                {isSocketConnected ? "Kitchen Live (Socket Connected)" : "Reconnecting Sockets..."}
              </span>
            </div>
          </div>

          {/* Right: Quick Utility Actions */}
          <div className="flex items-center gap-3">
            {/* Refresh KPIs */}
            <button
              onClick={refreshKPIs}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Refresh live metrics"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Audio chime toggle */}
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isMuted
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{isMuted ? "Sound Muted" : "Chime Active"}</span>
            </button>

            {/* Preview Guest Menu ↗ */}
            <a
              href={previewGuestUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition flex items-center gap-1.5 group"
            >
              <span>Preview Guest Menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </header>

        {/* 4-Card KPI Strip */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Today's Orders */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Today&apos;s Orders
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-display tabular-nums text-slate-950 mt-1">
                  {kpis.todayOrdersCount}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live ticket stream
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Today's Revenue */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Today&apos;s Revenue
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-display tabular-nums text-slate-950 mt-1">
                  {formatCurrency(kpis.todayRevenue, activeRestaurant?.currency)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {activeRestaurant?.currency || "USD"} table sales
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Active Kitchen Queue */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Active Queue
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-display tabular-nums text-slate-950 mt-1">
                  {kpis.activeQueueCount}
                </p>
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Pending & Cooking
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Menu Availability */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Menu Availability
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-display tabular-nums text-slate-950 mt-1">
                  {kpis.menuAvailabilityPercent}%
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {kpis.activeDishesCount}/{kpis.totalDishesCount} in stock
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Viewport Outlet for child dashboard pages */}
        <main className="flex-1 min-w-0 p-4 sm:px-6 lg:px-8 pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </div>
  );
};

export default DashboardLayout;
