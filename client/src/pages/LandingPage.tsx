import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  UtensilsCrossed,
  ChefHat,
  Smartphone,
  Sparkles,
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
  Coffee,
  Beer,
  Award,
  Layers,
  AlertCircle,
  TrendingUp,
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

    // Harmonic bell strike (880Hz / A5)
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

    // Harmonic overtone (1320Hz / E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1320, now + 0.05);
    gain2.gain.setValueAtTime(0.18, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.55);
  } catch {
    // Audio policy silent fallback
  }
};

type SupportedCurrency = "USD" | "PKR" | "INR" | "GBP";

interface CurrencyMetadata {
  label: string;
  symbol: string;
  rateAgainstUSD: number;
  format: (amountUSD: number) => string;
}

const CURRENCIES: Record<SupportedCurrency, CurrencyMetadata> = {
  USD: {
    label: "USD ($)",
    symbol: "$",
    rateAgainstUSD: 1,
    format: (v) => `$${v.toFixed(2)}`,
  },
  PKR: {
    label: "PKR (Rs)",
    symbol: "Rs. ",
    rateAgainstUSD: 278,
    format: (v) => `Rs. ${Math.round(v * 278).toLocaleString()}`,
  },
  INR: {
    label: "INR (₹)",
    symbol: "₹",
    rateAgainstUSD: 83,
    format: (v) => `₹${Math.round(v * 83).toLocaleString()}`,
  },
  GBP: {
    label: "GBP (£)",
    symbol: "£",
    rateAgainstUSD: 0.79,
    format: (v) => `£${(v * 0.79).toFixed(2)}`,
  },
};

interface KDSTicketItem {
  id: string;
  name: string;
  qty: number;
  note?: string;
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
  // Mobile Navigation Drawer Toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sound Chime State
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Global Currency Toggle in Hero & Calculator
  const [heroCurrency, setHeroCurrency] = useState<SupportedCurrency>("USD");
  const [heroUpsellAdded, setHeroUpsellAdded] = useState(false);

  // Section 3: Interactive 3-Surface Product Tabs
  const [productTab, setProductTab] = useState<"menu" | "kds" | "floor">("menu");

