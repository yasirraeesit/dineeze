import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  UtensilsCrossed,
  QrCode,
  ChefHat,
  Smartphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus,
  Menu as MenuIcon,
  X,
  Star,
  CheckCheck,
  Flame,
  Printer,
  Store,
  Coffee,
  Beer,
  Award,
  Split,
  ShieldCheck,
  Receipt,
} from "lucide-react";

// Web Audio synthesizer for the authentic Kitchen Display System chime
const playKitchenChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First strike tone (880Hz / A5 chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Harmonic bell overtone (1320Hz / E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1320, now + 0.06);
    gain2.gain.setValueAtTime(0.18, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.55);
  } catch {
    // Silent fallback if browser blocks auto-play audio
  }
};

interface KDSTicket {
  id: string;
  orderNumber: string;
  table: string;
  items: { name: string; qty: number; note?: string }[];
  status: "PENDING" | "PREPARING" | "READY";
  elapsedSeconds: number;
}

interface SampleDish {
  id: string;
  name: string;
  priceUSD: number;
  pricePKR: number;
  priceINR: number;
  priceGBP: number;
  category: string;
  description: string;
  image: string;
  badge?: string;
}

const SAMPLE_DISHES: SampleDish[] = [
  {
    id: "dish-1",
    name: "Smoky Truffle Burger",
    priceUSD: 16.5,
    pricePKR: 2450,
    priceINR: 650,
    priceGBP: 13.5,
    category: "Mains",
    description: "Aged Black Angus, black truffle aioli, melted Gruyère on artisan brioche.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
    badge: "Chef Pick",
  },
  {
    id: "dish-2",
    name: "Truffle Parmesan Fries",
    priceUSD: 6.5,
    pricePKR: 950,
    priceINR: 250,
    priceGBP: 5.2,
    category: "Sides",
    description: "Hand-cut Idaho russet potatoes, Pecorino Romano, rosemary truffle dust.",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "dish-3",
    name: "Craft Berry Lemonade",
    priceUSD: 4.5,
    pricePKR: 650,
    priceINR: 180,
    priceGBP: 3.8,
    category: "Drinks",
    description: "Muddled wild blackberries, cold-pressed Amalfi lemons, sparkling soda.",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80",
  },
];

type SupportedCurrency = "USD" | "PKR" | "INR" | "GBP";

const CURRENCY_CONFIG: Record<
  SupportedCurrency,
  { label: string; symbol: string; position: "before" | "after"; format: (val: number) => string }
> = {
  USD: { label: "USD ($)", symbol: "$", position: "before", format: (v) => `$${v.toFixed(2)}` },
  PKR: {
    label: "PKR (Rs)",
    symbol: "Rs. ",
    position: "before",
    format: (v) => `Rs. ${v.toLocaleString()}`,
  },
  INR: { label: "INR (₹)", symbol: "₹", position: "before", format: (v) => `₹${v.toLocaleString()}` },
  GBP: { label: "GBP (£)", symbol: "£", position: "before", format: (v) => `£${v.toFixed(2)}` },
};

