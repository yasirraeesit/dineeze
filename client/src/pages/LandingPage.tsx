import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  UtensilsCrossed,
  ChefHat,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Plus,
  Menu as MenuIcon,
  X,
  Check,
  Printer,
  Store,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Star,
} from "lucide-react";

// Web Audio synthesizer for the authentic Kitchen Display System bell chime
const playKitchenChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell strike (880Hz / A5 chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Harmonic bell overtone (1320Hz / E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1320, now + 0.05);
    gain2.gain.setValueAtTime(0.15, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.55);
  } catch {
    // Audio autoplay silent fallback
  }
};

type SupportedCurrency = "USD" | "PKR" | "INR" | "GBP";

interface CurrencyConfig {
  label: string;
  symbol: string;
  rate: number;
  format: (amountUSD: number) => string;
}

const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    label: "USD ($)",
    symbol: "$",
    rate: 1,
    format: (v) => `$${v.toFixed(2)}`,
  },
  PKR: {
    label: "PKR (Rs)",
    symbol: "Rs. ",
    rate: 278,
    format: (v) => `Rs. ${Math.round(v * 278).toLocaleString()}`,
  },
  INR: {
    label: "INR (₹)",
    symbol: "₹",
    rate: 83,
    format: (v) => `₹${Math.round(v * 83).toLocaleString()}`,
  },
  GBP: {
    label: "GBP (£)",
    symbol: "£",
    rate: 0.79,
    format: (v) => `£${(v * 0.79).toFixed(2)}`,
  },
};

interface FoodItem {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  image: string;
}

const HERO_DISHES: FoodItem[] = [
  {
    id: "burger",
    name: "Truffle Smash Burger",
    category: "Mains",
    priceUSD: 16.5,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "fries",
    name: "Loaded Peri Fries",
    category: "Sides",
    priceUSD: 6.5,
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "latte",
    name: "Iced Spanish Latte",
    category: "Drinks",
    priceUSD: 4.5,
    image:
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=300&q=80",
  },
];

interface KDSTicketItem {
  id: string;
  name: string;
  qty: number;
  isPrepared: boolean;
}

interface KDSTicket {
  id: string;
  orderNumber: string;
  table: string;
  items: KDSTicketItem[];
  status: "PENDING" | "PREPARING" | "READY";
  elapsedSeconds: number;
}

