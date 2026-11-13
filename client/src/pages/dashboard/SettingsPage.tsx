import React, { useState } from "react";
import {
  Save,
  Upload,
  Check,
  AlertCircle,
  Wifi,
  Smartphone,
  UtensilsCrossed,
  Loader2,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";
import { getContrastTextColor } from "../../utils/color";

export const SettingsPage: React.FC = () => {
  const { activeRestaurant, updateActiveRestaurant } = useAuthStore();

  const [name, setName] = useState(activeRestaurant?.name || "");
  const [description, setDescription] = useState(activeRestaurant?.description || "");
  const [currency, setCurrency] = useState(activeRestaurant?.currency || "USD");
  const [accentColor, setAccentColor] = useState(activeRestaurant?.accentColor || "#10B981");
  const [logoUrl, setLogoUrl] = useState(activeRestaurant?.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(activeRestaurant?.bannerUrl || "");
  const [address, setAddress] = useState(activeRestaurant?.address || "");
  const [wifiPassword, setWifiPassword] = useState(activeRestaurant?.wifiPassword || "");

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetColors = [
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#0F172A", // Slate-900
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurant) return;

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const payload = {
        name,
        description,
        currency,
        accentColor,
        logoUrl,
        bannerUrl,
        address,
        wifiPassword,
      };

      const res = await api.patch(`/api/restaurants/${activeRestaurant.id}`, payload);
      updateActiveRestaurant(res.data.restaurant);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update restaurant settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", `dineeze/${activeRestaurant?.slug || "general"}`);

    try {
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (field === "logo") {
        setLogoUrl(res.data.url);
      } else {
        setBannerUrl(res.data.url);
      }
    } catch (err) {
      console.warn("Upload fallback:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === "logo") setLogoUrl(reader.result as string);
        else setBannerUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const contrastColor = getContrastTextColor(accentColor);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900">
            Brand Identity & Restaurant Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time split-screen customizer with instant customer mobile preview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Settings saved successfully! Mobile menu updated.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Restaurant Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Authentic artisan cuisine..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Culinary Blvd, Suite 100"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guest Wi-Fi Password
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="GuestPassword123"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Accent Color Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Brand Accent Color: <span className="font-mono text-accent">{accentColor}</span>
              </label>
              <div className="flex items-center gap-2.5">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      accentColor === color ? "scale-125 ring-2 ring-slate-400" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                  title="Choose custom hex color"
                />
              </div>
            </div>

            {/* Logo and Banner Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo</label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "logo")} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Banner</label>
                <div className="flex items-center gap-3">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="w-20 h-12 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-20 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border text-[10px]">
                      No Banner
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload Banner
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "banner")} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent-hover transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Brand Settings
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Phone Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-slate-900 rounded-[44px] p-4 shadow-2xl border-4 border-slate-800">
            {/* Phone Screen */}
            <div className="bg-canvas rounded-[32px] overflow-hidden min-h-[520px] flex flex-col border border-slate-200">
              {/* Simulator Banner */}
              <div
                className="h-28 bg-slate-200 bg-cover bg-center relative"
                style={{
                  backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                  backgroundColor: accentColor,
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute -bottom-5 left-4 flex items-end gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border border-slate-100 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-accent">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulator Header */}
              <div className="pt-7 px-4 pb-2 space-y-1">
                <h3 className="font-display font-extrabold text-base text-slate-900 leading-tight">
                  {name || "Restaurant Name"}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {description || "Artisan dining & craft cuisine"}
                </p>

                {wifiPassword && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-medium">
                    <Wifi className="w-3 h-3 text-slate-400" />
                    <span>Wi-Fi: {wifiPassword}</span>
                  </div>
                )}
              </div>

              {/* Sample Category Pills */}
              <div className="px-4 py-2 flex gap-1.5 border-b border-slate-200/60 overflow-x-hidden">
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold shadow-sm"
                  style={{
                    backgroundColor: accentColor,
                    color: contrastColor,
                  }}
                >
                  Starters
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                  Main Course
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                  Drinks
                </span>
              </div>

              {/* Sample Dish Card */}
              <div className="p-4 space-y-2 flex-1">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-xs text-slate-900">Sample Dish Item</p>
                    <p className="text-[10px] text-slate-400">Freshly prepared</p>
                    <p className="text-xs font-bold text-slate-900 mt-1">$14.50</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm"
                    style={{
                      backgroundColor: accentColor,
                      color: contrastColor,
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Floating Bottom Cart Preview */}
              <div className="p-3 bg-white border-t border-slate-200">
                <div
                  className="py-2 px-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-md"
                  style={{
                    backgroundColor: accentColor,
                    color: contrastColor,
                  }}
                >
                  <span>1 Item • $14.50</span>
                  <span>View Order →</span>
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5" /> Live Syncing Phone Simulator
          </span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