export const LandingPage: React.FC = () => {
  // Mobile Navigation Drawer Toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sound Chime Toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hero Simulator State
  const [simulatorCart, setSimulatorCart] = useState<{ dish: SampleDish; qty: number }[]>([
    { dish: SAMPLE_DISHES[0], qty: 1 },
  ]);
  const [lastOrderAlert, setLastOrderAlert] = useState<string | null>(null);

  const [kdsTickets, setKdsTickets] = useState<KDSTicket[]>([
    {
      id: "ticket-1041",
      orderNumber: "1041",
      table: "Table 02",
      items: [
        { name: "Crispy Parmesan Fries", qty: 1 },
        { name: "Craft Berry Lemonade", qty: 2 },
      ],
      status: "PREPARING",
      elapsedSeconds: 142,
    },
    {
      id: "ticket-1040",
      orderNumber: "1040",
      table: "Table 07",
      items: [{ name: "Smoky Truffle Burger", qty: 2, note: "Medium-rare, no onion" }],
      status: "READY",
      elapsedSeconds: 318,
    },
  ]);

  // Dark Section Interactive Showcase Tabs
  const [activeDarkTab, setActiveDarkTab] = useState<"kds" | "floor" | "rbac">("kds");

  // Bento Card: Multi-Currency Switcher
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("USD");

  // Bento Card: Live Table Floor Pills
  const [selectedFloorTable, setSelectedFloorTable] = useState<number>(3);
  const floorTables = [
    { id: 1, name: "Table 01", status: "AVAILABLE", guests: 0, total: 0 },
    { id: 2, name: "Table 02", status: "WAITING_FOOD", guests: 3, total: 42.5 },
    { id: 3, name: "Table 03", status: "READY_TO_SERVE", guests: 2, total: 28.0 },
    { id: 4, name: "Table 04", status: "BILL_PENDING", guests: 4, total: 74.0 },
  ];

  // Bento Card: Split Bill Guests Counter
  const [splitGuestCount, setSplitGuestCount] = useState<number>(4);

  // Interactive ROI & Savings Slider (number of tables: 5 to 50)
  const [tableCount, setTableCount] = useState<number>(16);

  // Pricing Billing Toggle
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

  // Ticket Timer: Tick every second for live realistic kitchen clock
  useEffect(() => {
    const timer = setInterval(() => {
      setKdsTickets((prev) =>
        prev.map((ticket) =>
          ticket.status !== "READY"
            ? { ...ticket, elapsedSeconds: ticket.elapsedSeconds + 1 }
            : ticket
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format elapsed seconds as MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Add Item to Phone Simulator Cart
  const handleAddToCart = (dish: SampleDish) => {
    setSimulatorCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  // Cart total in USD for Hero
  const cartSubtotal = useMemo(() => {
    return simulatorCart.reduce((acc, curr) => acc + curr.dish.priceUSD * curr.qty, 0);
  }, [simulatorCart]);

  const cartTotalItems = useMemo(() => {
    return simulatorCart.reduce((acc, curr) => acc + curr.qty, 0);
  }, [simulatorCart]);

  // Send Order from Phone to Kitchen KDS
  const handleSendToKitchen = () => {
    if (simulatorCart.length === 0) return;

    if (soundEnabled) {
      playKitchenChime();
    }

    const orderNum = Math.floor(1043 + Math.random() * 50).toString();
    const newTicket: KDSTicket = {
      id: `ticket-${Date.now()}`,
      orderNumber: orderNum,
      table: "Table 04",
      items: simulatorCart.map((i) => ({
        name: i.dish.name,
        qty: i.qty,
        note: i.dish.id === "dish-1" ? "Extra truffle aioli" : undefined,
      })),
      status: "PENDING",
      elapsedSeconds: 0,
    };

    setKdsTickets((prev) => [newTicket, ...prev.slice(0, 3)]);
    setLastOrderAlert(`Order #${orderNum} beamed to Kitchen in 0.18s!`);

    // Reset phone cart with sample item ready for another test
    setSimulatorCart([{ dish: SAMPLE_DISHES[0], qty: 1 }]);

    setTimeout(() => {
      setLastOrderAlert(null);
    }, 4000);
  };

  // Advance Ticket Status in Kitchen Display
  const handleAdvanceStatus = (ticketId: string) => {
    setKdsTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const next =
            t.status === "PENDING" ? "PREPARING" : t.status === "PREPARING" ? "READY" : "PENDING";
          return { ...t, status: next };
        }
        return t;
      })
    );
  };

  // Smooth scroll handler
  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ROI computations based on table count
  const monthlyPrintSavings = tableCount * 28;
  const timeSavedPerTable = 18; // minutes
  const additionalOrdersPerShift = Math.round(tableCount * 1.6);
  const estimatedExtraMonthlyRevenue = tableCount * 240;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0B0F19] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ========================================================= */}
      {/* 1. STICKY GLASSMORPHIC NAVBAR                             */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FAF9F6]/85 border-b border-stone-200/80 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-tight text-[#0B0F19]">
                Dineeze
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-[11px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                V2 OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-stone-600">
            <button
              onClick={() => scrollToSection("hero-simulator")}
              className="hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Live Simulator
            </button>
            <button
              onClick={() => scrollToSection("dinner-rush")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Dinner Rush KDS
            </button>
            <button
              onClick={() => scrollToSection("bento-grid")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Hospitality Bento
            </button>
            <button
              onClick={() => scrollToSection("roi-calculator")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              ROI Calculator
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/staff-login"
              className="px-3 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
            >
              Staff Portal
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-stone-700 hover:text-[#0B0F19] hover:bg-stone-100/70 rounded-xl transition"
            >
              Owner Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#0B0F19] text-white hover:bg-stone-800 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1.5 group"
            >
              Launch Restaurant
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-stone-200 bg-[#FAF9F6]/95 backdrop-blur-xl px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3">
              <button
                onClick={() => scrollToSection("hero-simulator")}
                className="text-left font-semibold text-stone-800 hover:text-emerald-600 py-1 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" /> Interactive Phone-to-KDS Simulator
              </button>
              <button
                onClick={() => scrollToSection("dinner-rush")}
                className="text-left font-semibold text-stone-800 hover:text-emerald-600 py-1"
              >
                Dinner Rush Kitchen Engine
              </button>
              <button
                onClick={() => scrollToSection("bento-grid")}
                className="text-left font-semibold text-stone-800 hover:text-emerald-600 py-1"
              >
                Multi-Currency & Floor Bento
              </button>
              <button
                onClick={() => scrollToSection("roi-calculator")}
                className="text-left font-semibold text-stone-800 hover:text-emerald-600 py-1"
              >
                ROI & Table Turn Estimator
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left font-semibold text-stone-800 hover:text-emerald-600 py-1"
              >
                Pricing Plans
              </button>
            </nav>
            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
              <Link
                to="/staff-login"
                className="w-full text-center py-2.5 rounded-xl font-semibold text-stone-700 bg-stone-100 border border-stone-200"
              >
                Staff Portal Sign In
              </Link>
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl font-semibold text-stone-800 bg-white border border-stone-200"
              >
                Owner Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-3 rounded-xl font-bold bg-[#0B0F19] text-white shadow-sm flex items-center justify-center gap-2"
              >
                Launch Restaurant Free <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. DUAL-STAGE HERO ("SCAN -> KITCHEN IN 0.2s")             */}
      {/* ========================================================= */}
      <section
        id="hero-simulator"
        className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-stone-200/80 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.09),transparent)]"
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-5 space-y-6 text-left">
              {/* V2 Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-emerald-700 tracking-wide">
                  Dineeze V2
                </span>
                <span className="text-stone-300">•</span>
                <span className="font-medium text-stone-700">Multi-Branch QR & KDS OS</span>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-[#0B0F19] tracking-tight leading-[1.06]">
                Scan to Kitchen in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
                  0.2 Seconds.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-lg">
                No app downloads. No costly proprietary POS hardware. Guests scan an acrylic table-tent
                to browse and order on their own phone, while your cooks hear an immediate chime and
                receive live Kanban tickets.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  to="/register"
                  className="px-7 py-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 group text-sm sm:text-base cursor-pointer"
                >
                  Launch Your Restaurant
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/m/table-1-spice-kitchen"
                  className="px-6 py-4 rounded-xl font-semibold bg-white border border-stone-300/80 hover:border-stone-400 text-stone-800 hover:bg-stone-50 shadow-xs transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Try Live Menu Demo
                </Link>
              </div>

              {/* Trust Checkmarks */}
              <div className="pt-3 border-t border-stone-200/90 grid grid-cols-2 gap-2.5 text-xs font-semibold text-stone-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Sub-200ms WebSockets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>0 App Downloads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Thermal 80mm KOT Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>PKR • USD • INR • GBP</span>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Mini-Simulator (Col 6-12) */}
            <div className="lg:col-span-7 relative">
              {/* Dynamic Notification Pill when ticket is sent */}
              {lastOrderAlert && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 bg-[#090D16] text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-emerald-500/60 flex items-center gap-2 animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {lastOrderAlert}
                </div>
              )}

              {/* Stage Controls Bar */}
              <div className="flex items-center justify-between pb-3 px-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dual-Stage Interactive Simulator
                </span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition cursor-pointer shadow-xs"
                  title="Toggle Kitchen KDS audio chime"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> Kitchen Chime ON
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-stone-400" /> Chime Muted
                    </>
                  )}
                </button>
              </div>

              {/* The Dual-Stage Simulator Layout: Phone Mockup + Dark KDS Board */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* 1. Sleek iPhone Frame (md:col-span-6) */}
                <div className="md:col-span-6 bg-white rounded-[2.2rem] border-4 border-stone-900 shadow-2xl p-4 relative overflow-hidden ring-1 ring-stone-900/10 flex flex-col justify-between min-h-[460px]">
                  {/* Dynamic Island Pill */}
                  <div className="w-24 h-4 bg-stone-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-stone-950/90 mr-2" />
                    <div className="w-6 h-1 bg-stone-800 rounded-full" />
                  </div>

                  {/* Phone Header */}
                  <div className="border-b border-stone-100 pb-2.5 mb-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="font-display font-bold text-xs text-stone-900">
                          The Spice Kitchen
                        </h4>
                      </div>
                      <p className="text-[10px] text-stone-400">Artisan Fusion & Grill</p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Table 04
                    </span>
                  </div>

                  {/* Sample Dishes List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5 max-h-[260px]">
                    {SAMPLE_DISHES.map((dish) => (
                      <div
                        key={dish.id}
                        className="p-2 rounded-xl border border-stone-200/80 bg-stone-50/70 hover:bg-stone-50 transition flex items-center justify-between gap-2.5"
                      >
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-display font-bold text-[11px] text-stone-900 truncate">
                              {dish.name}
                            </p>
                            {dish.badge && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded flex-shrink-0">
                                {dish.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-emerald-600 font-extrabold">
                            ${dish.priceUSD.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(dish)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                          title={`Add ${dish.name} to cart`}
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Sticky Bottom Cart Bar inside Phone */}
                  <div className="pt-3 mt-3 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 text-[11px]">
                        Cart: {cartTotalItems} {cartTotalItems === 1 ? "item" : "items"}
                      </span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={handleSendToKitchen}
                      className="w-full py-2.5 rounded-xl bg-[#0B0F19] hover:bg-stone-800 active:scale-98 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Send to Kitchen (Table 04)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>

                {/* 2. Kitchen Display System (KDS) (md:col-span-6) */}
                <div className="md:col-span-6 bg-[#090D16] text-white rounded-[2rem] p-4 border border-white/10 shadow-2xl space-y-3 min-h-[460px] flex flex-col justify-between">
                  <div>
                    {/* KDS Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-emerald-400" />
                        <span className="font-display font-bold text-xs text-white tracking-wide">
                          KITCHEN KDS
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        184ms SYNC
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-400">
                      Incoming orders beam here instantly. Tap any ticket to advance prep status:
                    </p>

                    {/* Tickets Stream */}
                    <div className="space-y-2.5 mt-3 max-h-[310px] overflow-y-auto pr-0.5">
                      {kdsTickets.map((ticket) => {
                        const isPending = ticket.status === "PENDING";
                        const isPreparing = ticket.status === "PREPARING";

                        return (
                          <div
                            key={ticket.id}
                            className={`p-3 rounded-xl border transition-all duration-300 space-y-2 ${
                              isPending
                                ? "bg-stone-900 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30"
                                : isPreparing
                                ? "bg-stone-900/90 border-blue-500/40"
                                : "bg-stone-900/80 border-emerald-500/40"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-stone-100 flex items-center gap-1.5">
                                #{ticket.orderNumber} •{" "}
                                <span className="text-emerald-400">{ticket.table}</span>
                              </span>
                              <span className="font-mono text-[10px] text-stone-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {formatTimer(ticket.elapsedSeconds)}
                              </span>
                            </div>

                            <ul className="text-[11px] text-stone-300 space-y-0.5">
                              {ticket.items.map((it, idx) => (
                                <li key={idx} className="truncate flex items-center justify-between">
                                  <span>
                                    {it.qty}x {it.name}
                                  </span>
                                  {it.note && (
                                    <span className="text-[9px] text-amber-300/80 italic">
                                      *{it.note}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>

                            {/* Tap to Advance Button */}
                            <button
                              onClick={() => handleAdvanceStatus(ticket.id)}
                              className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                isPending
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                                  : isPreparing
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {ticket.status} • TAP TO ADVANCE
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-stone-400">
                    <span>Keyboard shortcuts: [Space] Accept, [Enter] Ready</span>
                    <span className="text-emerald-400 font-bold">KDS Dark Mode</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. VENUE-TYPE MARQUEE & SOCIAL PROOF STRIP               */}
      {/* ========================================================= */}
      <section className="py-8 bg-white border-b border-stone-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
                ].map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt="Restaurateur Avatar"
                    className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-xs"
                  />
                ))}
              </div>
              <div className="text-xs">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="font-bold text-[#0B0F19] ml-1.5">4.9/5 Rating</span>
                </div>
                <p className="text-stone-500 text-[11px]">Loved by 400+ dine-in venues</p>
              </div>
            </div>

            {/* Venue Badges Marquee Strip */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-700">
              <span className="px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-stone-600" /> Specialty Cafés
              </span>
              <span className="px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-stone-600" /> Smash Burger Joints
              </span>
              <span className="px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-stone-600" /> Multi-Branch Chains
              </span>
              <span className="px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 flex items-center gap-1.5">
                <Beer className="w-3.5 h-3.5 text-stone-600" /> Craft Breweries
              </span>
              <span className="px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-stone-600" /> Hotel Lounges
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HIGH-CONTRAST DARK SECTION ("BUILT FOR THE DINNER RUSH")*/}
      {/* ========================================================= */}
      <section
        id="dinner-rush"
        className="py-24 md:py-32 bg-[#090D16] text-white relative overflow-hidden border-b border-stone-800"
      >
        {/* Ambient radial glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> BUILT FOR THE 8:00 PM CRUSH
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
              When the Kitchen Gets Slammed, Dineeze Never Drops a Ticket.
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Built on Neon Lakebase PostgreSQL with persistent multi-tenant WebSocket rooms. Every order
              is verified server-side, preventing price tampering and keeping floor staff and cooks in
              unbreakable sync.
            </p>
          </div>

          {/* Real Operational Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-center">
              <p className="text-2xl sm:text-3xl font-black font-display text-emerald-400">
                &lt; 200ms
              </p>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                Real-Time WebSocket Sync
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-center">
              <p className="text-2xl sm:text-3xl font-black font-display text-white">0 Downloads</p>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                100% Mobile Browser Native
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-center">
              <p className="text-2xl sm:text-3xl font-black font-display text-amber-400">
                4 Currencies
              </p>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                PKR, USD, INR, GBP Live
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-center">
              <p className="text-2xl sm:text-3xl font-black font-display text-white">99.98%</p>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                High-Volume Kitchen Uptime
              </p>
            </div>
          </div>

          {/* Interactive 3-Tab Operational Showcase */}
          <div className="bg-stone-900/90 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Tab Buttons */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveDarkTab("kds")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeDarkTab === "kds"
                    ? "bg-emerald-500 text-stone-950 shadow-md"
                    : "text-stone-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <ChefHat className="w-4 h-4" /> 1. Kitchen Display (KDS)
              </button>
              <button
                onClick={() => setActiveDarkTab("floor")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeDarkTab === "floor"
                    ? "bg-emerald-500 text-stone-950 shadow-md"
                    : "text-stone-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Store className="w-4 h-4" /> 2. Live Floor Status Board
              </button>
              <button
                onClick={() => setActiveDarkTab("rbac")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeDarkTab === "rbac"
                    ? "bg-emerald-500 text-stone-950 shadow-md"
                    : "text-stone-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> 3. Staff RBAC & Audit Trail
              </button>
            </div>

            {/* Tab 1 Content: KDS Engine */}
            {activeDarkTab === "kds" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-[#090D16] border border-amber-500/30 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-400 pb-1.5 border-b border-white/10">
                    <span>PENDING TICKETS</span>
                    <span className="bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">2 New</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-stone-200">
                      <span>#1044 • Table 01</span>
                      <span className="text-amber-400 font-mono">0:45</span>
                    </div>
                    <p className="text-stone-400 text-[11px]">2x Smoky Truffle Burger</p>
                    <p className="text-stone-400 text-[11px]">1x Truffle Parmesan Fries</p>
                    <span className="inline-block mt-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                      Press [Space] to Accept
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#090D16] border border-blue-500/30 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-blue-400 pb-1.5 border-b border-white/10">
                    <span>PREPARING (ON THE LINE)</span>
                    <span className="bg-blue-500/20 px-2 py-0.5 rounded-full text-[10px]">1 Active</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-stone-200">
                      <span>#1041 • Table 02</span>
                      <span className="text-blue-400 font-mono">2:24</span>
                    </div>
                    <p className="text-stone-400 text-[11px]">1x Crispy Parmesan Fries</p>
                    <p className="text-stone-400 text-[11px]">2x Craft Berry Lemonade</p>
                    <span className="inline-block mt-1 text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                      Press [Enter] to Mark Ready
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#090D16] border border-emerald-500/30 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-400 pb-1.5 border-b border-white/10">
                    <span>READY FOR RUNNER</span>
                    <span className="bg-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">3 Ready</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-stone-200">
                      <span>#1040 • Table 07</span>
                      <span className="text-emerald-400 font-mono">5:12</span>
                    </div>
                    <p className="text-stone-400 text-[11px]">2x Artisan Margherita Pizza</p>
                    <span className="inline-block mt-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Chimed on Waiter Mobile Device
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2 Content: Live Floor Status */}
            {activeDarkTab === "floor" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-xs text-stone-300">
                  Floor managers view dining room turnover in real time. Tables automatically cycle
                  through Available, Cooking, Ready to Serve, and Bill Pending:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {floorTables.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-[#090D16] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{t.name}</span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            t.status === "AVAILABLE"
                              ? "bg-stone-800 text-stone-300"
                              : t.status === "WAITING_FOOD"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : t.status === "READY_TO_SERVE"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          }`}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 space-y-0.5">
                        <p>Guests: {t.guests > 0 ? `${t.guests} Diners` : "Vacant"}</p>
                        <p>Tab: {t.total > 0 ? `$${t.total.toFixed(2)}` : "$0.00"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3 Content: Staff RBAC & Audit Trail */}
            {activeDarkTab === "rbac" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#090D16] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs text-white">MANAGER ROLE</span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Full administrative access: menu pricing, category creation, staff PIN management,
                      and financial analytics.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090D16] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-xs text-white">KITCHEN COOK ROLE</span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Dedicated high-contrast KDS interface with keyboard hotkeys. Cannot alter prices or
                      view revenue data.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090D16] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-xs text-white">WAITER ROLE</span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Live floor table map, food ready chimes, and split-bill payment settlement on
                      mobile.
                    </p>
                  </div>
                </div>

                {/* Audit Trail Snippet */}
                <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-stone-300">
                  <span className="flex items-center gap-2 text-emerald-400">
                    <CheckCheck className="w-4 h-4" />
                    [AUDIT LOG] Order #1041 settled via CARD (Split 2-ways) by Staff &quot;Carlos M. (Waiter)&quot;
                  </span>
                  <span className="text-stone-500 text-[11px]">20:14:18 UTC</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. ASYMMETRIC BENTO GRID WITH LIVE MICRO-UI CARDS          */}
      {/* ========================================================= */}
      <section
        id="bento-grid"
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-stone-200/80"
      >
        <div className="text-center space-y-3 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            HOSPITALITY ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-[#0B0F19] tracking-tight">
            Every Touchpoint Crafted for Velocity
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Interact with the actual components powering Dineeze dining rooms around the world.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Bento Card 1: Multi-Currency Live Switcher (Span 2 cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-md transition space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                  <Receipt className="w-3.5 h-3.5" /> Multi-Currency Engine
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-stone-900">
                  Global Currency Native (Click to Test)
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md">
                  Whether operating in Lahore, London, New York, or Mumbai, prices render in your
                  restaurant&apos;s true currency.
                </p>
              </div>

              {/* Currency Selector Pills */}
              <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl self-start sm:self-auto gap-1">
                {(["USD", "PKR", "INR", "GBP"] as SupportedCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setSelectedCurrency(cur)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCurrency === cur
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Pricing Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_DISHES.map((d) => {
                const price =
                  selectedCurrency === "USD"
                    ? d.priceUSD
                    : selectedCurrency === "PKR"
                    ? d.pricePKR
                    : selectedCurrency === "INR"
                    ? d.priceINR
                    : d.priceGBP;

                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2"
                  >
                    <p className="font-display font-bold text-xs text-stone-900 truncate">
                      {d.name}
                    </p>
                    <p className="text-lg font-extrabold text-emerald-600">
                      {CURRENCY_CONFIG[selectedCurrency].format(price)}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Auto-synced across customer devices and paper thermal KOT.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bento Card 2: Printable Table-Tent QR & Thermal KOT (Span 1 col on lg) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Printer className="w-3.5 h-3.5" /> Dual-Format Output
              </span>
              <h3 className="text-xl font-bold font-display text-stone-900">
                Table QR Tent & 80mm KOT
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Vector table QR stand paired with a serrated 80mm thermal kitchen ticket.
              </p>
            </div>

            {/* Table Tent QR + Thermal KOT Ticket Preview Mockup */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-stone-200 flex-shrink-0">
                  <QRCodeSVG
                    value="https://dineeze.vercel.app/m/table-1-spice-kitchen"
                    size={60}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-0.5 text-xs">
                  <p className="font-display font-bold text-stone-900">Table 04 Tent QR</p>
                  <p className="text-[10px] text-stone-500">Scan via camera to order</p>
                  <span className="inline-block text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Vector 300 DPI
                  </span>
                </div>
              </div>

              {/* Thermal KOT Ticket Preview Mockup */}
              <div className="p-3.5 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 font-mono text-[11px] space-y-2 shadow-inner relative overflow-hidden">
                <div className="text-center border-b border-stone-700/80 pb-2 space-y-0.5">
                  <p className="font-bold text-white text-xs">*** KITCHEN ORDER TICKET ***</p>
                  <p className="text-[10px] text-stone-400">TABLE 04 • SERVER: CARLOS M.</p>
                  <p className="text-[10px] text-emerald-400">ORDER #1042 • 20:14:02</p>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>1x SMOKY TRUFFLE BURGER</span>
                    <span>$16.50</span>
                  </div>
                  <p className="text-[10px] text-amber-300 italic"> * MED-WELL / NO ONION</p>
                  <div className="flex justify-between text-stone-300">
                    <span>1x TRUFFLE PARMESAN FRIES</span>
                    <span>$6.50</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-700 pt-2 flex justify-between font-bold text-emerald-400 text-xs">
                  <span>TOTAL DUE:</span>
                  <span>$23.00</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" /> 300 DPI Vector PDF
              </span>
              <Link
                to="/m/table-1-spice-kitchen"
                className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Test QR Link <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Bento Card 3: Live Table Floor & Split-Bill (Span 1 col on lg) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-2">
                <Split className="w-3.5 h-3.5" /> Floor & Split Settlement
              </span>
              <h3 className="text-xl font-bold font-display text-stone-900">
                Live Tables & Split-Check
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Tap table pills to inspect floor status and compute split-bill balances live.
              </p>
            </div>

            {/* Interactive 4-Table Status Pills */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                <span>Floor Status</span>
                <span className="text-emerald-600">Selected: Table 0{selectedFloorTable}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {floorTables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedFloorTable(t.id)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedFloorTable === t.id
                        ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400"
                        : "bg-stone-50 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{t.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          t.status === "AVAILABLE"
                            ? "bg-stone-400"
                            : t.status === "WAITING_FOOD"
                            ? "bg-amber-500 animate-pulse"
                            : t.status === "READY_TO_SERVE"
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-stone-500 mt-1">
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Calculator Widget */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                <span>Table 04 Tab Total:</span>
                <span className="text-sm font-extrabold text-stone-950">$74.00</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-stone-600">
                  <span>Split Count:</span>
                  <span className="font-bold text-emerald-600">{splitGuestCount} Guests</span>
                </div>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      onClick={() => setSplitGuestCount(count)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        splitGuestCount === count
                          ? "bg-[#0B0F19] text-white"
                          : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-xs text-stone-500">Each Guest Owes:</span>
                <span className="text-sm font-black font-display text-emerald-600">
                  ${(74.0 / splitGuestCount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supports CASH, CARD, and ONLINE settlements</span>
            </div>
          </div>

          {/* Bento Card 4: Multi-Branch & Menu Cloning (Span 2 cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-md transition space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
                  <Store className="w-3.5 h-3.5" /> 1-Click Menu Cloning
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-stone-900">
                  Scale from 1 Location to a 20-Branch Chain
                </h3>
              </div>
              <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full self-start sm:self-auto">
                Neon Multi-Tenant Isolation
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-600">
              Opening a second location? Click &quot;Add Branch&quot; and clone your entire category
              and dish catalog in under 2 seconds. Each branch keeps separate tables, staff accounts,
              and order feeds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="text-[10px] text-stone-400 font-bold uppercase">Downtown Flagship</p>
                <p className="font-display font-extrabold text-base text-stone-900">28 Tables</p>
                <p className="text-[11px] text-emerald-600 font-semibold">● 92% Active Dining Room</p>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="text-[10px] text-stone-400 font-bold uppercase">Rooftop Lounge</p>
                <p className="font-display font-extrabold text-base text-stone-900">18 Tables</p>
                <p className="text-[11px] text-blue-600 font-semibold">↓ 14m Faster Table Turns</p>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="text-[10px] text-stone-400 font-bold uppercase">Airport Terminal 2</p>
                <p className="font-display font-extrabold text-base text-stone-900">12 Tables</p>
                <p className="text-[11px] text-purple-600 font-semibold">★ Cloned from Flagship</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. INTERACTIVE ROI & SAVINGS ESTIMATOR                    */}
      {/* ========================================================= */}
      <section
        id="roi-calculator"
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-stone-200/80"
      >
        <div className="text-center space-y-3 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            BUSINESS IMPACT CALCULATOR
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-[#0B0F19] tracking-tight">
            How Much Does Paper Menu Friction Cost You?
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Adjust the slider to your restaurant&apos;s table capacity and see immediate monthly
            turnover and reprint savings.
          </p>
        </div>

        {/* Interactive Calculator Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-12 shadow-xl space-y-10">
          {/* Slider Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="table-slider" className="font-display font-bold text-lg text-stone-900">
                Number of Dining Tables:
              </label>
              <span className="text-3xl font-black font-display text-emerald-600 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                {tableCount} Tables
              </span>
            </div>

            <input
              id="table-slider"
              type="range"
              min="5"
              max="50"
              value={tableCount}
              onChange={(e) => setTableCount(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="flex justify-between text-xs text-stone-400 font-semibold">
              <span>5 Tables (Boutique Cafe)</span>
              <span>25 Tables (Busy Bistro)</span>
              <span>50 Tables (Large Venue)</span>
            </div>
          </div>

          {/* Computed ROI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-stone-100">
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Monthly Menu Reprint Savings
              </span>
              <p className="text-3xl font-extrabold font-display text-emerald-600">
                ${monthlyPrintSavings.toLocaleString()}/mo
              </p>
              <p className="text-[11px] text-stone-500">
                Zero laminated paper reprints or out-of-stock revisions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Table Turn Time Reduction
              </span>
              <p className="text-3xl font-extrabold font-display text-stone-900">
                -{timeSavedPerTable} mins
              </p>
              <p className="text-[11px] text-stone-500">
                Guests scan immediately instead of waiting for waitstaff menus.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Extra Orders per Shift
              </span>
              <p className="text-3xl font-extrabold font-display text-emerald-600">
                +{additionalOrdersPerShift} Orders
              </p>
              <p className="text-[11px] text-stone-500">
                Faster turns mean higher capacity during peak dinner rush.
              </p>
            </div>
          </div>

          {/* Call to action within ROI */}
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display font-bold text-stone-900 text-sm">
                Estimated Annual Impact: +${(monthlyPrintSavings * 12 + estimatedExtraMonthlyRevenue).toLocaleString()} / year
              </p>
              <p className="text-xs text-stone-600">
                Based on average guest check size and elimination of paper menu printing costs.
              </p>
            </div>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 flex-shrink-0"
            >
              Start Free Setup <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. SIMPLE, TRANSPARENT PRICING                            */}
      {/* ========================================================= */}
      <section
        id="pricing"
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-stone-200/80"
      >
        <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            TRANSPARENT PRICING
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-[#0B0F19] tracking-tight">
            Start Free. Scale Without Lock-In.
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            No per-order percentage deductions. No hardware leasing contracts.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-stone-100 border border-stone-200/90 text-xs font-bold mt-2">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                billingPeriod === "monthly"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                billingPeriod === "annual"
                  ? "bg-[#0B0F19] text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Annual Billing
              <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* 2-Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Starter Plan */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-8 space-y-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
            <div className="space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-stone-500">
                  Starter Tier
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-display text-stone-900">
                    $0
                  </span>
                  <span className="text-sm font-semibold text-stone-500">/ forever</span>
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  Ideal for cafes, food trucks, and single-room bistros getting started.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-3">
                <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Included Features:
                </p>
                <ul className="space-y-3 text-xs text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Up to 10 Dining Tables</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Unlimited Dishes & Categories</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Kitchen KDS with Audio Bell Alert</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Multi-Currency (PKR, USD, INR, GBP)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Table-Tent QR & Thermal 80mm KOT</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl font-bold bg-stone-100 hover:bg-stone-200 text-stone-900 text-center text-sm transition shadow-xs"
            >
              Launch Free Restaurant
            </Link>
          </div>

          {/* Pro Multi-Branch Plan */}
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 space-y-8 flex flex-col justify-between shadow-xl relative">
            <span className="absolute -top-3.5 right-8 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
              Most Popular
            </span>

            <div className="space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600">
                  Pro Multi-Branch
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-display text-stone-900">
                    {billingPeriod === "annual" ? "$24" : "$29"}
                  </span>
                  <span className="text-sm font-semibold text-stone-500">
                    / month {billingPeriod === "annual" ? "(billed annually)" : ""}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  For high-turnover dining rooms, hospitality groups, and multi-branch venues.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-3">
                <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Everything in Starter, plus:
                </p>
                <ul className="space-y-3 text-xs text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-stone-950">Unlimited Tables & Branches</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Staff Role-Based Access (Manager, Kitchen, Waiter)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Live Floor Board & Split-Bill Tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>1-Click Multi-Branch Menu Cloning</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Order Audit Logs & Hourly Peak Analytics</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-center text-sm transition shadow-lg shadow-emerald-600/20"
            >
              Start 14-Day Free Pro Trial
            </Link>
          </div>
        </div>

        {/* High-Contrast Obsidian Bottom Conversion Banner */}
        <div className="mt-20 bg-[#090D16] text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Zero Upfront Hardware Cost
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
              Ready to Upgrade Your Dining Room Tonight?
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Set up your menu in under 2 minutes. Cut table bottlenecks by 18 minutes. Keep your
              kitchen humming with zero hardware leases.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-[#090D16] text-sm sm:text-base shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Launch Your Restaurant Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/m/table-1-spice-kitchen"
                className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 text-sm sm:text-base transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                View Customer Menu Demo
              </Link>
            </div>

            <p className="text-xs text-stone-400 pt-1">
              No credit card required • Instant setup • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. CLEAN MODERN HOSPITALITY FOOTER                         */}
      {/* ========================================================= */}
      <footer className="border-t border-stone-200/80 bg-white pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-display font-extrabold text-lg text-stone-900 tracking-tight">
                  Dineeze
                </span>
              </Link>
              <p className="text-xs text-stone-500 leading-relaxed">
                Contactless tabletop ordering, digital QR menus, and real-time kitchen displays for
                high-velocity modern restaurants.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational (Socket.io + Neon)</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-stone-900">
                Product
              </h4>
              <ul className="space-y-2 text-xs text-stone-500">
                <li>
                  <button
                    onClick={() => scrollToSection("dinner-rush")}
                    className="hover:text-emerald-600 transition cursor-pointer"
                  >
                    Kitchen Display System (KDS)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("bento-grid")}
                    className="hover:text-emerald-600 transition cursor-pointer"
                  >
                    Table-Tent QR & 80mm KOT
                  </button>
                </li>
                <li>
                  <Link to="/m/table-1-spice-kitchen" className="hover:text-emerald-600 transition">
                    Mobile Customer Menu Demo
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="hover:text-emerald-600 transition cursor-pointer"
                  >
                    Pricing & Free Tier
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Hospitality Verticals */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-stone-900">
                Hospitality
              </h4>
              <ul className="space-y-2 text-xs text-stone-500">
                <li className="flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-stone-400" /> Full-Service Dining
                </li>
                <li className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-stone-400" /> Specialty Cafés & Bakeries
                </li>
                <li className="flex items-center gap-1.5">
                  <Beer className="w-3.5 h-3.5 text-stone-400" /> Bars & Craft Breweries
                </li>
                <li className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-stone-400" /> Hotel Lounges & Room Service
                </li>
              </ul>
            </div>

            {/* Col 4: Platform & Architecture */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-stone-900">
                Architecture
              </h4>
              <ul className="space-y-2 text-xs text-stone-500">
                <li>
                  <span className="text-stone-700 font-semibold">Database:</span> Neon Serverless
                  Lakebase
                </li>
                <li>
                  <span className="text-stone-700 font-semibold">WebSockets:</span> Socket.io Rooms
                </li>
                <li>
                  <span className="text-stone-700 font-semibold">Media CDN:</span> Cloudinary SDK
                </li>
                <li>
                  <span className="text-stone-700 font-semibold">Isolation:</span> Strict Tenant
                  restaurantId
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <p>© {new Date().getFullYear()} Dineeze Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/staff-login" className="hover:text-stone-700 transition">
                Staff Portal
              </Link>
              <Link to="/login" className="hover:text-stone-700 transition">
                Owner Login
              </Link>
              <Link to="/register" className="hover:text-stone-700 transition">
                Get Started
              </Link>
              <Link to="/m/table-1-spice-kitchen" className="hover:text-stone-700 transition">
                Customer Demo
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