export const LandingPage: React.FC = () => {
  // Navigation & Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Section 1: Playable Hero Simulation State
  const [heroCurrency, setHeroCurrency] = useState<SupportedCurrency>("USD");
  const [heroCart, setHeroCart] = useState<Record<string, number>>({ burger: 1 });
  const [phoneOrderStatus, setPhoneOrderStatus] = useState<"IDLE" | "SENT" | "READY">("IDLE");
  const [orderPulseAlert, setOrderPulseAlert] = useState<string | null>(null);

  const [heroTickets, setHeroTickets] = useState<KDSTicket[]>([
    {
      id: "ticket-108",
      orderNumber: "108",
      table: "Table 02",
      items: [
        { id: "it-1", name: "Artisan Margherita", qty: 2, isPrepared: true },
        { id: "it-2", name: "Craft Berry Lemonade", qty: 1, isPrepared: true },
      ],
      status: "PREPARING",
      elapsedSeconds: 142,
    },
  ]);

  // Section 3: 3-Perspective Role Switcher
  const [activeRole, setActiveRole] = useState<"guest" | "kitchen" | "owner">("guest");
  const [guestStarRating, setGuestStarRating] = useState<number>(5);
  const [guestUpsellActive, setGuestUpsellActive] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<"flagship" | "marina" | "airport">("flagship");
  const [splitGuestCount, setSplitGuestCount] = useState<number>(3);

  // Section 4: Table Craft Acrylic Stand Swatch
  const [acrylicColor, setAcrylicColor] = useState<"emerald" | "obsidian" | "terracotta" | "royal">("emerald");

  // Section 5: ROI Calculator
  const [roiTables, setRoiTables] = useState<number>(18);
  const [roiDailyOrders, setRoiDailyOrders] = useState<number>(4);
  const [roiCurrency, setRoiCurrency] = useState<SupportedCurrency>("USD");

  // Section 6: Pricing
  const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual");

  // Ticking elapsed seconds for live KDS tickets
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroTickets((prev) =>
        prev.map((t) =>
          t.status !== "READY" ? { ...t, elapsedSeconds: t.elapsedSeconds + 1 } : t
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Add Item in Phone Mockup
  const handleAddDish = (dishId: string) => {
    setHeroCart((prev) => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1,
    }));
  };

  // Calculate Phone Cart Subtotal
  const heroCartTotalUSD = useMemo(() => {
    return Object.entries(heroCart).reduce((total, [dishId, qty]) => {
      const dish = HERO_DISHES.find((d) => d.id === dishId);
      return total + (dish ? dish.priceUSD * qty : 0);
    }, 0);
  }, [heroCart]);

  const heroCartCount = useMemo(() => {
    return Object.values(heroCart).reduce((a, b) => a + b, 0);
  }, [heroCart]);

  // Fire Order from Phone to KDS
  const handleFireOrder = () => {
    if (heroCartCount === 0) return;

    if (soundEnabled) {
      playKitchenChime();
    }

    const orderNum = Math.floor(109 + Math.random() * 40).toString();
    const newItems: KDSTicketItem[] = Object.entries(heroCart).map(([dishId, qty]) => {
      const dish = HERO_DISHES.find((d) => d.id === dishId);
      return {
        id: `hero-${dishId}-${Date.now()}`,
        name: dish ? dish.name : "Custom Dish",
        qty,
        isPrepared: false,
      };
    });

    const newTicket: KDSTicket = {
      id: `ticket-${Date.now()}`,
      orderNumber: orderNum,
      table: "Table 04",
      items: newItems,
      status: "PENDING",
      elapsedSeconds: 0,
    };

    setHeroTickets((prev) => [newTicket, ...prev.slice(0, 2)]);
    setPhoneOrderStatus("SENT");
    setOrderPulseAlert(`Order #${orderNum} fired to Kitchen KDS in 0.12s!`);

    setTimeout(() => {
      setOrderPulseAlert(null);
    }, 3800);
  };

  // Toggle item prep in KDS
  const handleTogglePrepItem = (ticketId: string, itemId: string) => {
    setHeroTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedItems = t.items.map((it) =>
            it.id === itemId ? { ...it, isPrepared: !it.isPrepared } : it
          );
          const allDone = updatedItems.every((it) => it.isPrepared);
          return {
            ...t,
            items: updatedItems,
            status: allDone ? "READY" : "PREPARING",
          };
        }
        return t;
      })
    );
  };

  // Mark ticket ready in KDS (updates phone state in real-time)
  const handleMarkTicketReady = (ticketId: string) => {
    setHeroTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "READY" } : t))
    );
    setPhoneOrderStatus("READY");
    if (soundEnabled) {
      playKitchenChime();
    }
  };

  // Reset hero simulation
  const handleResetSimulation = () => {
    setHeroCart({ burger: 1 });
    setPhoneOrderStatus("IDLE");
  };

  // Smooth scroll
  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ROI computations in selected currency
  const roiMultiplier = CURRENCIES[roiCurrency].rate;
  const avgCheckUSD = 36;
  const monthlyOrders = roiTables * roiDailyOrders * 30;
  const monthlyUpsellLift = Math.round(monthlyOrders * avgCheckUSD * 0.22 * roiMultiplier);
  const annualPrintSavings = Math.round(roiTables * 32 * 12 * roiMultiplier);
  const annualTotalGain = monthlyUpsellLift * 12 + annualPrintSavings;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111315] font-sans antialiased overflow-x-hidden selection:bg-amber-100 selection:text-amber-950">
      {/* ========================================================= */}
      {/* 1. CLEAN RESPONSIVE NAVBAR (H-16 / 64PX)                  */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Left Brand Mark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-[#111315] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight text-[#111315]">
                Dineeze
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                V2.6 OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <button
              onClick={() => scrollTo("hero-simulator")}
              className="hover:text-[#111315] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Live Sandbox
            </button>
            <button
              onClick={() => {
                setActiveRole("kitchen");
                scrollTo("role-switcher");
              }}
              className="hover:text-[#111315] transition-colors cursor-pointer"
            >
              Kitchen OS
            </button>
            <button
              onClick={() => {
                setActiveRole("owner");
                scrollTo("role-switcher");
              }}
              className="hover:text-[#111315] transition-colors cursor-pointer"
            >
              Multi-Branch
            </button>
            <button
              onClick={() => scrollTo("pricing-section")}
              className="hover:text-[#111315] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Desktop CTAs (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              to="/staff-login"
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 px-2 py-1 transition"
            >
              Staff Portal
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold text-stone-700 hover:text-[#111315] px-3 py-1.5 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#111315] text-white hover:bg-stone-800 shadow-xs transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              Launch Free
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          </div>

          {/* Mobile & Tablet Controls (< 1024px) */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111315] text-white hover:bg-stone-800 transition whitespace-nowrap shrink-0"
            >
              Start Free
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 transition shrink-0"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Slide-Down Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-stone-200 bg-[#FAF8F5] px-4 py-5 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-stone-800">
              <button
                onClick={() => scrollTo("hero-simulator")}
                className="text-left py-1 hover:text-emerald-700 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Playable Live Sandbox
              </button>
              <button
                onClick={() => {
                  setActiveRole("kitchen");
                  scrollTo("role-switcher");
                }}
                className="text-left py-1 hover:text-emerald-700"
              >
                Kitchen OS & Floor
              </button>
              <button
                onClick={() => {
                  setActiveRole("owner");
                  scrollTo("role-switcher");
                }}
                className="text-left py-1 hover:text-emerald-700"
              >
                Multi-Branch & Audit Logs
              </button>
              <button
                onClick={() => scrollTo("roi-section")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Revenue & ROI Simulator
              </button>
              <button
                onClick={() => scrollTo("pricing-section")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Pricing Tiers
              </button>
            </nav>

            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
              <Link
                to="/staff-login"
                className="w-full text-center py-2 text-xs font-bold text-stone-700 bg-stone-100 rounded-lg border border-stone-200"
              >
                Staff Portal Sign In
              </Link>
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2 text-xs font-bold text-stone-800 bg-white rounded-lg border border-stone-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center py-2 text-xs font-bold bg-[#111315] text-white rounded-lg shadow-xs"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. SECTION 1 — PLAYABLE "SCAN -> KITCHEN" HERO STAGE       */}
      {/* ========================================================= */}
      <section id="hero-simulator" className="py-12 lg:py-20 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Top Hero Pitch */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              INTERACTIVE REVENUE ENGINE • TEST IT BELOW
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold font-display text-[#111315] tracking-tight leading-[1.08]">
              Turn every table into a{" "}
              <span className="font-serif italic font-normal text-amber-700">
                self-ordering revenue engine.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Zero app downloads. Zero proprietary hardware. Diners scan and order in 14 seconds from
              their own phones, while your kitchen displays receive sub-second synchronized tickets.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold bg-[#111315] text-white hover:bg-stone-800 transition shadow-xs text-sm flex items-center justify-center gap-2 group"
              >
                Create Free Restaurant
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/m/table-1-spice-kitchen"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 transition text-sm flex items-center justify-center gap-2 shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Open Full Guest Demo
              </Link>
            </div>
          </div>

          {/* Interactive Hero Simulator Stage: Phone Menu + KDS Board Side-by-Side */}
          <div className="relative rounded-2xl border border-stone-200 bg-white shadow-xs p-5 sm:p-7 space-y-4">
            {/* Simulation Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-stone-900">
                  Live Sandbox: Click &quot;+ Add&quot; then &quot;Fire Order to Kitchen&quot;
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition flex items-center gap-1 cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
                  <span>{soundEnabled ? "Bell ON" : "Muted"}</span>
                </button>
                <button
                  onClick={handleResetSimulation}
                  className="px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition flex items-center gap-1 cursor-pointer"
                  title="Reset demo cart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Notification Alert when fired */}
            {orderPulseAlert && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {orderPulseAlert}
                </span>
                <span className="font-mono text-[10px] text-emerald-700">0.12s Latency</span>
              </div>
            )}

            {/* The Dual Screen Sandbox (Phone + KDS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Screen: Interactive Phone Menu (lg:col-span-5) */}
              <div className="lg:col-span-5 rounded-2xl border-4 border-stone-900 bg-[#FAF8F5] p-4 shadow-sm space-y-3">
                {/* Phone Top Notch + Currency Switcher */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div>
                    <p className="font-display font-extrabold text-xs text-stone-900">
                      Table 04 • Spice Kitchen
                    </p>
                    <p className="text-[10px] text-stone-400">Scan to Order Active</p>
                  </div>

                  {/* Currency Pills */}
                  <div className="flex gap-1 bg-white border border-stone-200 rounded-lg p-0.5 text-[10px] font-bold">
                    {(["USD", "PKR", "INR", "GBP"] as SupportedCurrency[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setHeroCurrency(c)}
                        className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                          heroCurrency === c ? "bg-[#111315] text-white" : "text-stone-500 hover:text-black"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Food Items List */}
                <div className="space-y-2">
                  {HERO_DISHES.map((dish) => {
                    const priceFormatted = CURRENCIES[heroCurrency].format(dish.priceUSD);
                    const qty = heroCart[dish.id] || 0;

                    return (
                      <div
                        key={dish.id}
                        className="p-2 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-2.5"
                      >
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-display font-bold text-xs text-stone-900 truncate">
                            {dish.name}
                          </p>
                          <p className="text-xs font-extrabold text-emerald-700">{priceFormatted}</p>
                        </div>
                        <button
                          onClick={() => handleAddDish(dish.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{qty > 0 ? `${qty} in cart` : "Add"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Phone Cart & Fire Button */}
                <div className="pt-2 border-t border-stone-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 font-medium">Cart ({heroCartCount} items)</span>
                    <span className="font-bold text-sm text-stone-900">
                      {CURRENCIES[heroCurrency].format(heroCartTotalUSD)}
                    </span>
                  </div>

                  {phoneOrderStatus === "IDLE" && (
                    <button
                      onClick={handleFireOrder}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Fire Order to Kitchen -&gt;</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {phoneOrderStatus === "SENT" && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        Cooking on Line (Table 04)
                      </span>
                      <span className="text-[10px] text-amber-800">~12m</span>
                    </div>
                  )}

                  {phoneOrderStatus === "READY" && (
                    <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Chef Marco: Food is READY!
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">
                        Pick up
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Screen: Live Dark-Mode KDS Board (lg:col-span-7) */}
              <div className="lg:col-span-7 rounded-2xl border border-stone-800 bg-[#0B0F17] text-white p-4 shadow-sm space-y-3 min-h-[380px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-emerald-400" />
                      <span className="font-display font-bold text-xs text-white">
                        KITCHEN DISPLAY (KDS) • LIVE TICKETS
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      120ms WEBSOCKET ROOM
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    Incoming guest tickets drop here instantly. Tap item checkboxes to mark prep, then tap &quot;Mark Ready&quot;:
                  </p>

                  {/* KDS Tickets Stream */}
                  <div className="space-y-2.5 mt-3">
                    {heroTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-3 rounded-xl border transition-all ${
                          ticket.status === "READY"
                            ? "bg-emerald-950/30 border-emerald-500/40"
                            : ticket.status === "PREPARING"
                            ? "bg-stone-900 border-blue-500/40"
                            : "bg-stone-900 border-amber-500/50"
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs border-b border-white/10 pb-1.5 mb-2">
                          <span className="font-mono font-bold">
                            #{ticket.orderNumber} • <span className="text-amber-400">{ticket.table}</span>
                          </span>
                          <span className="font-mono text-[11px] text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimer(ticket.elapsedSeconds)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {ticket.items.map((it) => (
                            <div
                              key={it.id}
                              onClick={() => handleTogglePrepItem(ticket.id, it.id)}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                                it.isPrepared
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-stone-400 line-through"
                                  : "bg-black/40 border-white/10 text-stone-200"
                              }`}
                            >
                              <span>
                                {it.qty}x {it.name}
                              </span>
                              <Check className={`w-3.5 h-3.5 ${it.isPrepared ? "text-emerald-400" : "text-stone-600"}`} />
                            </div>
                          ))}
                        </div>

                        {ticket.status !== "READY" && (
                          <button
                            onClick={() => handleMarkTicketReady(ticket.id)}
                            className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Ready (Notifies Table 04)</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-stone-400">
                  <span>Cook Line Audio Chimes Active</span>
                  <span className="text-emerald-400 font-bold">0 Pending Re-runs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SECTION 2 — TRACTION & UNIT ECONOMICS STRIP (DARK)     */}
      {/* ========================================================= */}
      <section className="bg-[#111315] text-white py-10 border-b border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
            <div className="py-3 px-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-display text-emerald-400">
                14 sec
              </p>
              <p className="text-xs text-stone-400 font-medium">Average Order Time (vs 8m wait)</p>
            </div>
            <div className="py-3 px-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                +22%
              </p>
              <p className="text-xs text-stone-400 font-medium">Average Check Lift (Smart Upsells)</p>
            </div>
            <div className="py-3 px-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-display text-amber-400">
                &lt; 150ms
              </p>
              <p className="text-xs text-stone-400 font-medium">WebSocket Kitchen Ticket Sync</p>
            </div>
            <div className="py-3 px-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                4
              </p>
              <p className="text-xs text-stone-400 font-medium">Native Currencies (PKR • USD • INR • GBP)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SECTION 3 — 3-PERSPECTIVE ROLE SWITCHER                */}
      {/* ========================================================= */}
      <section id="role-switcher" className="py-16 lg:py-24 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              ONE PLATFORM • THREE PERSPECTIVES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#111315] tracking-tight">
              Designed for diners, cooks, and multi-branch owners.
            </h2>
            <p className="text-sm text-stone-600">
              Switch roles below to explore the dedicated interface built for each stakeholder:
            </p>
          </div>

          {/* Role Pill Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-stone-200/80 border border-stone-300 gap-1 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveRole("guest")}
                className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeRole === "guest"
                    ? "bg-[#111315] text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                01. The Guest Experience
              </button>
              <button
                onClick={() => setActiveRole("kitchen")}
                className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeRole === "kitchen"
                    ? "bg-[#111315] text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <ChefHat className="w-4 h-4 text-amber-400" />
                02. The Kitchen & Floor
              </button>
              <button
                onClick={() => setActiveRole("owner")}
                className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeRole === "owner"
                    ? "bg-[#111315] text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Store className="w-4 h-4 text-blue-400" />
                03. The Multi-Branch Owner
              </button>
            </div>
          </div>

          {/* Dynamic Role Showcase Container */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs min-h-[440px]">
            {/* ROLE 1: GUEST */}
            {activeRole === "guest" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-in fade-in duration-200 text-left">
                <div className="md:col-span-6 space-y-4">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Guest Interface • 100% Browser Web Native
                  </span>
                  <h3 className="text-2xl font-bold font-display text-stone-900">
                    Frictionless Self-Ordering & Smart Upsells
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Diners view high-res food photos, select dietary modifiers (GF, Spicy), see estimated prep times, and leave instant 5-star ratings upon checkout.
                  </p>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <p className="text-xs font-bold text-stone-800">Rate your meal after checkout:</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setGuestStarRating(star)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= guestStarRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-stone-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500">
                      ★ {guestStarRating}.0 rating saved to Neon Lakebase database.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-6 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-900">
                    <span>Menu Cart Showcase</span>
                    <span className="text-emerald-700">~12m Prep Countdown</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-900">
                      <span>Smoky Angus Truffle Burger</span>
                      <span>$16.50</span>
                    </div>
                    <div className="flex gap-1.5 pt-0.5">
                      <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                        Spicy
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                        Gluten-Free Bun Option
                      </span>
                    </div>
                  </div>

                  {/* Smart Upsell Bar */}
                  <button
                    onClick={() => setGuestUpsellActive(!guestUpsellActive)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      guestUpsellActive
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                        : "bg-white border-dashed border-stone-300 text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    <span>{guestUpsellActive ? "✓ Added Lemonade" : "+ Add Craft Lemonade (+$4.50)"}</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">
                      +22% Check Lift
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ROLE 2: KITCHEN & FLOOR */}
            {activeRole === "kitchen" && (
              <div className="space-y-5 animate-in fade-in duration-200 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900">
                      Cook Line KDS with Urgency Timers & 80mm Slip Print
                    </h3>
                    <p className="text-xs text-stone-500">
                      Tickets turn red if aging past 12 minutes. Waiters settle split bills in 2 taps.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    KDS Station 01
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Urgent Ticket */}
                  <div className="p-3.5 rounded-xl bg-stone-900 text-white border border-rose-500/60 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-400">#104 • Table 01 (LATE)</span>
                      <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded animate-pulse">
                        14:12 prep
                      </span>
                    </div>
                    <p className="text-xs text-stone-300">• 2x Truffle Smash Burger</p>
                    <span className="inline-block text-[10px] text-rose-300 font-bold uppercase">
                      Urgent Priority
                    </span>
                  </div>

                  {/* Normal Ticket */}
                  <div className="p-3.5 rounded-xl bg-stone-900 text-white border border-emerald-500/40 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-400">#105 • Table 04</span>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded">
                        03:40 prep
                      </span>
                    </div>
                    <p className="text-xs text-stone-300">• 1x Loaded Peri Fries</p>
                    <span className="inline-block text-[10px] text-emerald-300 font-bold uppercase">
                      On Time
                    </span>
                  </div>

                  {/* Floor Split Bill Quick Calculator */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <p className="text-xs font-bold text-stone-900">Table 04 Split Bill ($78.00)</p>
                    <div className="flex gap-1 text-xs">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => setSplitGuestCount(count)}
                          className={`flex-1 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            splitGuestCount === count ? "bg-[#111315] text-white" : "bg-white border text-stone-700"
                          }`}
                        >
                          {count} way
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-emerald-700">
                      ${(78.0 / splitGuestCount).toFixed(2)} / diner
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 3: OWNER */}
            {activeRole === "owner" && (
              <div className="space-y-5 animate-in fade-in duration-200 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900">
                      Multi-Branch Chain Management & Staff RBAC
                    </h3>
                    <p className="text-xs text-stone-500">
                      Manage all locations from one dashboard with separate staff credentials.
                    </p>
                  </div>

                  {/* Branch Switcher */}
                  <div className="flex gap-1 bg-stone-100 p-1 rounded-lg text-xs font-bold self-start sm:self-auto">
                    {(["flagship", "marina", "airport"] as const).map((branch) => (
                      <button
                        key={branch}
                        onClick={() => setSelectedBranch(branch)}
                        className={`px-3 py-1 rounded transition cursor-pointer ${
                          selectedBranch === branch ? "bg-[#111315] text-white" : "text-stone-600 hover:text-black"
                        }`}
                      >
                        {branch === "flagship" ? "Downtown Flagship" : branch === "marina" ? "Marina Rooftop" : "Airport T2"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Dining Room Capacity</p>
                    <p className="text-xl font-bold font-display text-stone-900">
                      {selectedBranch === "flagship" ? "28 Tables" : selectedBranch === "marina" ? "18 Tables" : "12 Tables"}
                    </p>
                    <p className="text-xs text-emerald-700 font-semibold">● 94% Active Occupancy</p>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Staff PIN Stations
                    </p>
                    <p className="text-xs font-semibold text-stone-800">Manager: Full Access</p>
                    <p className="text-xs font-semibold text-stone-800">Cooks: KDS Screen Only</p>
                    <p className="text-xs font-semibold text-stone-800">Waiters: Floor Tabs Only</p>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Audit Trail Activity</p>
                    <p className="text-[11px] text-stone-600 font-mono">
                      [20:14] Carlos (Waiter) settled Order #1041 via CARD
                    </p>
                    <p className="text-[11px] text-stone-600 font-mono">
                      [20:11] Marco (Cook) toggled 86 on Ribeye Steak
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. SECTION 4 — PHYSICAL TABLE CRAFT                       */}
      {/* ========================================================= */}
      <section className="py-16 lg:py-24 border-b border-stone-200 bg-[#F5F2EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              DESIGNED FOR REAL DINING ROOMS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#111315] tracking-tight">
              Physical craft meets digital speed.
            </h2>
            <p className="text-sm text-stone-600">
              No ugly taped signs or bulky iPad docks. Dineeze renders elegant acrylic table-tents and thermal slips:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            {/* Artifact 1: Acrylic Stand with Dynamic Color Rebranding Swatches */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-xs font-bold text-stone-900">Acrylic Table-Tent Stand</p>
                <p className="text-[11px] text-stone-500">Pick an accent color to rebrand:</p>
              </div>

              {/* Color Swatches */}
              <div className="flex justify-center gap-2">
                {[
                  { id: "emerald", label: "Emerald", hex: "#059669" },
                  { id: "obsidian", label: "Obsidian", hex: "#111315" },
                  { id: "terracotta", label: "Terracotta", hex: "#C2410C" },
                  { id: "royal", label: "Royal Blue", hex: "#1D4ED8" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setAcrylicColor(s.id as "emerald" | "obsidian" | "terracotta" | "royal")}
                    className={`w-6 h-6 rounded-full cursor-pointer transition ${
                      acrylicColor === s.id ? "scale-125 ring-2 ring-stone-900 ring-offset-2" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: s.hex }}
                    aria-label={`Select ${s.label}`}
                  />
                ))}
              </div>

              {/* The Acrylic Card Mockup */}
              <div
                className="w-56 mx-auto p-5 rounded-xl border-2 space-y-3 shadow-sm transition-colors duration-200"
                style={{
                  backgroundColor: "#FAF8F5",
                  borderColor:
                    acrylicColor === "emerald"
                      ? "#059669"
                      : acrylicColor === "obsidian"
                      ? "#111315"
                      : acrylicColor === "terracotta"
                      ? "#C2410C"
                      : "#1D4ED8",
                }}
              >
                <p
                  className="font-display font-extrabold text-xs uppercase tracking-wider"
                  style={{
                    color:
                      acrylicColor === "emerald"
                        ? "#059669"
                        : acrylicColor === "obsidian"
                        ? "#111315"
                        : acrylicColor === "terracotta"
                        ? "#C2410C"
                        : "#1D4ED8",
                  }}
                >
                  THE SPICE KITCHEN
                </p>

                <div className="p-2.5 bg-white rounded-lg border border-stone-200 inline-block shadow-xs">
                  <QRCodeSVG
                    value="https://dineeze.vercel.app/m/table-1-spice-kitchen"
                    size={96}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <p className="font-display font-bold text-xs text-stone-900">
                  TABLE 04 • SCAN TO ORDER
                </p>
                <p className="text-[10px] text-stone-400">Wi-Fi: SpiceGuest / dine2026</p>
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] text-stone-400">
                <span>300 DPI Vector PDF Export</span>
                <Link
                  to="/m/table-1-spice-kitchen"
                  className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5 ml-1"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Artifact 2: Serrated 80mm Thermal KOT Ticket */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-xs font-bold text-stone-900 flex items-center justify-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-stone-600" />
                  <span>80mm Kitchen Slip (KOT)</span>
                </p>
                <p className="text-[11px] text-stone-500">Standard ESC/POS thermal printer layout</p>
              </div>

              {/* Monospace Slip Graphic */}
              <div className="w-56 mx-auto p-4 bg-stone-900 text-stone-200 font-mono text-xs rounded-lg border border-stone-800 space-y-1.5 text-left shadow-sm">
                <div className="text-center border-b border-dashed border-stone-700 pb-1.5">
                  <p className="font-bold text-white">*** KITCHEN ORDER TICKET ***</p>
                  <p className="text-[10px] text-stone-400">TABLE 04 • ORDER #109</p>
                  <p className="text-[10px] text-emerald-400">20:14:02 • DINE-IN</p>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-white">1x TRUFFLE SMASH BURGER</p>
                  <p className="text-[10px] text-amber-300"> * NO ONION / MED-RARE</p>
                  <p className="text-white">1x LOADED PERI FRIES</p>
                </div>
                <div className="border-t border-dashed border-stone-700 pt-1.5 flex justify-between font-bold text-emerald-400 text-xs">
                  <span>TOTAL:</span>
                  <span>$23.00</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                <Printer className="w-3 h-3 text-stone-400" />
                <span>Epson & Star Micronics Compatible</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. SECTION 5 — REVENUE & ROI SIMULATOR + PRICING          */}
      {/* ========================================================= */}
      <section id="roi-section" className="py-16 lg:py-24 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              UNIT ECONOMICS & ROI
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#111315] tracking-tight">
              Calculate your restaurant revenue uplift
            </h2>
            <p className="text-sm text-stone-600">
              Drag the capacity sliders below to see your monthly savings and check size increase:
            </p>
          </div>

          {/* Interactive Calculator Card */}
          <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-700">
                Simulator Currency:
              </span>
              <div className="flex gap-1 bg-white border border-stone-200 rounded-lg p-0.5 text-xs font-bold">
                {(["USD", "PKR", "INR", "GBP"] as SupportedCurrency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setRoiCurrency(c)}
                    className={`px-2 py-1 rounded transition cursor-pointer ${
                      roiCurrency === c ? "bg-[#111315] text-white" : "text-stone-600 hover:text-black"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 1: Tables */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-stone-900">
                <span>Number of Dining Tables:</span>
                <span className="font-black text-sm">{roiTables} Tables</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={roiTables}
                onChange={(e) => setRoiTables(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-[#111315]"
              />
            </div>

            {/* Slider 2: Daily Turns */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-stone-900">
                <span>Daily Seatings per Table:</span>
                <span className="font-black text-sm">{roiDailyOrders} Orders/day</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={roiDailyOrders}
                onChange={(e) => setRoiDailyOrders(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-[#111315]"
              />
            </div>

            {/* Calculations Result */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-200 text-left">
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-0.5">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Monthly Upsell Lift</p>
                <p className="text-xl font-bold font-display text-emerald-700">
                  +{CURRENCIES[roiCurrency].symbol}
                  {monthlyUpsellLift.toLocaleString()}/mo
                </p>
                <p className="text-[10px] text-stone-500">+22% on beverage & side pairing</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-0.5">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Annual Print Savings</p>
                <p className="text-xl font-bold font-display text-stone-900">
                  {CURRENCIES[roiCurrency].symbol}
                  {annualPrintSavings.toLocaleString()}/yr
                </p>
                <p className="text-[10px] text-stone-500">Zero re-lamination costs</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-0.5">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Total Annual Gain</p>
                <p className="text-xl font-bold font-display text-amber-700">
                  +{CURRENCIES[roiCurrency].symbol}
                  {annualTotalGain.toLocaleString()}/yr
                </p>
                <p className="text-[10px] text-stone-500">Net revenue uplift</p>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Section */}
          <div id="pricing-section" className="space-y-8 pt-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#111315]">
                Direct, transparent pricing
              </h3>
              <p className="text-xs text-stone-500">
                No per-order percentage deductions. Cancel anytime.
              </p>

              {/* Toggle */}
              <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-stone-100 border border-stone-200 text-xs font-semibold mt-2">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    billingPeriod === "monthly" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-600"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    billingPeriod === "annual" ? "bg-[#111315] text-white shadow-xs font-bold" : "text-stone-600"
                  }`}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              {/* Starter Plan */}
              <div className="p-6 sm:p-8 rounded-2xl border border-stone-200 bg-white space-y-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      STARTER TIER
                    </span>
                    <p className="text-4xl font-extrabold font-display text-[#111315] mt-1">$0</p>
                    <p className="text-xs text-stone-500">Free forever • Single café or pop-up</p>
                  </div>

                  <ul className="space-y-2 text-xs text-stone-700 pt-2 border-t border-stone-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Up to 10 Dining Tables
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Unlimited Dishes & Categories
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Kitchen KDS with Audio Bell Alert
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Multi-Currency (PKR, USD, INR, GBP)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Printable Table-Tent Acrylic QR Stand PDFs
                    </li>
                  </ul>
                </div>

                <Link
                  to="/register"
                  className="w-full py-3 rounded-xl font-bold bg-stone-100 hover:bg-stone-200 text-stone-900 text-center text-xs transition border border-stone-200"
                >
                  Start Free
                </Link>
              </div>

              {/* Pro Multi-Branch Plan */}
              <div className="p-6 sm:p-8 rounded-2xl border-2 border-[#111315] bg-white space-y-6 flex flex-col justify-between shadow-sm relative">
                <span className="absolute -top-3 right-6 bg-[#111315] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                  MOST POPULAR
                </span>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      PRO MULTI-BRANCH
                    </span>
                    <p className="text-4xl font-extrabold font-display text-[#111315] mt-1">
                      {billingPeriod === "annual" ? "$24" : "$29"}
                      <span className="text-xs font-normal text-stone-500"> / month</span>
                    </p>
                    <p className="text-xs text-stone-500">For multi-room dining rooms and restaurant chains</p>
                  </div>

                  <ul className="space-y-2 text-xs text-stone-700 pt-2 border-t border-stone-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <strong>Unlimited Tables & Branches</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Staff Role-Based PIN Access (Manager, Cook, Waiter)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Live Table Floor Board & Split-Bill Tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      1-Click Menu Catalog Cloning Across Branches
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Order Audit Logs & Peak Hour Analytics
                    </li>
                  </ul>
                </div>

                <Link
                  to="/register"
                  className="w-full py-3 rounded-xl font-bold bg-[#111315] hover:bg-stone-800 text-white text-center text-xs transition shadow-xs"
                >
                  Start 14-Day Free Pro Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. SECTION 6 — HIGH-IMPACT CLOSING STAGE & FOOTER         */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#111315] text-white p-8 sm:p-12 text-center space-y-5 border border-stone-800">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              Your dining room deserves modern software.
            </h2>
            <p className="text-stone-400 text-sm max-w-xl mx-auto">
              Launch your contactless menu in under 2 minutes. Free setup with zero proprietary hardware leases.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-white text-stone-900 hover:bg-stone-100 transition text-sm flex items-center justify-center gap-1.5"
              >
                Start Your Restaurant Free
                <ArrowRight className="w-4 h-4 text-amber-500" />
              </Link>
              <Link
                to="/m/table-1-spice-kitchen"
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition text-sm flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Try Live Demo Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-COLUMN ARCHITECTURAL FOOTER */}
      <footer className="border-t border-stone-200 bg-white py-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-left">
            {/* Col 1: Brand & Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#111315] text-white flex items-center justify-center">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="font-display font-bold text-sm text-[#111315]">Dineeze</span>
              </div>
              <p className="text-stone-500 leading-relaxed">
                Contactless table ordering, digital QR menus, and real-time kitchen displays.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational (Sockets Active)</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Product</p>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => scrollTo("hero-simulator")} className="hover:text-black">
                    Live Menu Sandbox
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveRole("kitchen");
                      scrollTo("role-switcher");
                    }}
                    className="hover:text-black"
                  >
                    Kitchen KDS Display
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveRole("guest");
                      scrollTo("role-switcher");
                    }}
                    className="hover:text-black"
                  >
                    Guest Mobile Experience
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("pricing-section")} className="hover:text-black">
                    Pricing & Free Plan
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Capabilities */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Capabilities</p>
              <ul className="space-y-1.5">
                <li>Instant 14-sec QR Scan-to-Order</li>
                <li>Real-Time Kitchen KDS Chimes</li>
                <li>80mm Thermal KOT Print Slips</li>
                <li>Multi-Currency: PKR, USD, INR, GBP</li>
                <li>Live Floor Status & Split-Check</li>
              </ul>
            </div>

            {/* Col 4: Staff & Owner Access */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Access & Credits</p>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/staff-login" className="hover:text-black font-semibold text-stone-800">
                    Staff Portal Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-black font-semibold text-stone-800">
                    Owner Dashboard Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-black">
                    Launch New Restaurant
                  </Link>
                </li>
                <li className="pt-2 font-semibold text-stone-700">
                  Built by SovYCode
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-400 text-[11px]">
            <p>© {new Date().getFullYear()} Dineeze Inc. All rights reserved.</p>
            <p>Designed with editorial hospitality craft.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
