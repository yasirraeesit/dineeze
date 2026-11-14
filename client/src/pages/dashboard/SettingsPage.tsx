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
  Sparkles,
  MapPin,
  Globe,
  Palette,
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
    { label: "Emerald", hex: "#10B981" },
    { label: "Electric Blue", hex: "#3B82F6" },
    { label: "Amber Sun", hex: "#F59E0B" },
    { label: "Ruby Crimson", hex: "#EF4444" },
    { label: "Deep Violet", hex: "#8B5CF6" },
    { label: "Cyan Aqua", hex: "#06B6D4" },
    { label: "Hot Rose", hex: "#EC4899" },
    { label: "Obsidian Slate", hex: "#0F172A" },
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
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-950">
              Brand Studio & Restaurant Settings
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live Studio
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual customizer with instantaneous guest mobile phone simulation.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Settings Form (Col 1-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-6">
          {savedSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                Brand settings saved successfully! Live guest menu updated immediately.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Restaurant Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Spice Kitchen"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Tagline / Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tagline & Culinary Concept
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Authentic artisan Indian & contemporary fusion cuisine."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Physical Dining Room Address
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 104 Market St, Suite A, Downtown"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Currency & Wi-Fi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Menu Currency Format
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                    <option value="AUD">AUD ($ - Australian Dollar)</option>
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Guest Table Wi-Fi Password
                </label>
                <div className="relative">
                  <Wifi className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="e.g. DineGuest2026"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Brand Accent Color Engine */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Brand Accent Color Palette
                </label>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                  {accentColor}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                This color dynamically themes customer cart actions, buttons, and badges in real time.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {presetColors.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setAccentColor(color.hex)}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                      accentColor === color.hex
                        ? "scale-125 ring-2 ring-offset-2 ring-slate-900 shadow-sm"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  />
                ))}

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                    title="Select custom hex color"
                  />
                  <Palette className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Media Uploaders: Logo & Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              {/* Logo Uploader */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Restaurant Logo
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <UtensilsCrossed className="w-6 h-6" />
                    </div>
                  )}
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "logo")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Cover Banner Uploader */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hero Cover Banner
                </label>
                <div className="flex items-center gap-3">
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt="Banner"
                      className="w-20 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-20 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-medium">
                      No Banner
                    </div>
                  )}
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "banner")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Brand Studio Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Sticky Phone Simulator Frame (Col 8-12) */}
        <div className="lg:col-span-5 sticky top-20 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-950/20">
            {/* Phone Top Notch / Speaker Slit */}
            <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
              <div className="w-6 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-canvas rounded-[30px] overflow-hidden min-h-[500px] flex flex-col border border-slate-200 text-left">
              {/* Simulator Hero Cover Banner */}
              <div
                className="h-28 bg-slate-200 bg-cover bg-center relative"
                style={{
                  backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                  backgroundColor: accentColor,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute -bottom-5 left-3.5 flex items-end gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border border-slate-100 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white rounded-xl"
                        style={{ backgroundColor: accentColor }}
                      >
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulator Restaurant Header */}
              <div className="pt-6 px-3.5 pb-2 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-extrabold text-sm text-slate-950 leading-tight truncate">
                    {name || "Restaurant Name"}
                  </h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Table 01
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {description || "Artisan dining & contemporary cuisine"}
                </p>

                {wifiPassword && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-medium">
                    <Wifi className="w-3 h-3 text-slate-400" />
                    <span>Wi-Fi: {wifiPassword}</span>
                  </div>
                )}
              </div>

              {/* Category Pills with Active Tenant Accent */}
              <div className="px-3.5 py-1.5 flex gap-1.5 border-b border-slate-200/60 overflow-x-hidden">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs transition-colors"
                  style={{
                    backgroundColor: accentColor,
                    color: contrastColor,
                  }}
                >
                  Featured
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                  Main Course
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                  Drinks
                </span>
              </div>

              {/* Sample Dish Card Inside Phone */}
              <div className="p-3.5 space-y-2 flex-1">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-xs text-slate-900">Smoky Truffle Burger</p>
                    <p className="text-[10px] text-slate-400">Black angus & truffle aioli</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">$16.50</p>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs transition-colors"
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
                  className="py-2 px-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm transition-colors"
                  style={{
                    backgroundColor: accentColor,
                    color: contrastColor,
                  }}
                >
                  <span>1 Item • $16.50</span>
                  <span className="flex items-center gap-1">
                    View Order <Sparkles className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium mt-2.5 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            Live Syncing Mobile Guest Simulator
          </span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
