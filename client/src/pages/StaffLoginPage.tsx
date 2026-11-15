import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UtensilsCrossed, Lock, Mail, Store, ChefHat, Users, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import api from "../utils/api";
import useAuthStore from "../stores/authStore";

export const StaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const initialVenue = searchParams.get("restaurant") || searchParams.get("venue") || "";
  const [restaurantIdentifier, setRestaurantIdentifier] = useState(initialVenue);
  const [email, setEmail] = useState("");
  const [pinOrPassword, setPinOrPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantIdentifier.trim() || !email.trim() || !pinOrPassword) {
      setError("Please fill in all station login fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/auth/staff-login", {
        restaurantIdentifier: restaurantIdentifier.trim(),
        email: email.trim().toLowerCase(),
        pinOrPassword,
      });

      const { token, staff, restaurant } = res.data;

      // Persist auth state with staff flags
      setAuth(
        token,
        {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          isStaff: true,
          restaurantId: staff.restaurantId,
        },
        restaurant ? [restaurant] : []
      );

      // Route according to assigned station role
      if (staff.role === "KITCHEN") {
        navigate("/dashboard/orders", { replace: true });
      } else if (staff.role === "WAITER") {
        navigate("/dashboard/floor", { replace: true });
      } else {
        navigate("/dashboard/orders", { replace: true });
      }
    } catch (err: any) {
      console.error("Staff login error:", err);
      setError(
        err.response?.data?.error || "Station login failed. Please verify venue slug, email, and PIN."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-white">
              Dineeze
            </span>
          </Link>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff Station Portal</span>
          </div>

          <h2 className="mt-3 text-xl font-display font-bold text-white tracking-tight">
            Log in to your operational station
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            For Kitchen Staff, Waiters, and Station Managers
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Restaurant Venue Identifier */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Restaurant Branch / Slug
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={restaurantIdentifier}
                  onChange={(e) => setRestaurantIdentifier(e.target.value)}
                  placeholder="e.g. downtown-branch"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Provided by your restaurant owner or manager
              </p>
            </div>

            {/* Staff Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* PIN or Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Station PIN / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={pinOrPassword}
                  onChange={(e) => setPinOrPassword(e.target.value)}
                  placeholder="Enter 4-digit PIN or password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tracking-wider font-mono transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Station...</span>
                </>
              ) : (
                <>
                  <span>Enter Operational Station</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Supported Roles Pill Bar */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center mb-2.5">
              Available Station Roles
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-center">
                <ChefHat className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-300 block">Kitchen</span>
                <span className="text-[9px] text-slate-400 block">KDS display</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-center">
                <Users className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-300 block">Waiter</span>
                <span className="text-[9px] text-slate-400 block">Floor & bills</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-300 block">Manager</span>
                <span className="text-[9px] text-slate-400 block">Floor & KDS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Owner Portal */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Are you a restaurant owner?{" "}
            <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition">
              Log in to Restaurant Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;

