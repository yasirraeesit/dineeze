import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ArrowRight,
  ArrowLeft,
  Check,
  Building,
  User,
  QrCode,
  AlertCircle,
  Loader2,
  Upload,
} from "lucide-react";
import api from "../utils/api";
import useAuthStore from "../stores/authStore";
import { SUPPORTED_CURRENCIES } from "../utils/currency";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Owner Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Restaurant Profile
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [accentColor, setAccentColor] = useState("#10B981");
  const [logoUrl, setLogoUrl] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Step 3: Table Generator
  const [tableCount, setTableCount] = useState(8);

  const autoSlug = (val: string) => {
    setRestaurantName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      // In development / demo, we use a FileReader or demo image if no token yet
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Logo preview error:", err);
      setUploadingLogo(false);
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Register User
      const authRes = await api.post("/api/auth/register", {
        name,
        email: email.trim(),
        password,
      });

      const { token, user } = authRes.data;
      localStorage.setItem("dineeze_token", token);

      // 2. Setup Restaurant + Auto-generate tables in single transaction
      const restRes = await api.post(
        "/api/restaurants",
        {
          name: restaurantName,
          slug: slug.trim(),
          currency,
          accentColor,
          logoUrl: logoUrl.startsWith("http") ? logoUrl : "",
          wifiPassword: wifiPassword.trim(),
          tableCount: Number(tableCount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const restaurant = restRes.data.restaurant;
      setAuth(token, user, [restaurant]);
      navigate("/dashboard/orders");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please check inputs.");
      setLoading(false);
    }
  };

  const presetColors = [
    "#10B981", // Emerald (Default)
    "#3B82F6", // Blue
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#1E293B", // Slate
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shadow-md">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight text-slate-900">
            Dineeze
          </span>
        </Link>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-900">
          Create Your Restaurant Portal
        </h2>
        <p className="text-xs text-slate-500">
          Step-by-step setup in under 2 minutes. No credit card required.
        </p>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {[
            { num: 1, label: "Account", icon: User },
            { num: 2, label: "Restaurant", icon: Building },
            { num: 3, label: "Tables", icon: QrCode },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  step === s.num
                    ? "bg-accent text-white"
                    : step > s.num
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                <span>{s.label}</span>
              </div>
              {s.num < 3 && <div className="w-6 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Owner Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Step 1: Owner Account
                </h3>
                <p className="text-xs text-slate-500">
                  Your credentials to log into the kitchen portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Chef Marco"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>

              <button
                type="button"
                disabled={!name || !email || password.length < 6}
                onClick={() => setStep(2)}
                className="w-full mt-4 py-3 px-4 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue to Restaurant Setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Restaurant Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Step 2: Restaurant Profile & Branding
                </h3>
                <p className="text-xs text-slate-500">
                  Customize the guest-facing appearance and URL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => autoSlug(e.target.value)}
                  placeholder="The Spice Kitchen"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Live URL Slug
                </label>
                <div className="flex rounded-xl shadow-sm border border-slate-300 overflow-hidden text-sm">
                  <span className="bg-slate-100 text-slate-500 px-3 py-2.5 text-xs font-mono select-none">
                    /m/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="the-spice-kitchen"
                    className="flex-1 px-3 py-2.5 font-mono text-xs focus:outline-none"
                  />
                </div>
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
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.label}
                      </option>
                    ))}
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
                    placeholder="SpiceGuest2026"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Accent Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Brand Accent Color: <span className="font-mono text-accent">{accentColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccentColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        accentColor === color ? "scale-125 ring-2 ring-slate-400" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                    title="Choose custom color"
                  />
                </div>
              </div>

              {/* Logo Upload Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restaurant Logo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  disabled={!restaurantName || !slug}
                  onClick={() => setStep(3)}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent-hover transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  Configure Tables <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Table Count Generator */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Step 3: Table Count Generator
                </h3>
                <p className="text-xs text-slate-500">
                  How many dining tables should Dineeze generate QR codes for?
                </p>
              </div>

              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-4xl font-extrabold font-display text-accent block">
                  {tableCount}
                </span>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tables will be generated (Table 01 to Table {String(tableCount).padStart(2, "0")})
                </span>
                <div className="max-w-xs mx-auto mt-4 px-4">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={tableCount}
                    onChange={(e) => setTableCount(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 table</span>
                    <span>25 tables</span>
                    <span>50 tables</span>
                  </div>
                </div>
              </div>

              {/* Preview sample tokens */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Preview generated tables:</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {Array.from({ length: Math.min(tableCount, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                    >
                      Table {String(i + 1).padStart(2, "0")}
                    </div>
                  ))}
                  {tableCount > 8 && (
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center text-[10px]">
                      +{tableCount - 8} more
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalSubmit}
                  className="py-3 px-6 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover transition shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Portal...
                    </>
                  ) : (
                    <>
                      Launch Restaurant Portal <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