  // Tab 1 (Guest Menu) State
  const [guestTheme, setGuestTheme] = useState<"espresso" | "emerald" | "crimson">("espresso");
  const [guestCartItems, setGuestCartItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([
    { id: "burger", name: "Smoky Truffle Burger", price: 16.5, qty: 1 },
  ]);
  const [upsellAdded, setUpsellAdded] = useState(false);

  // Tab 2 (KDS) State
  const [kdsTickets, setKdsTickets] = useState<KDSTicket[]>([
    {
      id: "ticket-1042",
      orderNumber: "1042",
      table: "Table 04",
      items: [
        { id: "item-1", name: "Smoky Truffle Burger", qty: 1, note: "Medium rare", isPrepared: false },
        { id: "item-2", name: "Garlic Truffle Fries", qty: 1, isPrepared: false },
        { id: "item-3", name: "Craft Berry Lemonade", qty: 1, isPrepared: true },
      ],
      status: "PREPARING",
      elapsedSeconds: 134,
    },
    {
      id: "ticket-1041",
      orderNumber: "1041",
      table: "Table 02",
      items: [
        { id: "item-4", name: "Artisan Margherita", qty: 2, isPrepared: true },
        { id: "item-5", name: "Wild Herb Focaccia", qty: 1, isPrepared: true },
      ],
      status: "READY",
      elapsedSeconds: 312,
    },
  ]);
  const [ticketFlashAlert, setTicketFlashAlert] = useState<string | null>(null);
  const [kotModalOpen, setKotModalOpen] = useState(false);

  // Tab 3 (Floor) State
  const [selectedFloorTable, setSelectedFloorTable] = useState<number>(4);
  const [splitGuests, setSplitGuests] = useState<number>(3);
  const floorTables = [
    { id: 1, name: "Table 01", status: "AVAILABLE", guests: 0, tabTotal: 0 },
    { id: 2, name: "Table 02", status: "COOKING", guests: 3, tabTotal: 48.0 },
    { id: 3, name: "Table 03", status: "READY", guests: 2, tabTotal: 34.5 },
    { id: 4, name: "Table 04", status: "BILL_PENDING", guests: 4, tabTotal: 88.5 },
    { id: 5, name: "Table 05", status: "AVAILABLE", guests: 0, tabTotal: 0 },
    { id: 6, name: "Table 06", status: "COOKING", guests: 2, tabTotal: 31.0 },
  ];

  // Section 5: ROI Calculator State
  const [roiTables, setRoiTables] = useState<number>(18);
  const [roiCheckUSD, setRoiCheckUSD] = useState<number>(45);

  // Section 6: Pricing Billing Toggle
  const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual");

  // Timer Tick: Live kitchen timer incrementing every second
  useEffect(() => {
    const timer = setInterval(() => {
      setKdsTickets((prev) =>
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

  // Toggle item preparation in KDS
  const handleToggleItemPrepared = (ticketId: string, itemId: string) => {
    setKdsTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedItems = t.items.map((it) =>
            it.id === itemId ? { ...it, isPrepared: !it.isPrepared } : it
          );
          const allPrepared = updatedItems.every((it) => it.isPrepared);
          return {
            ...t,
            items: updatedItems,
            status: allPrepared ? "READY" : "PREPARING",
          };
        }
        return t;
      })
    );
  };

  // Simulate new incoming ticket in KDS
  const handleSimulateNewOrder = () => {
    if (soundEnabled) {
      playKitchenChime();
    }
    const orderNum = Math.floor(1043 + Math.random() * 40).toString();
    const newTicket: KDSTicket = {
      id: `ticket-${Date.now()}`,
      orderNumber: orderNum,
      table: "Table 06",
      items: [
        { id: `sim-${Date.now()}-1`, name: "Smoky Truffle Burger", qty: 2, note: "No onions on 1", isPrepared: false },
        { id: `sim-${Date.now()}-2`, name: "Hand-Cut Garlic Fries", qty: 2, isPrepared: false },
      ],
      status: "PENDING",
      elapsedSeconds: 0,
    };

    setKdsTickets((prev) => [newTicket, ...prev.slice(0, 3)]);
    setTicketFlashAlert(`New ticket #${orderNum} dropped into KDS!`);
    setTimeout(() => setTicketFlashAlert(null), 3500);
  };

  // Advance ticket status directly
  const handleAdvanceTicketStatus = (ticketId: string) => {
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

  // Guest Cart total in Tab 1
  const guestCartTotalUSD = useMemo(() => {
    return guestCartItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  }, [guestCartItems]);

  const guestCartItemCount = useMemo(() => {
    return guestCartItems.reduce((acc, curr) => acc + curr.qty, 0);
  }, [guestCartItems]);

  // Handle adding smart upsell in Tab 1
  const handleAddSmartUpsell = () => {
    if (!upsellAdded) {
      setGuestCartItems((prev) => [
        ...prev,
        { id: "lemonade", name: "Craft Berry Lemonade", price: 4.5, qty: 1 },
      ]);
      setUpsellAdded(true);
    }
  };

  // Smooth scroll
  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ROI calculations based on user input
  const printSavingsAnnualUSD = roiTables * 32 * 12;
  const aovLiftUSD = (roiTables * 22 * 30 * roiCheckUSD * 0.18);
  const extraWeekendTurns = Math.round(roiTables * 1.8);
  const totalAnnualImpactUSD = printSavingsAnnualUSD + aovLiftUSD * 12;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0B0E14] font-sans selection:bg-amber-100 selection:text-amber-950">
      {/* ========================================================= */}
      {/* 0. STICKY EDITORIAL NAVBAR                                */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FAF8F5]/85 border-b border-[#E8E2D9] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0B0E14] text-white flex items-center justify-center shadow-md shadow-black/10 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-display font-extrabold text-xl tracking-tight text-[#0B0E14]">
                Dineeze
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDE7DF] border border-[#DDD5CA] text-stone-700 text-[11px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                V2.5 OS
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <button
              onClick={() => scrollToSection("interactive-stage")}
              className="hover:text-[#0B0E14] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 3-Surface Showcase
            </button>
            <button
              onClick={() => scrollToSection("why-switch")}
              className="hover:text-[#0B0E14] transition-colors cursor-pointer"
            >
              The Friday Rush
            </button>
            <button
              onClick={() => scrollToSection("table-craft")}
              className="hover:text-[#0B0E14] transition-colors cursor-pointer"
            >
              Physical Craft
            </button>
            <button
              onClick={() => scrollToSection("roi-calculator")}
              className="hover:text-[#0B0E14] transition-colors cursor-pointer"
            >
              ROI Estimator
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="hover:text-[#0B0E14] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/staff-login"
              className="px-3 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-[#F2ECE4] rounded-xl transition"
            >
              Staff Portal
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-stone-700 hover:text-[#0B0E14] hover:bg-[#F2ECE4] rounded-xl transition"
            >
              Owner Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#0B0E14] text-white hover:bg-stone-800 shadow-md transition-all duration-200 flex items-center gap-1.5 group"
            >
              Launch Restaurant
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-[#EDE8E0] transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E8E2D9] bg-[#FAF8F5]/95 backdrop-blur-xl px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3">
              <button
                onClick={() => scrollToSection("interactive-stage")}
                className="text-left font-semibold text-stone-800 hover:text-amber-700 py-1 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-600" /> 3-Surface Showcase (Menu, KDS, Floor)
              </button>
              <button
                onClick={() => scrollToSection("why-switch")}
                className="text-left font-semibold text-stone-800 hover:text-amber-700 py-1"
              >
                The Friday Rush Contrast
              </button>
              <button
                onClick={() => scrollToSection("table-craft")}
                className="text-left font-semibold text-stone-800 hover:text-amber-700 py-1"
              >
                Table-Tent QR & Thermal KOT
              </button>
              <button
                onClick={() => scrollToSection("roi-calculator")}
                className="text-left font-semibold text-stone-800 hover:text-amber-700 py-1"
              >
                Revenue Uplift Calculator
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left font-semibold text-stone-800 hover:text-amber-700 py-1"
              >
                Simple SaaS Tiers
              </button>
            </nav>
            <div className="pt-3 border-t border-[#E8E2D9] flex flex-col gap-2">
              <Link
                to="/staff-login"
                className="w-full text-center py-2.5 rounded-xl font-semibold text-stone-700 bg-[#EDE7DF] border border-[#DDD5CA]"
              >
                Staff Portal Sign In
              </Link>
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl font-semibold text-stone-800 bg-white border border-[#DDD5CA]"
              >
                Owner Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-3 rounded-xl font-bold bg-[#0B0E14] text-white shadow-sm flex items-center justify-center gap-2"
              >
                Launch Restaurant Free <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 1. EDITORIAL SPLIT-STAGE HERO                             */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#E8E2D9] bg-[radial-gradient(circle_at_70%_25%,rgba(217,119,6,0.07),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.06),transparent_50%)]">
        {/* Subtle dot texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Editorial Display Typography & CTAs */}
            <div className="lg:col-span-5 space-y-7 text-left">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E0D8CE] text-stone-800 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold tracking-wide text-[#0B0E14]">Dineeze V2</span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-600">Live Multi-Branch Restaurant OS</span>
              </div>

              {/* Bold Headline with Instrument Serif Italic Accent */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold font-display text-[#0B0E14] tracking-tight leading-[1.08]">
                Every dining room, in{" "}
                <span className="font-serif italic font-normal text-amber-700">
                  flawless rhythm.
                </span>
              </h1>

              {/* Crisp 2-line Value Proposition */}
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-lg">
                Guests scan a tabletop QR token to order and track food live on their own phones,
                while your kitchen displays and floor runners operate with zero noise or confusion.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link
                  to="/register"
                  className="px-7 py-4 rounded-xl font-bold bg-[#0B0E14] hover:bg-stone-800 text-white shadow-xl shadow-black/15 transition-all duration-200 flex items-center justify-center gap-2 group text-sm sm:text-base cursor-pointer"
                >
                  Launch Your Restaurant
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/m/table-1-spice-kitchen"
                  className="px-6 py-4 rounded-xl font-semibold bg-white border border-[#D9D1C7] hover:border-stone-400 text-stone-800 hover:bg-[#FAF8F5] shadow-xs transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Explore Live Guest Menu
                </Link>
              </div>

              {/* Trust Bar with Currency Selector */}
              <div className="pt-4 border-t border-[#E8E2D9] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>Zero app downloads • Works on any phone or tablet</span>
                  <div className="flex items-center gap-1 font-bold text-stone-700 bg-white px-2 py-0.5 rounded-lg border border-[#E0D8CE]">
                    {(["USD", "PKR", "INR", "GBP"] as SupportedCurrency[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setHeroCurrency(c)}
                        className={`px-1.5 py-0.5 rounded text-[11px] transition ${
                          heroCurrency === c ? "bg-[#0B0E14] text-white" : "hover:text-black"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Layered Editorial Composition with 3 Overlapping Floating UI Cards */}
            <div className="lg:col-span-7 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Main Culinary Photo Frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-black/10">
                  <img
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
                    alt="Warm ambient dining room"
                    className="w-full aspect-[4/3] object-cover scale-105 hover:scale-100 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                </div>

                {/* 1. Top-Left Floating Glass Badge: QR Scanned */}
                <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 backdrop-blur-md bg-white/95 border border-[#E0D8CE] rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5 animate-in fade-in duration-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="font-display font-extrabold text-xs text-stone-900">
                      QR Scanned • Table 04
                    </p>
                    <p className="text-[10px] text-stone-500">The Spice Kitchen (Flagship)</p>
                  </div>
                </div>

                {/* 2. Bottom-Left Floating Miniature Order Card */}
                <div className="absolute -bottom-6 -left-4 sm:-bottom-8 sm:-left-6 w-64 backdrop-blur-md bg-white/95 border border-[#E0D8CE] rounded-2xl p-3.5 shadow-2xl space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80"
                      alt="Burger"
                      className="w-11 h-11 rounded-lg object-cover border border-stone-200 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-xs text-stone-900 truncate">
                        Smoky Truffle Burger
                      </p>
                      <p className="text-xs font-extrabold text-emerald-600">
                        {CURRENCIES[heroCurrency].format(16.5)}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Upsell Pill */}
                  <button
                    onClick={() => setHeroUpsellAdded(!heroUpsellAdded)}
                    className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-between cursor-pointer ${
                      heroUpsellAdded
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : "bg-[#F5F0E8] text-stone-700 hover:bg-[#EFE8DD] border border-[#DDD5C9]"
                    }`}
                  >
                    <span>{heroUpsellAdded ? "✓ Added Truffle Fries" : "+ Add Garlic Truffle Fries"}</span>
                    <span className="font-mono text-[9px]">
                      +{CURRENCIES[heroCurrency].format(6.5)}
                    </span>
                  </button>
                </div>

                {/* 3. Bottom-Right Floating Dark-Mode KDS Snippet */}
                <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 w-60 bg-[#0B0E14] text-white border border-white/10 rounded-2xl p-3.5 shadow-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-xs">
                    <span className="font-mono font-bold text-amber-400">#108 • Table 04</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <Clock className="w-2.5 h-2.5" /> 02:14
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-stone-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">1x Smoky Truffle Burger</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs border border-stone-600 flex-shrink-0" />
                      <span className="text-stone-400 truncate">1x Hand-Cut Fries</span>
                    </div>
                  </div>
                  <span className="inline-block text-[9px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                    PREPARING • HOT LINE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. VENUE STRIP & "THE FRIDAY RUSH" CONTRAST               */}
      {/* ========================================================= */}
      <section id="why-switch" className="py-20 md:py-28 bg-[#F4F0EB] border-b border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Category Horizontal Marquee Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-stone-700">
            <span className="px-4 py-2 rounded-full bg-white border border-[#E0D8CE] shadow-xs flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-700" /> Specialty Cafés & Roasteries
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#E0D8CE] shadow-xs flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-emerald-700" /> Smash Burger & Casual
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#E0D8CE] shadow-xs flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-700" /> Fine Dining & Bistros
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#E0D8CE] shadow-xs flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-700" /> Multi-Branch Cloud Kitchens
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#E0D8CE] shadow-xs flex items-center gap-2">
              <Beer className="w-4 h-4 text-amber-600" /> Hotel Lounges & Rooftops
            </span>
          </div>

          {/* Section Heading */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
              THE FRIDAY NIGHT SHIFT
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-[#0B0E14] tracking-tight">
              The 8:00 PM Test:{" "}
              <span className="font-serif italic font-normal text-amber-700">
                Friction vs. Flow.
              </span>
            </h2>
            <p className="text-stone-600 text-sm sm:text-base">
              When full dining rooms hit capacity, outdated paper routines crumble. Dineeze keeps every
              station in effortless rhythm.
            </p>
          </div>

          {/* Two-Column Contrast Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left Card: The Old Paper & POS Bottleneck */}
            <div className="bg-[#EFEAE2] rounded-3xl p-8 border border-[#DDD5CA] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-stone-700">
                  <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center text-stone-700">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-extrabold text-xl text-stone-900">
                    The Old Paper & POS Bottleneck
                  </h3>
                </div>
                <p className="text-xs text-stone-500">
                  How high-friction manual ordering costs restaurants 18+ minutes per table:
                </p>

                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[#DDD5CA] space-y-1">
                    <p className="font-bold text-xs text-stone-900">1. The 15-Minute Wait</p>
                    <p className="text-xs text-stone-600">
                      Guests look around frantically trying to flag down a server just to ask for drinks or the bill.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[#DDD5CA] space-y-1">
                    <p className="font-bold text-xs text-stone-900">2. Costly Menu Reprints</p>
                    <p className="text-xs text-stone-600">
                      $400–$800 wasted every quarter re-laminating paper sheets whenever prices or specials shift.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[#DDD5CA] space-y-1">
                    <p className="font-bold text-xs text-stone-900">3. Missed Modifier Notes</p>
                    <p className="text-xs text-stone-600">
                      Scribbled paper order notes cause allergy mistakes, wrong side dishes, and wasted food remakes.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[#DDD5CA] space-y-1">
                    <p className="font-bold text-xs text-stone-900">4. Messy Split Bills</p>
                    <p className="text-xs text-stone-600">
                      Waiters spend 10 stressful minutes per table computing separate credit cards with handheld POS machines.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDD5CA] text-xs font-semibold text-stone-500">
                Result: Stressed staff, longer table waits, lower dinner turnover.
              </div>
            </div>

            {/* Right Card: The Dineeze Operating Rhythm */}
            <div className="bg-[#0B0E14] text-white rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-extrabold text-xl text-white">
                    The Dineeze Operating Rhythm
                  </h3>
                </div>
                <p className="text-xs text-stone-400">
                  Sub-second contactless coordination from tabletop scan to hot kitchen pass:
                </p>

                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-emerald-400">1. 12-Second Scan-to-KDS</p>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded font-mono">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-stone-300">
                      Guests scan immediately upon sitting down. Orders land on the cook line with an audible chime.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                    <p className="font-bold text-xs text-white">2. Live Sold-Out Inventory Sync</p>
                    <p className="text-xs text-stone-300">
                      86 any ingredient in 1 click; the item immediately greys out on all customer mobile screens.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                    <p className="font-bold text-xs text-white">3. Intelligent Cart Upsells (+18% AOV)</p>
                    <p className="text-xs text-stone-300">
                      Automated suggestions prompt high-margin beverage and truffle side additions right before checkout.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                    <p className="font-bold text-xs text-white">4. 1-Tap Split-Bill Settlement</p>
                    <p className="text-xs text-stone-300">
                      Diners divide checks equally in 2, 3, or 4 ways directly on their phone with zero waiter math.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-semibold text-emerald-400 relative z-10 flex items-center justify-between">
                <span>Result: Faster turns, +18% average check size, calmer staff.</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                  99.98% UPTIME
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE 3-SURFACE PRODUCT STAGE (TABBED)           */}
      {/* ========================================================= */}
      <section
        id="interactive-stage"
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E8E2D9]"
      >
        <div className="text-center space-y-3 mb-12 max-w-3xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
            INTERACTIVE SYSTEM STAGE
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-[#0B0E14] tracking-tight">
            Three Surfaces,{" "}
            <span className="font-serif italic font-normal text-amber-700">
              one unified pulse.
            </span>
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Click through all three operational layers to test the actual interfaces used by guests,
            chefs, and floor managers:
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#EDE7DF] border border-[#DDD5CA] shadow-inner gap-1">
            <button
              onClick={() => setProductTab("menu")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                productTab === "menu"
                  ? "bg-[#0B0E14] text-white shadow-md"
                  : "text-stone-700 hover:text-black"
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              1. Guest Mobile Menu
            </button>
            <button
              onClick={() => setProductTab("kds")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                productTab === "kds"
                  ? "bg-[#0B0E14] text-white shadow-md"
                  : "text-stone-700 hover:text-black"
              }`}
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              2. Real-Time KDS
            </button>
            <button
              onClick={() => setProductTab("floor")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                productTab === "floor"
                  ? "bg-[#0B0E14] text-white shadow-md"
                  : "text-stone-700 hover:text-black"
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400" />
              3. Live Floor & Analytics
            </button>
          </div>
        </div>

        {/* Tab Stage Content Container */}
        <div className="bg-white rounded-3xl border border-[#DDD5CA] p-6 sm:p-10 shadow-xl min-h-[520px]">
          {/* TAB 1: ZERO-LOGIN GUEST MENU */}
          {productTab === "menu" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              {/* Controls Column */}
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Surface 01 • Guest Mobile Experience
                  </span>
                  <h3 className="text-2xl font-bold font-display text-stone-900">
                    Zero-Friction Mobile Ordering
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Zero app installs or user logins required. Diners scan with standard iOS/Android cameras
                    and customize their order directly in their mobile browser.
                  </p>
                </div>

                {/* Theme Switcher */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Test Brand Theming Engine:
                  </p>
                  <div className="flex gap-2">
                    {[
                      { id: "espresso", label: "Midnight Espresso", hex: "#0B0E14" },
                      { id: "emerald", label: "Emerald Bistro", hex: "#059669" },
                      { id: "crimson", label: "Crimson Grill", hex: "#BE123C" },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setGuestTheme(theme.id as "espresso" | "emerald" | "crimson")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          guestTheme === theme.id
                            ? "bg-[#0B0E14] text-white border-black"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.hex }} />
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart Upsell Prompt */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DDD5CA] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">Smart Cart Upsell Engine</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      +18% AOV
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Pairs best-sellers automatically right before the final checkout screen.
                  </p>
                  <button
                    onClick={handleAddSmartUpsell}
                    disabled={upsellAdded}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      upsellAdded
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    }`}
                  >
                    {upsellAdded ? "✓ Added Lemonade to Order" : "+ Add Craft Berry Lemonade ($4.50)"}
                  </button>
                </div>
              </div>

              {/* Mobile Phone Mockup */}
              <div className="lg:col-span-7 flex justify-center">
                <div
                  className={`w-full max-w-[320px] rounded-[2.5rem] border-8 border-stone-900 shadow-2xl p-4 transition-colors duration-300 ${
                    guestTheme === "espresso"
                      ? "bg-[#0B0E14] text-white"
                      : guestTheme === "emerald"
                      ? "bg-[#032e22] text-white"
                      : "bg-[#2b0811] text-white"
                  }`}
                >
                  {/* Dynamic Island */}
                  <div className="w-20 h-3.5 bg-stone-900 rounded-full mx-auto mb-3" />

                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                    <div>
                      <h4 className="font-display font-bold text-xs text-white">The Spice Kitchen</h4>
                      <p className="text-[10px] text-stone-400">Artisan Bistro • Table 04</p>
                    </div>
                    {/* Live Wait-Time Badge */}
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      ~14m wait
                    </span>
                  </div>

                  {/* Dish List inside Phone */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80"
                        alt="Burger"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate">Smoky Truffle Burger</p>
                        <p className="text-[10px] text-emerald-400 font-bold">$16.50</p>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">1x</span>
                    </div>

                    {upsellAdded && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-between gap-2 animate-in fade-in">
                        <img
                          src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80"
                          alt="Lemonade"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate">Craft Berry Lemonade</p>
                          <p className="text-[10px] text-emerald-400 font-bold">$4.50</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/40 px-2 py-0.5 rounded font-bold">1x</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Cart Drawer */}
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Total ({guestCartItemCount} items)</span>
                      <span className="font-bold text-white">${guestCartTotalUSD.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setProductTab("kds")}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>Send to Kitchen KDS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REAL-TIME KITCHEN DISPLAY SYSTEM (KDS) */}
          {productTab === "kds" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* KDS Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-display font-extrabold text-xl text-stone-900">
                      Kitchen Display System (KDS) • Station 01
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Click any dish checkbox to toggle its individual prep status. Tap a ticket badge to advance.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Toggle Kitchen Chime"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
                    <span className="hidden sm:inline">{soundEnabled ? "Audio ON" : "Muted"}</span>
                  </button>

                  <button
                    onClick={() => setKotModalOpen(!kotModalOpen)}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>80mm KOT Preview</span>
                  </button>

                  <button
                    onClick={handleSimulateNewOrder}
                    className="px-4 py-2 rounded-xl bg-[#0B0E14] hover:bg-stone-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simulate New Order</span>
                  </button>
                </div>
              </div>

              {/* Notification Banner when ticket arrives */}
              {ticketFlashAlert && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold animate-bounce">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    {ticketFlashAlert}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">0.18s Sync</span>
                </div>
              )}

              {/* Thermal Ticket Modal / Inline Preview */}
              {kotModalOpen && (
                <div className="p-4 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 font-mono text-xs max-w-sm mx-auto space-y-2 shadow-2xl relative">
                  <div className="text-center border-b border-dashed border-stone-700 pb-2">
                    <p className="font-bold text-white text-sm">*** THE SPICE KITCHEN ***</p>
                    <p className="text-[10px] text-stone-400">TABLE 04 • GUEST DINE-IN</p>
                    <p className="text-[10px] text-emerald-400">KOT #1042 • 20:14:02</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white">1x SMOKY TRUFFLE BURGER</p>
                    <p className="text-[10px] text-amber-300 italic"> * MEDIUM RARE / NO ONION</p>
                    <p className="text-stone-300">1x GARLIC TRUFFLE FRIES</p>
                    <p className="text-stone-300">1x CRAFT BERRY LEMONADE</p>
                  </div>
                  <div className="border-t border-dashed border-stone-700 pt-2 flex justify-between font-bold text-emerald-400">
                    <span>TOTAL:</span>
                    <span>$27.50</span>
                  </div>
                  <button
                    onClick={() => setKotModalOpen(false)}
                    className="w-full mt-2 py-1 bg-stone-800 text-stone-300 hover:text-white rounded text-[10px] text-center"
                  >
                    Close Preview
                  </button>
                </div>
              )}

              {/* Tickets Column Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kdsTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-2xl bg-[#0B0E14] text-white border border-white/10 shadow-lg space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
                        <span className="font-mono font-bold text-white text-sm">
                          #{ticket.orderNumber} • <span className="text-amber-400">{ticket.table}</span>
                        </span>
                        <span className="font-mono text-stone-400 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          {formatTimer(ticket.elapsedSeconds)}
                        </span>
                      </div>

                      {/* Items with click-to-prepare toggle */}
                      <div className="space-y-1.5">
                        {ticket.items.map((it) => (
                          <div
                            key={it.id}
                            onClick={() => handleToggleItemPrepared(ticket.id, it.id)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2 ${
                              it.isPrepared
                                ? "bg-emerald-950/40 border-emerald-500/40 text-stone-400 line-through"
                                : "bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={it.isPrepared}
                              onChange={() => {}}
                              className="mt-0.5 accent-emerald-500 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {it.qty}x {it.name}
                              </p>
                              {it.note && (
                                <p className="text-[10px] text-amber-300 italic not-italic">
                                  *{it.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdvanceTicketStatus(ticket.id)}
                      className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        ticket.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                          : ticket.status === "PREPARING"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {ticket.status} • TAP TO ADVANCE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE FLOOR & EXECUTIVE ANALYTICS */}
          {productTab === "floor" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-stone-900">
                    Live Dining Room Floor & Split-Check Hub
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Click any table to view floor status, split bills, and live occupancy trends:
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-stone-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-stone-400" /> Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Cooking
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ready
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Bill Due
                  </span>
                </div>
              </div>

              {/* 6-Table Floor Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {floorTables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedFloorTable(t.id)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[110px] ${
                      selectedFloorTable === t.id
                        ? "bg-stone-900 text-white border-black ring-2 ring-emerald-500 shadow-md"
                        : "bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{t.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          t.status === "AVAILABLE"
                            ? "bg-stone-400"
                            : t.status === "COOKING"
                            ? "bg-amber-500 animate-pulse"
                            : t.status === "READY"
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                      />
                    </div>
                    <div className="space-y-0.5 text-[11px] opacity-80">
                      <p>{t.guests > 0 ? `${t.guests} Diners` : "Vacant"}</p>
                      <p className="font-extrabold">{t.tabTotal > 0 ? `$${t.tabTotal.toFixed(2)}` : "$0.00"}</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </button>
                ))}
              </div>

              {/* Split Bill Calculator & Executive Metrics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Split Bill Widget */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD5CA] space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-stone-900">
                      Table 0{selectedFloorTable} Split Settlement
                    </span>
                    <span className="text-xs font-extrabold text-stone-900">
                      Tab: ${(floorTables.find((t) => t.id === selectedFloorTable)?.tabTotal || 88.5).toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>Divide Check Equally:</span>
                      <span className="font-bold text-emerald-700">{splitGuests} Diners</span>
                    </div>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => setSplitGuests(num)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            splitGuests === num
                              ? "bg-[#0B0E14] text-white"
                              : "bg-white border border-[#DDD5CA] text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {num} Guests
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#DDD5CA] flex items-center justify-between">
                    <span className="text-xs text-stone-500">Each Guest Owes:</span>
                    <span className="text-lg font-black font-display text-emerald-700">
                      ${(
                        (floorTables.find((t) => t.id === selectedFloorTable)?.tabTotal || 88.5) /
                        splitGuests
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Executive Sparkline Metrics */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-left">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Today&apos;s Revenue
                    </span>
                    <p className="text-2xl font-black font-display text-stone-900">$3,420</p>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> +24% vs last Friday
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-left">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Avg Table Turn
                    </span>
                    <p className="text-2xl font-black font-display text-stone-900">34 mins</p>
                    <span className="text-[11px] text-blue-600 font-semibold">
                      ↓ 16 mins faster turns
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-left">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Guest Satisfaction
                    </span>
                    <p className="text-2xl font-black font-display text-amber-600">4.9 ★</p>
                    <span className="text-[11px] text-stone-500">Based on 148 ratings</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. PHYSICAL-MEETS-DIGITAL CRAFT SECTION                   */}
      {/* ========================================================= */}
      <section id="table-craft" className="py-24 md:py-32 bg-[#F4F0EB] border-b border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
              PHYSICAL CRAFT
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-[#0B0E14] tracking-tight">
              Your brand,{" "}
              <span className="font-serif italic font-normal text-amber-700">
                on every table.
              </span>
            </h2>
            <p className="text-stone-600 text-sm sm:text-base">
              Dineeze seamlessly bridges physical dining rooms and digital speed. No ugly iPad stands or
              clunky hardware installations.
            </p>
          </div>

          {/* Side-by-Side Physical Craft Cards: Table Tent QR Stand + 80mm Thermal KOT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            {/* Left Card: Realistic Acrylic Table-Tent QR Stand */}
            <div className="p-8 rounded-3xl bg-white border border-[#DDD5CA] shadow-xl space-y-6 flex flex-col items-center text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full uppercase">
                  Tabletop QR Stand (Acrylic Preview)
                </span>
                <h3 className="text-xl font-bold font-display text-stone-900">
                  Custom Brand Table-Tent
                </h3>
              </div>

              {/* Realistic Acrylic Stand Graphic */}
              <div className="w-64 p-6 rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-[#EDE7DF] border-2 border-white shadow-2xl space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0B0E14] text-white flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="font-display font-extrabold text-sm text-stone-900">
                    The Spice Kitchen
                  </span>
                </div>

                {/* Real Vector QRCodeSVG */}
                <div className="p-3 bg-white rounded-xl shadow-md border border-stone-200 inline-block">
                  <QRCodeSVG
                    value="https://dineeze.vercel.app/m/table-1-spice-kitchen"
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-0.5">
                  <p className="font-display font-black text-xs text-stone-900 uppercase tracking-wider">
                    TABLE 04 • SCAN TO DINE
                  </p>
                  <p className="text-[10px] text-stone-500">Camera scan • No app required</p>
                </div>

                <div className="pt-2 border-t border-[#DDD5CA] text-[9px] text-stone-400">
                  Guest Wi-Fi: SpiceGuest • Pass: dine2026
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4 text-xs font-bold text-stone-600">
                <span>Vector 300 DPI Export</span>
                <span>•</span>
                <span>Standard Acrylic Sizes</span>
              </div>
            </div>

            {/* Right Card: Serrated 80mm Thermal Kitchen Ticket */}
            <div className="p-8 rounded-3xl bg-white border border-[#DDD5CA] shadow-xl space-y-6 flex flex-col items-center text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                  Cook Line Thermal Printout (KOT)
                </span>
                <h3 className="text-xl font-bold font-display text-stone-900">
                  80mm ESC/POS Kitchen Slip
                </h3>
              </div>

              {/* Serrated Thermal Receipt Graphic */}
              <div className="w-64 p-5 bg-stone-900 text-stone-200 font-mono text-xs rounded-xl border border-stone-800 shadow-2xl space-y-2 text-left relative overflow-hidden">
                <div className="text-center border-b border-dashed border-stone-700 pb-2 space-y-0.5">
                  <p className="font-bold text-white text-xs">*** THE SPICE KITCHEN ***</p>
                  <p className="text-[10px] text-stone-400">TABLE 04 • GUEST QR</p>
                  <p className="text-[10px] text-emerald-400">ORDER #1042 • 20:14:02</p>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold text-white">
                    <span>1x SMOKY TRUFFLE BURGER</span>
                    <span>$16.50</span>
                  </div>
                  <p className="text-[10px] text-amber-300 italic"> * MEDIUM RARE, NO ONION</p>
                  <div className="flex justify-between text-stone-300">
                    <span>1x GARLIC TRUFFLE FRIES</span>
                    <span>$6.50</span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>1x CRAFT BERRY LEMONADE</span>
                    <span>$4.50</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-700 pt-2 flex justify-between font-bold text-emerald-400 text-xs">
                  <span>SUBTOTAL:</span>
                  <span>$27.50</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4 text-xs font-bold text-stone-600">
                <span>Epson & Star Micronics Ready</span>
                <span>•</span>
                <span>Auto-Cut Supported</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INTERACTIVE RESTAURANT ROI & UPLIFT CALCULATOR         */}
      {/* ========================================================= */}
      <section
        id="roi-calculator"
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E8E2D9]"
      >
        <div className="text-center space-y-3 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
            BUSINESS IMPACT ESTIMATOR
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-[#0B0E14] tracking-tight">
            Calculate your{" "}
            <span className="font-serif italic font-normal text-amber-700">
              revenue uplift.
            </span>
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            See the exact financial benefit of eliminating paper reprints and boosting table turnover:
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#DDD5CA] p-8 sm:p-12 shadow-xl space-y-8">
          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Slider 1: Number of Tables */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="roi-tables-slider" className="font-display font-bold text-sm text-stone-900">
                  Number of Dining Tables:
                </label>
                <span className="font-black text-xl text-stone-900 bg-[#FAF8F5] px-3 py-1 rounded-xl border border-[#DDD5CA]">
                  {roiTables} Tables
                </span>
              </div>
              <input
                id="roi-tables-slider"
                type="range"
                min="5"
                max="60"
                value={roiTables}
                onChange={(e) => setRoiTables(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>5 Tables</span>
                <span>30 Tables</span>
                <span>60 Tables</span>
              </div>
            </div>

            {/* Slider 2: Average Check Size in USD */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="roi-check-slider" className="font-display font-bold text-sm text-stone-900">
                  Average Guest Check Size:
                </label>
                <span className="font-black text-xl text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  ${roiCheckUSD} USD
                </span>
              </div>
              <input
                id="roi-check-slider"
                type="range"
                min="15"
                max="120"
                step="5"
                value={roiCheckUSD}
                onChange={(e) => setRoiCheckUSD(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>$15 (Café)</span>
                <span>$60 (Casual Dining)</span>
                <span>$120 (Fine Bistro)</span>
              </div>
            </div>
          </div>

          {/* Computed Metrics Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-100">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD5CA] space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Annual Print & Reprint Savings
              </span>
              <p className="text-2xl font-black font-display text-stone-900">
                ${printSavingsAnnualUSD.toLocaleString()}/yr
              </p>
              <p className="text-[11px] text-stone-500">
                Zero laminated paper, card inserts, or seasonal revision printing costs.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD5CA] space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Estimated +18% Upsell Lift
              </span>
              <p className="text-2xl font-black font-display text-emerald-700">
                +${Math.round(aovLiftUSD).toLocaleString()}/mo
              </p>
              <p className="text-[11px] text-stone-500">
                From automated side and beverage suggestions at mobile checkout.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD5CA] space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Extra Weekend Table Turns
              </span>
              <p className="text-2xl font-black font-display text-amber-700">
                +{extraWeekendTurns} Turns/night
              </p>
              <p className="text-[11px] text-stone-500">
                Diners order and settle tabs 16–18 minutes faster.
              </p>
            </div>
          </div>

          {/* Total Estimated ROI Callout Banner */}
          <div className="p-6 rounded-2xl bg-[#0B0E14] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-400">Total Estimated Annual Impact</p>
              <p className="text-2xl sm:text-3xl font-black font-display text-white">
                +${Math.round(totalAnnualImpactUSD).toLocaleString()}{" "}
                <span className="text-xs text-stone-400 font-normal">/ year</span>
              </p>
            </div>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 flex-shrink-0"
            >
              Start Free Setup <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. TRANSPARENT SAAS TIERS (STARTER VS. GROWTH PRO)        */}
      {/* ========================================================= */}
      <section
        id="pricing"
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E8E2D9]"
      >
        <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
            SIMPLE, DIRECT PRICING
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-[#0B0E14] tracking-tight">
            Transparent hospitality{" "}
            <span className="font-serif italic font-normal text-amber-700">
              software tiers.
            </span>
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            No percentage cuts on food orders. No proprietary tablet hardware leases.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-[#EDE7DF] border border-[#DDD5CA] text-xs font-bold mt-2">
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
                  ? "bg-[#0B0E14] text-white shadow-sm"
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
          {/* Tier 1: Starter (Single Café) */}
          <div className="bg-white border border-[#DDD5CA] rounded-3xl p-8 space-y-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
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
                  Ideal for cafes, single-room popups, and food trucks getting started.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-3">
                <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Included Capabilities:
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
                    <span>Real-Time Kitchen KDS with Chime Alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Multi-Currency (PKR, USD, INR, GBP)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Printable Acrylic Table-Tent QR Stand PDFs</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl font-bold bg-[#FAF8F5] hover:bg-stone-200 text-stone-900 text-center text-sm transition shadow-xs border border-[#DDD5CA]"
            >
              Launch Free Restaurant
            </Link>
          </div>

          {/* Tier 2: Growth Pro (Multi-Branch) */}
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 space-y-8 flex flex-col justify-between shadow-xl relative">
            <span className="absolute -top-3.5 right-8 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
              Most Popular
            </span>

            <div className="space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                  Growth Pro (Multi-Branch)
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
                  For high-volume restaurants, multi-room dining venues, and hospitality groups.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-3">
                <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Everything in Starter, plus:
                </p>
                <ul className="space-y-3 text-xs text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-stone-950">Unlimited Tables & Multi-Branch Management</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Staff Role-Based Access (Manager, Kitchen, Waiter PINs)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Live Floor Map & Split-Bill Tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>1-Click Menu Cloning Across Locations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Order Audit Logs & Peak Hour Analytics</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl font-bold bg-[#0B0E14] hover:bg-stone-800 text-white text-center text-sm transition shadow-lg"
            >
              Start 14-Day Free Pro Trial
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FULL-BLEED OBSIDIAN CLOSING STAGE & FOOTER             */}
      {/* ========================================================= */}
      <section className="bg-[#0B0E14] text-white relative overflow-hidden py-24 sm:py-32">
        {/* Warm Ambient Glows */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-stone-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Instant Hospitality Activation
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight leading-tight">
            Ready to turn every table{" "}
            <span className="font-serif italic font-normal text-amber-400">
              faster tonight?
            </span>
          </h2>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Set up your entire digital menu in under 2 minutes. Cut guest table friction by 18 minutes.
            Keep cooks and floor staff in perfect coordination with zero hardware leases.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-white hover:bg-stone-100 text-[#0B0E14] text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              Create Free Restaurant Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/m/table-1-spice-kitchen"
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm sm:text-base transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Try Live Demo Menu
            </Link>
          </div>

          <p className="text-xs text-stone-400 pt-1">
            No credit card required • Instant setup • Cancel anytime
          </p>
        </div>
      </section>

      {/* ARCHITECTURAL FOOTER */}
      <footer className="bg-[#0B0E14] border-t border-white/10 text-stone-400 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#0B0E14] flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-4 h-4 text-[#0B0E14]" />
                </div>
                <span className="font-display font-extrabold text-lg text-white tracking-tight">
                  Dineeze
                </span>
              </Link>
              <p className="text-xs text-stone-400 leading-relaxed">
                Contactless tabletop ordering, digital QR menus, and real-time kitchen displays for
                high-velocity restaurants.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational (Sockets Active)</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                Product
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li>
                  <button
                    onClick={() => scrollToSection("interactive-stage")}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Guest Mobile Menu
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("interactive-stage")}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Kitchen Display (KDS)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("table-craft")}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Table-Tent QR Stands
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Pricing & Free Plan
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Hospitality Verticals */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                Hospitality
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li className="flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-stone-500" /> Full-Service Bistros
                </li>
                <li className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-stone-500" /> Specialty Cafés
                </li>
                <li className="flex items-center gap-1.5">
                  <Beer className="w-3.5 h-3.5 text-stone-500" /> Craft Breweries & Bars
                </li>
                <li className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-stone-500" /> Hotel Room Dining
                </li>
              </ul>
            </div>

            {/* Col 4: Architecture */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                Architecture
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li>
                  <span className="text-stone-300 font-semibold">Postgres:</span> Neon Serverless
                </li>
                <li>
                  <span className="text-stone-300 font-semibold">Sockets:</span> Socket.io Low-Latency
                </li>
                <li>
                  <span className="text-stone-300 font-semibold">Media CDN:</span> Cloudinary SDK
                </li>
                <li>
                  <span className="text-stone-300 font-semibold">Isolation:</span> Strict restaurantId
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} Dineeze Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/staff-login" className="hover:text-stone-300 transition">
                Staff Portal
              </Link>
              <Link to="/login" className="hover:text-stone-300 transition">
                Owner Login
              </Link>
              <Link to="/register" className="hover:text-stone-300 transition">
                Get Started
              </Link>
              <Link to="/m/table-1-spice-kitchen" className="hover:text-stone-300 transition">
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
