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
} from "lucide-react";
import useAuthStore from "../stores/authStore";
import api from "../utils/api";
import audioChime from "./AudioChime";

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRestaurant, restaurants, setAuth, setActiveRestaurant, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioChime.getMuted());

  // Unlock audio context on user interaction
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

  const navItems = [
    { label: "Live KDS Orders", path: "/dashboard/orders", icon: ChefHat },
    { label: "Menu Builder", path: "/dashboard/menu", icon: BookOpen },
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

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row font-sans">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-sidebar text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Dineeze</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-sidebar text-white flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Brand */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <Link to="/dashboard/orders" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight block leading-none">
                  Dineeze
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Kitchen Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Restaurant Switcher */}
          <div className="p-3 border-b border-slate-800 relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                  style={{ backgroundColor: activeRestaurant?.accentColor || "#10B981" }}
                >
                  {activeRestaurant?.name?.charAt(0) || "R"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {activeRestaurant?.name || "Select Restaurant"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    /{activeRestaurant?.slug || ""}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && restaurants.length > 0 && (
              <div className="absolute top-full left-3 right-3 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                {restaurants.map((rest) => (
                  <button
                    key={rest.id}
                    onClick={() => {
                      setActiveRestaurant(rest);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-800 transition ${
                      activeRestaurant?.id === rest.id ? "text-accent font-semibold" : "text-slate-300"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: rest.accentColor || "#10B981" }}
                    />
                    <span className="truncate">{rest.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-accent text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Controls */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Audio Chime Mute/Unmute */}
          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-300 transition"
          >
            <span className="flex items-center gap-2">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>KDS Audio Chime</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {isMuted ? "MUTED" : "ON"}
            </span>
          </button>

          {/* Owner details */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || "Restaurant Owner"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 bg-canvas overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </div>
  );
};

export default DashboardLayout;

