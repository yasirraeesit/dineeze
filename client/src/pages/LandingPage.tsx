import React, { useState, useCallback } from "react";
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
  Palette,
  Wifi,
  ExternalLink,
  Plus,
  Menu as MenuIcon,
  X,
  Star,
  Check,
  CheckCheck,
  Flame,
  Printer,
  Store,
  Coffee,
  Beer,
  Award,
} from "lucide-react";

// Web Audio synthesizer for the authentic Kitchen Display System chime
const playKitchenChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First high note (bell strike)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second harmonic tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1320, now + 0.08); // E6
    gain2.gain.setValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch {
    // Audio playback policy silent fallback
  }
};

interface KDSSimulatedTicket {
  id: string;
  orderNumber: string;
  table: string;
  items: string[];
  status: "PENDING" | "PREPARING" | "READY";
  timeAgo: string;
}

export const LandingPage: React.FC = () => {
  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Simulator Interactive State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cartCount, setCartCount] = useState(1);
  const [cartTotal, setCartTotal] = useState(16.5);
  const [lastAddedAlert, setLastAddedAlert] = useState<string | null>(null);

  const [kdsTickets, setKdsTickets] = useState<KDSSimulatedTicket[]>([
    {
      id: "ticket-1",
      orderNumber: "1041",
      table: "Table 02",
      items: ["1x Crispy Truffle Fries", "1x Craft Berry Lemonade"],
      status: "PREPARING",
      timeAgo: "2m ago",
    },
    {
      id: "ticket-2",
      orderNumber: "1040",
      table: "Table 07",
      items: ["2x Artisan Margherita Pizza"],
      status: "READY",
      timeAgo: "5m ago",
    },
  ]);

  // Bento Box Interactive States
  const [bentoThemeColor, setBentoThemeColor] = useState("#10B981");
  const [isWagyuInStock, setIsWagyuInStock] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<"flagship" | "rooftop" | "cafe">("flagship");

  // Pricing Billing Toggle
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

  // Smooth scroll handler
  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Add Item in Hero Simulator
  const handleAddHeroItem = (name: string, price: number) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => parseFloat((prev + price).toFixed(2)));

    if (soundEnabled) {
      playKitchenChime();
    }

    const newTicketNum = Math.floor(1043 + Math.random() * 50).toString();
    const newTicket: KDSSimulatedTicket = {
      id: `ticket-${Date.now()}`,
      orderNumber: newTicketNum,
      table: "Table 04",
      items: [`1x ${name} (Kitchen note: Table 04)`],
      status: "PENDING",
      timeAgo: "Just now",
    };

    setKdsTickets((prev) => [newTicket, ...prev.slice(0, 3)]);
    setLastAddedAlert(`Order #${newTicketNum} beamed to Kitchen KDS!`);

    setTimeout(() => {
      setLastAddedAlert(null);
    }, 3200);
  };

  // Advance ticket status in Hero Simulator
  const handleAdvanceStatus = (ticketId: string) => {
    setKdsTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const nextStatus = t.status === "PENDING" ? "PREPARING" : t.status === "PREPARING" ? "READY" : "PENDING";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. STICKY GLASSMORPHIC NAVBAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/85 border-b border-slate-200/80 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-slate-950">
                Dineeze
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-[11px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                v2.4
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("demo")}
              className="hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Live Demo
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Features
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
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1.5 group"
            >
              Launch Your Menu Free
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left font-semibold text-slate-800 hover:text-emerald-600 py-1"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("demo")}
                className="text-left font-semibold text-slate-800 hover:text-emerald-600 py-1 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" /> Live Interactive Demo
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-left font-semibold text-slate-800 hover:text-emerald-600 py-1"
              >
                Features & Bento Grid
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left font-semibold text-slate-800 hover:text-emerald-600 py-1"
              >
                Pricing Plans
              </button>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-50 border border-slate-200"
              >
                Sign In to Kitchen Dashboard
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-3 rounded-xl font-bold bg-slate-900 text-white shadow-sm flex items-center justify-center gap-2"
              >
                Launch Your Menu Free <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. SPLIT HERO WITH INTERACTIVE PHONE-TO-KDS SIMULATOR */}
      <section
        id="demo"
        className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(255,255,255,0))]"
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Sharp Copy & Conversions */}
            <div className="lg:col-span-6 space-y-7 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">
                  Contactless OS
                </span>
                <span className="text-slate-400">•</span>
                <span>Self-Ordering Reimagined</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display text-slate-950 tracking-tight leading-[1.08]">
                Turn Every Table Into a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500">
                  Self-Ordering
                </span>{" "}
                Experience.
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
                Zero app downloads. Zero hardware costs. Customers scan, order, and track food live on their own phones,
                while your kitchen receives instant real-time Kanban tickets.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link
                  to="/register"
                  className="px-7 py-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 group text-sm sm:text-base"
                >
                  Start Free in 2 Minutes
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => handleAddHeroItem("Smoky Truffle Burger", 16.5)}
                  className="px-6 py-4 rounded-xl font-semibold bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs transition flex items-center justify-center gap-2 text-sm sm:text-base group"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 group-hover:rotate-12 transition-transform" />
                  Try Interactive Demo Below
                </button>
              </div>

              {/* Trust Strip */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Works on any smartphone
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    $0 hardware required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Setup in 120 seconds
                  </span>
                </div>
              </div>

              {/* Social proof mini bar */}
              <div className="flex items-center gap-3 pt-1">
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
                      alt="Restaurant Owner"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs"
                    />
                  ))}
                </div>
                <div className="text-xs">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                    <span className="font-bold text-slate-800 ml-1.5">4.9/5</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Trusted by 400+ dine-in restaurants</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Phone-to-KDS Simulator */}
            <div className="lg:col-span-6 relative">
              {/* Floating Alert Pill when order beams */}
              {lastAddedAlert && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {lastAddedAlert}
                </div>
              )}

              {/* Sound Effect Toggle Floating Bar */}
              <div className="flex items-center justify-between pb-3 px-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Interactive Simulator (Click + Add)
                </span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition"
                  title="Toggle kitchen chime sound"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> Sound Chime ON
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" /> Sound Muted
                    </>
                  )}
                </button>
              </div>

              {/* Simulator Stage: Mobile Phone + Docked KDS Screen */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* 1. Mobile Phone Menu Mockup (Col 1-7) */}
                <div className="md:col-span-7 bg-white rounded-[2rem] border-4 border-slate-800 shadow-2xl p-3.5 relative overflow-hidden ring-1 ring-slate-900/10">
                  {/* Speaker and Camera slit */}
                  <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-950/80 mr-3" />
                    <div className="w-8 h-1 bg-slate-800 rounded-full" />
                  </div>

                  {/* Mobile Screen Header */}
                  <div className="border-b border-slate-100 pb-2.5 mb-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="font-display font-bold text-xs text-slate-900">
                          The Spice Kitchen
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400">Artisan Dining & Fusion</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Table 04
                    </span>
                  </div>

                  {/* Dish 1: Smoky Truffle Burger (Main Interactive Item) */}
                  <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition space-y-2 mb-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-slate-900">
                            Smoky Truffle Burger
                          </span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Popular
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Aged black angus beef, black truffle aioli, melted gruyère on brioche.
                        </p>
                        <p className="font-bold text-xs text-emerald-600 pt-0.5">$16.50</p>
                      </div>
                      <img
                        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=160&q=80"
                        alt="Smoky Truffle Burger"
                        className="w-16 h-16 rounded-lg object-cover shadow-xs border border-slate-200 flex-shrink-0"
                      />
                    </div>
                    <button
                      onClick={() => handleAddHeroItem("Smoky Truffle Burger", 16.5)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Order ($16.50)
                    </button>
                  </div>

                  {/* Dish 2: Crispy Parmesan Fries */}
                  <div className="p-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-2 mb-3">
                    <div className="space-y-0.5">
                      <p className="font-display font-bold text-[11px] text-slate-900">
                        Crispy Parmesan Fries
                      </p>
                      <p className="text-[10px] text-slate-400">Rosemary, pecorino romano</p>
                      <p className="font-bold text-[11px] text-slate-700">$6.50</p>
                    </div>
                    <button
                      onClick={() => handleAddHeroItem("Crispy Parmesan Fries", 6.5)}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[11px] font-bold border border-slate-200 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>

                  {/* Sticky Bottom Cart Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400">Cart Total</p>
                      <p className="text-xs font-extrabold text-slate-900">
                        ${cartTotal.toFixed(2)}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({cartCount} items)
                        </span>
                      </p>
                    </div>
                    <Link
                      to="/m/table-1-spice-kitchen"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition flex items-center gap-1"
                    >
                      View Live Menu <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>

                {/* 2. Mini Kitchen Display System (KDS) (Col 8-12) */}
                <div className="md:col-span-5 bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-emerald-400" />
                      <span className="font-display font-bold text-xs text-white">
                        Kitchen KDS
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE SYNC
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Tickets pop up instantly via WebSockets. Click a ticket badge to change prep status:
                  </p>

                  {/* Simulated Tickets Stream */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
                    {kdsTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-1.5 shadow-sm transition hover:border-slate-600"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">
                            Order #{ticket.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ticket.timeAgo}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-400">
                          {ticket.table}
                        </div>
                        <ul className="text-[10px] text-slate-300 space-y-0.5">
                          {ticket.items.map((item, idx) => (
                            <li key={idx} className="truncate">
                              • {item}
                            </li>
                          ))}
                        </ul>
                        {/* Interactive Status Button */}
                        <button
                          onClick={() => handleAdvanceStatus(ticket.id)}
                          className={`w-full mt-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                            ticket.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                              : ticket.status === "PREPARING"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {ticket.status} (Tap to change)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THREE-STEP VISUAL WORKFLOW (01 Print -> 02 Scan & Order -> 03 Kitchen Sync) */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        <div className="text-center space-y-3 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-950 tracking-tight">
            From Tabletop Scan to Hot Food in 15 Seconds
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            No waiter bottlenecks, no handwritten scribbles, and zero paper menus to reprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Print Table QR */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black font-display text-emerald-600">01</span>
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <QrCode className="w-5 h-5" />
              </span>
            </div>

            {/* Realistic Table-Tent Mockup Card */}
            <div className="p-5 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border border-slate-200 shadow-inner text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-xl shadow-md border border-slate-200">
                <QRCodeSVG
                  value="https://dineeze.vercel.app/m/table-1-spice-kitchen"
                  size={100}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="space-y-0.5">
                <p className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Table 04 • The Spice Kitchen
                </p>
                <p className="text-[10px] text-slate-500">Scan camera to order & pay</p>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
                <Wifi className="w-3 h-3 text-slate-400" />
                <span>Guest Wi-Fi: DineGuest / dine2026</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Print Table QR in 1-Click
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate sharp PDF table-tents and acrylic stand cards tailored with your restaurant logo, colors, and individual table tokens.
              </p>
            </div>
          </div>

          {/* Step 2: Guests Scan & Order */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black font-display text-emerald-600">02</span>
              <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Smartphone className="w-5 h-5" />
              </span>
            </div>

            {/* Realistic Mobile Cart Drawer Preview */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-inner space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                <span className="font-mono text-slate-400">Safari • dineeze.com/m/...</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  0.4s Fast
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>1x Butter Chicken Deluxe</span>
                  <span>$18.50</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Note: Medium spice, extra garlic naan
                </p>
                <div className="flex justify-between text-slate-300 text-[11px] pt-1">
                  <span>1x Mango Lassi</span>
                  <span>$4.50</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-emerald-400">
                <span>Total Due</span>
                <span>$23.00</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Guests Scan & Self-Order
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No 80MB app downloads or accounts. Customers customize modifiers, add chef notes, and hit place order right from their mobile browser.
              </p>
            </div>
          </div>

          {/* Step 3: Live Kitchen Sync */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black font-display text-emerald-600">03</span>
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <ChefHat className="w-5 h-5" />
              </span>
            </div>

            {/* Realistic KDS Ticket Timer Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-inner space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  Prep Time: 04:12
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                  Pending
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-white">Table 04 • 2 Dishes</p>
                <p className="text-[11px] text-slate-300">• 1x Smoky Truffle Burger</p>
                <p className="text-[11px] text-slate-300">• 1x Crispy Truffle Fries</p>
              </div>
              <div className="pt-1 flex gap-2">
                <span className="w-full text-center py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Start Cooking
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Live Kitchen KDS Sync
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kitchen staff hears an instant audio chime as tickets land on the display. One tap transitions orders between Pending, Preparing, and Served.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BENTO FEATURE GRID (Asymmetric 2x3 Layout) */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        <div className="text-center space-y-3 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-950 tracking-tight">
            Engineered for High-Velocity Dining Rooms
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Every feature is crafted to increase average check sizes, shorten table turn times, and eliminate order friction.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card A (Span 2 cols on lg): Real-Time Socket.io KDS */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Ultra Low-Latency WebSockets
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                  Real-Time Socket.io Kitchen Display
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md">
                  Zero polling, zero manual refreshing. New orders appear instantly with audible kitchen bell cues.
                </p>
              </div>
              <button
                onClick={playKitchenChime}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Volume2 className="w-4 h-4" /> Test Chime Sound
              </button>
            </div>

            {/* Kanban Columns Visualizer */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 pb-1 border-b border-slate-700">
                  <span>Pending</span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded">3</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 text-[10px] space-y-0.5 border border-slate-800">
                  <p className="font-bold text-white">#1044 • Table 01</p>
                  <p className="text-slate-400">2x Butter Naan</p>
                </div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-400 pb-1 border-b border-slate-700">
                  <span>Preparing</span>
                  <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.2 rounded">2</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 text-[10px] space-y-0.5 border border-slate-800">
                  <p className="font-bold text-white">#1043 • Table 05</p>
                  <p className="text-slate-400">1x Tandoori Platter</p>
                </div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pb-1 border-b border-slate-700">
                  <span>Ready</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded">4</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 text-[10px] space-y-0.5 border border-slate-800">
                  <p className="font-bold text-white">#1042 • Table 03</p>
                  <p className="text-slate-400">1x Mango Kulfi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card B (Span 1 col on lg): Interactive Brand Theme Engine */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="inline-flex p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Custom Brand Theme Engine
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Click a swatch below to preview your brand accent color dynamically applied:
              </p>
            </div>

            {/* Clickable Swatches */}
            <div className="flex items-center gap-2.5 pt-1">
              {[
                { name: "Emerald", hex: "#10B981" },
                { name: "Amber", hex: "#F59E0B" },
                { name: "Rose", hex: "#F43F5E" },
                { name: "Indigo", hex: "#6366F1" },
                { name: "Cyan", hex: "#06B6D4" },
              ].map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => setBentoThemeColor(swatch.hex)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    bentoThemeColor === swatch.hex ? "scale-125 ring-2 ring-offset-2 ring-slate-900" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  aria-label={`Select ${swatch.name} theme`}
                />
              ))}
            </div>

            {/* Dynamic Mini Preview Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Sample Item</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: bentoThemeColor }}
                >
                  Featured
                </span>
              </div>
              <button
                className="w-full py-2 rounded-xl text-white text-xs font-bold transition shadow-xs"
                style={{ backgroundColor: bentoThemeColor }}
              >
                Order with Your Brand ($14.00)
              </button>
            </div>
          </div>

          {/* Card C (Span 1 col on lg): 1-Click Sold-Out Sync */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="inline-flex p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                1-Click Sold-Out Sync
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Toggle availability instantly. Guests can never order an out-of-stock dish.
              </p>
            </div>

            {/* Interactive Toggle Showcase */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">8oz Wagyu Ribeye</p>
                  <p className="text-[10px] text-slate-400">Inventory Status</p>
                </div>
                <button
                  onClick={() => setIsWagyuInStock(!isWagyuInStock)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isWagyuInStock
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isWagyuInStock ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {isWagyuInStock ? "In Stock" : "Sold Out"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {isWagyuInStock
                  ? "✓ Dish is active and orderable across all customer tables."
                  : "✕ Menu immediately greys out button on all guest devices."}
              </p>
            </div>
          </div>

          {/* Card D (Span 1 col on lg): Printable Table-Tent QR Generator */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="inline-flex p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Printable QR Table Tents
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Batch export print-ready PDF table cards formatted for standard acrylic stands.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-xs border border-slate-200">
                <QrCode className="w-8 h-8 text-slate-800" />
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-slate-800">Batch Table Export</p>
                <p className="text-[10px] text-slate-500">300 DPI Vector PDF & SVG</p>
                <span className="text-[10px] text-emerald-600 font-bold">1-Click Download</span>
              </div>
            </div>
          </div>

          {/* Card E (Span 1 col on lg): Zero-App Browser Experience */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="inline-flex p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Zero-App Friction
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                100% web-native. Guests scan via iOS Camera or Android Lens with no App Store step.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Instant 0.4s load time</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Zero MB phone storage required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Supports Apple Pay & Card Checkout</span>
              </div>
            </div>
          </div>

          {/* Card F (Span 2 cols on lg): Multi-Branch & Multi-Tenant Ready */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
                  <Store className="w-3.5 h-3.5 text-slate-700" /> Multi-Branch Architecture
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900">
                  Scale from One Location to a Hospitality Chain
                </h3>
              </div>

              {/* Branch Switcher Buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
                <button
                  onClick={() => setSelectedBranch("flagship")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedBranch === "flagship"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Downtown
                </button>
                <button
                  onClick={() => setSelectedBranch("rooftop")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedBranch === "rooftop"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Rooftop
                </button>
                <button
                  onClick={() => setSelectedBranch("cafe")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedBranch === "cafe"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Airport
                </button>
              </div>
            </div>

            {/* Branch Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Dining Capacity</p>
                <p className="text-lg font-bold font-display text-slate-900">
                  {selectedBranch === "flagship" ? "28 Tables" : selectedBranch === "rooftop" ? "18 Tables" : "12 Tables"}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">● 94% Active Floor</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Average Turn Time</p>
                <p className="text-lg font-bold font-display text-slate-900">
                  {selectedBranch === "flagship" ? "34 mins" : selectedBranch === "rooftop" ? "42 mins" : "18 mins"}
                </p>
                <p className="text-[11px] text-blue-600 font-medium">↓ 12 mins faster than paper</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Database Partition</p>
                <p className="text-lg font-bold font-display text-slate-900">Neon Lakebase</p>
                <p className="text-[11px] text-slate-500">Strict restaurantId scoping</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SIMPLE TRANSPARENT PRICING & FINAL HIGH-CONTRAST CONVERSION BANNER */}
      <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-950 tracking-tight">
            Start Free. Upgrade As You Scale.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            No transaction percentage fees, no forced proprietary hardware, and cancel whenever you want.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/90 text-xs font-bold mt-2">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-xl transition ${
                billingPeriod === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                billingPeriod === "annual"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
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
          {/* Starter Plan - Free Forever */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 space-y-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
            <div className="space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                  Starter Tier
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-display text-slate-950">
                    $0
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ forever</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Ideal for food trucks, popups, cafes, and single-room restaurants.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  What&apos;s Included:
                </p>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Up to 10 Dining Tables</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Unlimited Menu Items & Categories</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Real-Time Kitchen KDS with Audio Alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Printable QR Table-Tent PDF Generator</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Mobile Browser Customer Ordering</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Community & Email Support</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 text-center text-sm transition shadow-xs"
            >
              Launch Free Restaurant
            </Link>
          </div>

          {/* Pro Plan - Multi-Branch */}
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
                  <span className="text-4xl sm:text-5xl font-extrabold font-display text-slate-950">
                    {billingPeriod === "annual" ? "$24" : "$29"}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    / month {billingPeriod === "annual" ? "(billed annually)" : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  For high-volume restaurants, multi-room venues, and hospitality groups.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Everything in Starter, plus:
                </p>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-950">Unlimited Tables & Floor Plans</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Custom Brand Logo & Accent Theming Engine</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Multi-Room & Patio Floor Section Routing</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>High-Speed Cloudinary Image CDN Storage</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Centralized Multi-Location Owner Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-950">24/7 Dedicated Kitchen Support</span>
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

        {/* Dark High-Contrast Bottom Conversion Banner */}
        <div className="mt-20 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Emerald background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Instant Zero-Risk Deployment
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
              Ready to Upgrade Your Dining Room Tonight?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Join forward-thinking restaurants boosting table turns by 32% with zero upfront hardware costs.
              Set up your entire menu in under 2 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm sm:text-base shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group"
              >
                Launch Your Menu Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/m/table-1-spice-kitchen"
                className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm sm:text-base transition flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                View Customer Menu Demo
              </Link>
            </div>

            <p className="text-xs text-slate-500 pt-2">
              No credit card required • Instant setup • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* 6. CLEAN MODERN SAAS FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                  Dineeze
                </span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed">
                Contactless table ordering, digital QR menus, and real-time kitchen displays for modern restaurants.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
                Product
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>
                  <button onClick={() => scrollToSection("features")} className="hover:text-emerald-600 transition">
                    Kitchen Display System (KDS)
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("how-it-works")} className="hover:text-emerald-600 transition">
                    Table QR Tent Generator
                  </button>
                </li>
                <li>
                  <Link to="/m/table-1-spice-kitchen" className="hover:text-emerald-600 transition">
                    Mobile Customer Menu Demo
                  </Link>
                </li>
                <li>
                  <button onClick={() => scrollToSection("pricing")} className="hover:text-emerald-600 transition">
                    Pricing & Free Tier
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Hospitality */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
                Hospitality
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400" /> Full-Service Dining
                </li>
                <li className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-slate-400" /> Cafes & Bakeries
                </li>
                <li className="flex items-center gap-1.5">
                  <Beer className="w-3.5 h-3.5 text-slate-400" /> Bars & Breweries
                </li>
                <li className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" /> Hotel Dining & Room Service
                </li>
              </ul>
            </div>

            {/* Col 4: Platform & Security */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>
                  <span className="text-slate-600 font-medium">PostgreSQL Engine:</span> Neon Serverless
                </li>
                <li>
                  <span className="text-slate-600 font-medium">Sockets:</span> Socket.io Low-Latency
                </li>
                <li>
                  <span className="text-slate-600 font-medium">Media Storage:</span> Cloudinary CDN
                </li>
                <li>
                  <span className="text-slate-600 font-medium">Security:</span> Strict Multi-Tenant Scoping
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Dineeze Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-slate-600 transition">
                Owner Login
              </Link>
              <Link to="/register" className="hover:text-slate-600 transition">
                Get Started
              </Link>
              <Link to="/m/table-1-spice-kitchen" className="hover:text-slate-600 transition">
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
