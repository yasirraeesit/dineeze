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
  Layers,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
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
    gain1.gain.setValueAtTime(0.22, now);
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
    gain2.gain.setValueAtTime(0.15, now + 0.05);
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
  rate: number;
  format: (amountUSD: number) => string;
}

const CURRENCIES: Record<SupportedCurrency, CurrencyMetadata> = {
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

  // Kitchen Chime State
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hero interactive state
  const [heroCurrency, setHeroCurrency] = useState<SupportedCurrency>("USD");
  const [heroUpsellAdded, setHeroUpsellAdded] = useState(false);

  // Section 3: 3-Tab Product Walkthrough
  const [productTab, setProductTab] = useState<"menu" | "kds" | "floor">("menu");

  // Tab 1 (Guest Menu) State
  const [guestTheme, setGuestTheme] = useState<"espresso" | "emerald" | "crimson">("espresso");
  const [guestUpsellAdded, setGuestUpsellAdded] = useState(false);

  // Tab 2 (KDS) State
  const [kdsTickets, setKdsTickets] = useState<KDSTicket[]>([
    {
      id: "ticket-1042",
      orderNumber: "1042",
      table: "Table 04",
      items: [
        { id: "item-1", name: "Smoky Truffle Burger", qty: 1, note: "Medium-rare", isPrepared: false },
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
  const [ticketAlert, setTicketAlert] = useState<string | null>(null);
  const [showThermalPreview, setShowThermalPreview] = useState(false);

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
  const [roiCurrency, setRoiCurrency] = useState<SupportedCurrency>("USD");

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

  // Toggle dish preparation checkbox in KDS
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

  // Simulate new order into KDS
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
        { id: `sim-${Date.now()}-1`, name: "Smoky Truffle Burger", qty: 2, note: "No onion on 1", isPrepared: false },
        { id: `sim-${Date.now()}-2`, name: "Garlic Truffle Fries", qty: 2, isPrepared: false },
      ],
      status: "PENDING",
      elapsedSeconds: 0,
    };

    setKdsTickets((prev) => [newTicket, ...prev.slice(0, 3)]);
    setTicketAlert(`Order #${orderNum} landed on cook line (< 200ms)`);
    setTimeout(() => setTicketAlert(null), 3500);
  };

  // Smooth scroll helper
  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ROI computations in selected currency
  const roiMultiplier = CURRENCIES[roiCurrency].rate;
  const annualPrintSavings = Math.round(roiTables * 32 * 12 * roiMultiplier);
  const monthlyAovLift = Math.round(roiTables * 22 * 30 * 45 * 0.18 * roiMultiplier);

  const activeTabTotal = useMemo(() => {
    return floorTables.find((t) => t.id === selectedFloorTable)?.tabTotal || 88.5;
  }, [selectedFloorTable, floorTables]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111315] font-sans antialiased overflow-x-hidden selection:bg-amber-100 selection:text-amber-950">
      {/* ========================================================= */}
      {/* 1. ROCK-SOLID RESPONSIVE NAVBAR                           */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Left: Brand Logo & Wordmark */}
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
                V2 OS
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links (>= 1024px only) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <button
              onClick={() => scrollToSection("product-showcase")}
              className="hover:text-[#111315] transition-colors cursor-pointer"
            >
              Product
            </button>
            <button
              onClick={() => {
                setProductTab("kds");
                scrollToSection("product-showcase");
              }}
              className="hover:text-[#111315] transition-colors cursor-pointer"
            >
              Kitchen KDS
            </button>
            <button
              onClick={() => scrollToSection("friday-rush")}
              className="hover:text-[#111315] transition-colors cursor-pointer"
            >
              Floor & POS
            </button>
            <button
              onClick={() => scrollToSection("pricing-section")}
              className="hover:text-[#111315] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Desktop: Sign In + Get Started (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              to="/staff-login"
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 px-2.5 py-1.5 transition"
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
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#111315] text-white hover:bg-stone-800 shadow-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          </div>

          {/* Mobile & Tablet Controls (< 1024px): Crisp Get Started + Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111315] text-white hover:bg-stone-800 transition whitespace-nowrap shrink-0"
            >
              Get Started
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 transition shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-stone-200 bg-[#FAF8F5] px-4 py-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold text-stone-800">
              <button
                onClick={() => scrollToSection("product-showcase")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Product Walkthrough
              </button>
              <button
                onClick={() => {
                  setProductTab("kds");
                  scrollToSection("product-showcase");
                }}
                className="text-left py-1 hover:text-emerald-700"
              >
                Kitchen KDS Display
              </button>
              <button
                onClick={() => scrollToSection("friday-rush")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Floor Operations & POS
              </button>
              <button
                onClick={() => scrollToSection("roi-section")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Savings & ROI Calculator
              </button>
              <button
                onClick={() => scrollToSection("pricing-section")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Pricing Tiers
              </button>
            </nav>

            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
              <Link
                to="/staff-login"
                className="w-full text-center py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition"
              >
                Staff Portal Sign In
              </Link>
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2 text-xs font-bold text-stone-800 bg-white hover:bg-stone-50 rounded-lg border border-stone-200 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center py-2 text-xs font-bold bg-[#111315] text-white hover:bg-stone-800 rounded-lg shadow-xs transition"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. GROUNDED EDITORIAL HERO                                */}
      {/* ========================================================= */}
      <section className="py-14 lg:py-22 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column (lg:col-span-6): Copy & CTAs */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Eyebrow Tag */}
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold tracking-wide uppercase">
                  RESTAURANT OPERATING SYSTEM
                </span>
              </div>

              {/* Bold Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold font-display text-[#111315] tracking-tight leading-[1.1]">
                Table ordering, without the{" "}
                <span className="font-serif italic font-normal text-amber-700">
                  bottleneck.
                </span>
              </h1>

              {/* Concise 2-Sentence Value Prop */}
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                Dineeze lets guests scan, order, and pay directly from their mobile browser. Tickets
                beam instantly to kitchen displays and floor staff with zero app downloads and zero
                proprietary hardware.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl font-bold bg-[#111315] hover:bg-stone-800 text-white shadow-xs transition-all flex items-center justify-center gap-2 text-sm sm:text-base group"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/m/table-1-spice-kitchen"
                  className="px-5 py-3.5 rounded-xl font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 shadow-xs transition flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Try Live Guest Menu
                </Link>
              </div>

              {/* Simple 3-Item Trust Row */}
              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-medium text-stone-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  No app download
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Live KDS sync (&lt; 200ms)
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  PKR • USD • INR • GBP
                </span>
              </div>
            </div>

            {/* Right Column (lg:col-span-6): Grounded Single Framed Window Showcase */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
                {/* Window Title Bar */}
                <div className="h-10 bg-stone-50 border-b border-stone-200 px-4 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                    <span className="ml-1 font-semibold text-stone-700">
                      Table 04 • Spice Kitchen Flagship
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Session
                  </div>
                </div>

                {/* Window Body: Image + Live Interactive Order Card Side-by-Side */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                  {/* Dining Room Photo */}
                  <div className="rounded-xl overflow-hidden border border-stone-200 h-48 sm:h-auto min-h-[180px] relative">
                    <img
                      src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                      alt="Artisan Dining Room"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-[#111315]/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      Acrylic Stand Table 04
                    </div>
                  </div>

                  {/* Interactive Order Card */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900">Guest Order #1042</span>
                        <div className="flex gap-1 font-mono text-[10px] bg-white border border-stone-200 rounded px-1.5 py-0.5">
                          {(["USD", "PKR", "INR", "GBP"] as SupportedCurrency[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => setHeroCurrency(c)}
                              className={`px-1 rounded transition ${
                                heroCurrency === c ? "bg-[#111315] text-white font-bold" : "text-stone-500"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-stone-200 space-y-0.5 text-left">
                        <div className="flex justify-between text-xs font-semibold text-stone-900">
                          <span>1x Smoky Truffle Burger</span>
                          <span>{CURRENCIES[heroCurrency].format(16.5)}</span>
                        </div>
                        <p className="text-[10px] text-stone-500">Black Angus • Brioche</p>
                      </div>

                      {/* Interactive Upsell Toggle */}
                      <button
                        onClick={() => setHeroUpsellAdded(!heroUpsellAdded)}
                        className={`w-full p-2 rounded-lg text-left text-xs font-semibold border transition cursor-pointer flex items-center justify-between ${
                          heroUpsellAdded
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-white border-dashed border-stone-300 text-stone-600 hover:border-stone-400"
                        }`}
                      >
                        <span className="text-[11px]">
                          {heroUpsellAdded ? "✓ Added Truffle Fries" : "+ Add Garlic Truffle Fries"}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600">
                          +{CURRENCIES[heroCurrency].format(6.5)}
                        </span>
                      </button>
                    </div>

                    {/* Order Status Badge */}
                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" /> 02:14 prep
                      </span>
                      <span className="font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[10px]">
                        COOK LINE • PREPARING
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. ARCHITECTURAL METRICS BAND & VENUE STRIP               */}
      {/* ========================================================= */}
      <section className="border-b border-stone-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* 4 Tabular Metrics Separated by Subtle Hairlines */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stone-200 text-center">
            <div className="py-2 px-4 space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold font-display text-[#111315]">&lt; 200ms</p>
              <p className="text-xs text-stone-500 font-medium">Kitchen WebSocket Sync</p>
            </div>
            <div className="py-2 px-4 space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold font-display text-[#111315]">0</p>
              <p className="text-xs text-stone-500 font-medium">App Installs Required</p>
            </div>
            <div className="py-2 px-4 space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold font-display text-[#111315]">4</p>
              <p className="text-xs text-stone-500 font-medium">Currencies Native</p>
            </div>
            <div className="py-2 px-4 space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold font-display text-[#111315]">100%</p>
              <p className="text-xs text-stone-500 font-medium">Web Browser-Based</p>
            </div>
          </div>

          {/* Clean Venue Strip */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-stone-600">
            <span className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200">
              Specialty Cafés
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200">
              Smash Burger Joints
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200">
              Bistros & Fine Dining
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200">
              Multi-Branch Kitchens
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200">
              Hotel Lounges
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. INTERACTIVE 3-TAB PRODUCT WALKTHROUGH                  */}
      {/* ========================================================= */}
      <section id="product-showcase" className="py-16 lg:py-24 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header */}
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              PRODUCT WALKTHROUGH
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#111315] tracking-tight">
              Three surfaces,{" "}
              <span className="font-serif italic font-normal text-amber-700">
                one operating rhythm.
              </span>
            </h2>
            <p className="text-sm text-stone-600">
              Test each surface exactly as your customers, kitchen staff, and floor managers see them:
            </p>
          </div>

          {/* Segmented Tab Bar */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-stone-200/80 border border-stone-300 gap-1 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setProductTab("menu")}
                className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  productTab === "menu"
                    ? "bg-white text-stone-900 shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                1. Guest Menu
              </button>
              <button
                onClick={() => setProductTab("kds")}
                className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  productTab === "kds"
                    ? "bg-white text-stone-900 shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <ChefHat className="w-4 h-4 text-amber-600" />
                2. Kitchen KDS
              </button>
              <button
                onClick={() => setProductTab("floor")}
                className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  productTab === "floor"
                    ? "bg-white text-stone-900 shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Layers className="w-4 h-4 text-blue-600" />
                3. Floor & Analytics
              </button>
            </div>
          </div>

          {/* Framed Walkthrough Container */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-stone-200 bg-white shadow-xs p-6 sm:p-8 min-h-[460px]">
            {/* TAB 1: GUEST MENU */}
            {productTab === "menu" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                <div className="md:col-span-5 space-y-4 text-left">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Surface 01 • Customer Mobile Menu
                  </span>
                  <h3 className="text-2xl font-bold font-display text-stone-900">
                    Scan, Customize, Order
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Zero app installation. Customers point their standard iPhone or Android camera at
                    the tabletop acrylic stand. The full catalog loads instantly in 0.4 seconds.
                  </p>

                  {/* Brand Theme Selector */}
                  <div className="space-y-1.5 pt-2">
                    <p className="text-xs font-bold text-stone-700">Preview Brand Themes:</p>
                    <div className="flex gap-2">
                      {[
                        { id: "espresso", label: "Espresso", bg: "#111315" },
                        { id: "emerald", label: "Emerald", bg: "#059669" },
                        { id: "crimson", label: "Crimson", bg: "#9F1239" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setGuestTheme(t.id as "espresso" | "emerald" | "crimson")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                            guestTheme === t.id
                              ? "bg-stone-900 text-white border-black font-bold"
                              : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.bg }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-stone-500 space-y-1">
                    <p className="font-semibold text-stone-800">Key Customer Features:</p>
                    <p>• Smart upsell modal (+18% higher checkout checks)</p>
                    <p>• Live estimated wait time indicator based on queue</p>
                    <p>• Multi-currency automatic symbol rendering</p>
                  </div>
                </div>

                {/* Mobile Preview Frame */}
                <div className="md:col-span-7 flex justify-center">
                  <div
                    className={`w-full max-w-[300px] rounded-2xl border-4 border-stone-900 shadow-md p-4 transition-colors duration-200 ${
                      guestTheme === "espresso"
                        ? "bg-[#111315] text-white"
                        : guestTheme === "emerald"
                        ? "bg-[#04281e] text-white"
                        : "bg-[#270710] text-white"
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                      <div>
                        <p className="font-display font-bold text-xs text-white">The Spice Kitchen</p>
                        <p className="text-[10px] text-stone-400">Table 04 • Dine-In</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        ~14m wait
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs">Smoky Truffle Burger</p>
                          <p className="text-[10px] text-emerald-400 font-bold">$16.50</p>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">1x</span>
                      </div>

                      {/* Upsell Prompt inside Mockup */}
                      <button
                        onClick={() => setGuestUpsellAdded(!guestUpsellAdded)}
                        className={`w-full p-2 rounded-xl text-left text-xs border transition cursor-pointer flex items-center justify-between ${
                          guestUpsellAdded
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "bg-white/5 border-dashed border-white/20 text-stone-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-[11px]">
                          {guestUpsellAdded ? "✓ Added Berry Lemonade" : "+ Add Berry Lemonade"}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">+$4.50</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-stone-400">Total Due</span>
                      <span className="font-bold text-white">
                        ${guestUpsellAdded ? "21.00" : "16.50"}
                      </span>
                    </div>

                    <button
                      onClick={() => setProductTab("kds")}
                      className="w-full mt-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Send to Kitchen KDS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KITCHEN DISPLAY SYSTEM */}
            {productTab === "kds" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900">
                      Kitchen Display System (KDS)
                    </h3>
                    <p className="text-xs text-stone-500">
                      Tap dish checkboxes to mark prep progress. Tap ticket footers to advance status.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition cursor-pointer flex items-center gap-1"
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
                      <span className="text-[11px]">{soundEnabled ? "Audio ON" : "Muted"}</span>
                    </button>

                    <button
                      onClick={() => setShowThermalPreview(!showThermalPreview)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="text-[11px]">80mm KOT</span>
                    </button>

                    <button
                      onClick={handleSimulateNewOrder}
                      className="px-3.5 py-1.5 rounded-lg bg-[#111315] text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulate Order</span>
                    </button>
                  </div>
                </div>

                {ticketAlert && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
                    <span>{ticketAlert}</span>
                    <span className="text-[10px] text-emerald-700 font-mono">Real-Time Sync</span>
                  </div>
                )}

                {/* Optional Thermal KOT Preview */}
                {showThermalPreview && (
                  <div className="p-4 bg-stone-900 text-stone-200 rounded-xl border border-stone-800 font-mono text-xs max-w-xs mx-auto space-y-1.5">
                    <div className="text-center border-b border-dashed border-stone-700 pb-1.5">
                      <p className="font-bold text-white">*** KITCHEN ORDER TICKET ***</p>
                      <p className="text-[10px] text-stone-400">TABLE 04 • GUEST DINE-IN</p>
                      <p className="text-[10px] text-emerald-400">#1042 • 20:14:02</p>
                    </div>
                    <p className="text-[11px] text-white">1x SMOKY TRUFFLE BURGER</p>
                    <p className="text-[10px] text-stone-400 italic"> * MEDIUM RARE</p>
                    <p className="text-[11px] text-white">1x GARLIC TRUFFLE FRIES</p>
                    <div className="border-t border-dashed border-stone-700 pt-1 flex justify-between font-bold text-emerald-400 text-xs">
                      <span>TOTAL:</span>
                      <span>$23.00</span>
                    </div>
                  </div>
                )}

                {/* KDS Ticket Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {kdsTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3.5 rounded-xl bg-[#111315] text-white border border-stone-800 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-xs">
                          <span className="font-mono font-bold">
                            #{ticket.orderNumber} • <span className="text-amber-400">{ticket.table}</span>
                          </span>
                          <span className="font-mono text-[10px] text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimer(ticket.elapsedSeconds)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {ticket.items.map((it) => (
                            <div
                              key={it.id}
                              onClick={() => handleToggleItemPrepared(ticket.id, it.id)}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                                it.isPrepared
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-stone-400 line-through"
                                  : "bg-stone-900 border-stone-800 text-stone-200"
                              }`}
                            >
                              <span className="truncate">
                                {it.qty}x {it.name}
                              </span>
                              <Check className={`w-3 h-3 ${it.isPrepared ? "text-emerald-400" : "text-stone-600"}`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdvanceTicketStatus(ticket.id)}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                          ticket.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : ticket.status === "PREPARING"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ticket.status} • ADVANCE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: FLOOR & EXECUTIVE ANALYTICS */}
            {productTab === "floor" && (
              <div className="space-y-6 animate-in fade-in duration-200 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900">
                      Live Table Floor & Split-Check Hub
                    </h3>
                    <p className="text-xs text-stone-500">
                      Click tables to inspect guest tabs and calculate equal bill splits:
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-stone-600">
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

                {/* 6-Table Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {floorTables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedFloorTable(t.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedFloorTable === t.id
                          ? "bg-stone-900 text-white border-black shadow-xs"
                          : "bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{t.name}</span>
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
                      <div className="text-[10px] opacity-75 mt-2">
                        <p>{t.guests > 0 ? `${t.guests} Diners` : "Empty"}</p>
                        <p className="font-extrabold">{t.tabTotal > 0 ? `$${t.tabTotal.toFixed(2)}` : "$0.00"}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Split Bill Calculator & Executive Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                  <div className="md:col-span-5 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-900">Table 0{selectedFloorTable} Split Bill</span>
                      <span className="font-mono font-bold text-stone-900">${activeTabTotal.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-stone-600">
                        <span>Divide equally by:</span>
                        <span className="font-bold text-emerald-700">{splitGuests} Diners</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[2, 3, 4, 5].map((count) => (
                          <button
                            key={count}
                            onClick={() => setSplitGuests(count)}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              splitGuests === count
                                ? "bg-[#111315] text-white"
                                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                      <span className="text-xs text-stone-500">Each Diner Owes:</span>
                      <span className="font-display font-extrabold text-base text-emerald-700">
                        ${(activeTabTotal / splitGuests).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Today&apos;s Revenue</p>
                      <p className="text-xl font-bold font-display text-stone-900">$3,420</p>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> +24% vs last week
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Avg Table Turn</p>
                      <p className="text-xl font-bold font-display text-stone-900">34 mins</p>
                      <span className="text-[10px] text-blue-600 font-semibold">↓ 16m faster</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Satisfaction</p>
                      <p className="text-xl font-bold font-display text-amber-600">4.9 ★</p>
                      <span className="text-[10px] text-stone-500">148 verified ratings</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. HIGH-CONTRAST DARK SECTION ("BUILT FOR FRIDAY NIGHT")   */}
      {/* ========================================================= */}
      <section id="friday-rush" className="py-16 lg:py-24 bg-[#111315] text-white border-y border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              FRIDAY NIGHT RESILIENCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              Engineered for the 8:00 PM Dinner Rush
            </h2>
            <p className="text-sm text-stone-400">
              When dining rooms hit capacity and cooks are under pressure, Dineeze keeps every station
              moving in synchronization.
            </p>
          </div>

          {/* 3-Column Clean Architectural Layout with Sharp Dividers */}
          <div className="rounded-2xl border border-white/10 divide-y lg:divide-y-0 lg:divide-x divide-white/10 grid grid-cols-1 lg:grid-cols-3 bg-white/[0.02]">
            {/* Feature 1: 80mm Thermal KOT */}
            <div className="p-6 sm:p-8 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Printer className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                80mm Thermal KOT Printing
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Connects directly to your existing Epson or Star Micronics thermal slip printers via
                standard ESC/POS protocols. Crisp kitchen order slips print with dish modifier notes.
              </p>
              <div className="p-3 bg-black/40 rounded-lg border border-white/10 font-mono text-[10px] text-stone-300 space-y-0.5">
                <p className="text-emerald-400 font-bold">KOT #1042 • TABLE 04 • 20:14:02</p>
                <p>1x SMOKY TRUFFLE BURGER (MED-RARE)</p>
                <p>1x GARLIC TRUFFLE FRIES</p>
              </div>
            </div>

            {/* Feature 2: Staff Roles & Audit Logs */}
            <div className="p-6 sm:p-8 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                Staff RBAC & Audit Trails
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Assign distinct 4-digit PINs for Managers, Kitchen Cooks, and Waiters. Every ticket
                transition, payment settlement, or cancellation is logged with an immutable actor stamp.
              </p>
              <div className="p-3 bg-black/40 rounded-lg border border-white/10 font-mono text-[10px] text-stone-300 space-y-0.5">
                <p className="text-stone-400">[20:14:18] Order #1041 Settled by Carlos (Waiter)</p>
                <p className="text-stone-400">[20:14:32] Dish Prepared by Chef Marco (Kitchen)</p>
              </div>
            </div>

            {/* Feature 3: Multi-Branch Menu Cloning */}
            <div className="p-6 sm:p-8 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Store className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                1-Click Multi-Branch Cloning
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Opening another location? Clone your full category hierarchy, pricing, and item modifiers
                into a new branch in a single database transaction with complete tenant isolation.
              </p>
              <div className="p-3 bg-black/40 rounded-lg border border-white/10 text-xs text-stone-300 flex items-center justify-between">
                <span>Downtown Flagship</span>
                <span className="text-[10px] text-emerald-400 font-bold">➔ Terminal 2 Airport</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. PHYSICAL CRAFT: TABLE-TENT QR STAND                    */}
      {/* ========================================================= */}
      <section className="py-16 lg:py-24 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              PHYSICAL MEETS DIGITAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#111315] tracking-tight">
              Your brand,{" "}
              <span className="font-serif italic font-normal text-amber-700">
                on every table.
              </span>
            </h2>
            <p className="text-sm text-stone-600">
              Generate print-ready vector PDF table tents configured for standard acrylic stands:
            </p>
          </div>

          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5 text-center">
            {/* The Acrylic Stand Render */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded bg-[#111315] text-white flex items-center justify-center">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="font-display font-bold text-sm text-[#111315]">The Spice Kitchen</span>
              </div>

              {/* Vector QR Code */}
              <div className="p-3 bg-white rounded-xl shadow-xs border border-stone-200 inline-block">
                <QRCodeSVG
                  value="https://dineeze.vercel.app/m/table-1-spice-kitchen"
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-0.5">
                <p className="font-display font-black text-xs text-stone-900 uppercase tracking-wider">
                  TABLE 04 • SCAN TO ORDER
                </p>
                <p className="text-[10px] text-stone-500">Camera scan • No app required</p>
              </div>

              <p className="text-[10px] text-stone-400 pt-1 border-t border-stone-200">
                Guest Wi-Fi: SpiceGuest • Pass: dine2026
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold px-2">
              <span>Vector 300 DPI Export</span>
              <Link
                to="/m/table-1-spice-kitchen"
                className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-bold"
              >
                Test QR Link <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. INTERACTIVE ROI ESTIMATOR & TRANSPARENT PRICING        */}
      {/* ========================================================= */}
      <section id="roi-section" className="py-16 lg:py-24 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              SAVINGS & REVENUE UPLIFT
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#111315] tracking-tight">
              Calculate your restaurant ROI
            </h2>
            <p className="text-sm text-stone-600">
              See how much your dining room saves each month by eliminating paper reprints and waiter bottlenecks:
            </p>
          </div>

          {/* Single-Card Interactive Calculator */}
          <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label htmlFor="roi-table-slider" className="font-display font-bold text-sm text-stone-900">
                  Number of Dining Tables: {roiTables} Tables
                </label>
                <p className="text-xs text-stone-500">Drag to adjust your restaurant capacity</p>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 text-xs font-semibold self-start sm:self-auto">
                {(["USD", "PKR", "INR", "GBP"] as SupportedCurrency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setRoiCurrency(c)}
                    className={`px-2 py-1 rounded transition cursor-pointer ${
                      roiCurrency === c ? "bg-[#111315] text-white font-bold" : "text-stone-600 hover:text-black"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <input
              id="roi-table-slider"
              type="range"
              min="5"
              max="60"
              value={roiTables}
              onChange={(e) => setRoiTables(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-[#111315]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-200 text-left">
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-0.5">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Annual Paper Savings</p>
                <p className="text-xl font-bold font-display text-stone-900">
                  {CURRENCIES[roiCurrency].symbol}
                  {annualPrintSavings.toLocaleString()}
                </p>
                <p className="text-[10px] text-stone-500">Zero laminated menu reprints</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-0.5">
                <p className="text-[10px] font-bold text-stone-400 uppercase">+18% Upsell Lift</p>
                <p className="text-xl font-bold font-display text-emerald-700">
                  +{CURRENCIES[roiCurrency].symbol}
                  {monthlyAovLift.toLocaleString()}/mo
                </p>
                <p className="text-[10px] text-stone-500">From automated cart suggestions</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-0.5">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Faster Table Turns</p>
                <p className="text-xl font-bold font-display text-amber-700">-18 mins</p>
                <p className="text-[10px] text-stone-500">Average turn reduction per table</p>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Section */}
          <div id="pricing-section" className="space-y-8 pt-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#111315]">
                Direct, transparent SaaS tiers
              </h3>
              <p className="text-xs text-stone-500">
                No per-order percentage deductions. No hardware leasing contracts.
              </p>

              {/* Monthly / Annual Toggle */}
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

            {/* 2-Tier Pricing Cards */}
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
      {/* 8. CLOSING CTA BANNER & STRUCTURED FOOTER                 */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#111315] text-white p-8 sm:p-12 text-center space-y-5 border border-stone-800">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              Ready to turn every table faster?
            </h2>
            <p className="text-stone-400 text-sm max-w-xl mx-auto">
              Launch your contactless menu in under 2 minutes. Free setup with zero proprietary hardware leases.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-white text-stone-900 hover:bg-stone-100 transition text-sm flex items-center justify-center gap-1.5"
              >
                Create Free Restaurant Account
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

      {/* ARCHITECTURAL FOOTER */}
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
                Contactless table ordering, digital QR menus, and real-time kitchen display systems.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Product</p>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => scrollToSection("product-showcase")} className="hover:text-black">
                    Mobile Guest Menu
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setProductTab("kds");
                      scrollToSection("product-showcase");
                    }}
                    className="hover:text-black"
                  >
                    Kitchen Display (KDS)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setProductTab("floor");
                      scrollToSection("product-showcase");
                    }}
                    className="hover:text-black"
                  >
                    Live Floor Status & POS
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("pricing-section")} className="hover:text-black">
                    Pricing & Free Plan
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Operations & Portals */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Portals</p>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/staff-login" className="hover:text-black">
                    Staff Portal Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-black">
                    Owner Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-black">
                    Register New Restaurant
                  </Link>
                </li>
                <li>
                  <Link to="/m/table-1-spice-kitchen" className="hover:text-black">
                    Customer Menu Demo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Architecture */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Architecture</p>
              <ul className="space-y-1 text-stone-500">
                <li>Strict Tenant restaurantId Isolation</li>
                <li>Neon Serverless PostgreSQL Lakebase</li>
                <li>Persistent Socket.io Room Sockets</li>
                <li className="pt-2 font-semibold text-stone-700">Built by SovYCode</li>
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
