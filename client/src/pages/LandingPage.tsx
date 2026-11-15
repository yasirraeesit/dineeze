import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  ChefHat,
  Store,
  Printer,
  ShieldCheck,
  Menu as MenuIcon,
  X,
  Star,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type SupportedCurrency = "PKR" | "USD" | "INR" | "GBP";

interface PricingPlanData {
  starter: {
    monthly: string;
    annual: string;
  };
  growth: {
    monthly: string;
    annual: string;
  };
  multiBranch: {
    monthly: string;
    annual: string;
  };
}

const PRICING_DATA: Record<SupportedCurrency, PricingPlanData> = {
  PKR: {
    starter: { monthly: "Rs. 0", annual: "Rs. 0" },
    growth: { monthly: "Rs. 6,900", annual: "Rs. 5,500" },
    multiBranch: { monthly: "Rs. 16,900", annual: "Rs. 13,500" },
  },
  USD: {
    starter: { monthly: "$0", annual: "$0" },
    growth: { monthly: "$29", annual: "$23" },
    multiBranch: { monthly: "$79", annual: "$63" },
  },
  INR: {
    starter: { monthly: "₹0", annual: "₹0" },
    growth: { monthly: "₹1,999", annual: "₹1,599" },
    multiBranch: { monthly: "₹4,999", annual: "₹3,999" },
  },
  GBP: {
    starter: { monthly: "£0", annual: "£0" },
    growth: { monthly: "£24", annual: "£19" },
    multiBranch: { monthly: "£65", annual: "£52" },
  },
};

const RESTAURANT_FAQS = [
  {
    q: "Do my guests need to download an app?",
    a: "No app download or account creation is ever required. Guests simply scan your table's acrylic QR stand with their native smartphone camera. The responsive digital menu loads in under 0.2 seconds in any mobile browser (Safari, Chrome) with zero friction.",
  },
  {
    q: "Does it work with our existing thermal kitchen printers?",
    a: "Yes. Dineeze natively supports standard 80mm ESC/POS thermal kitchen printers, wireless Bluetooth printers, and direct browser printing. You can auto-print Kitchen Order Tickets (KOT) as soon as an order is placed, or print on demand from the live KDS and Floor Board.",
  },
  {
    q: "Can different staff members have separate logins?",
    a: "Yes. Dineeze features granular role-based access control (RBAC). General managers have full operational and financial reporting access, kitchen staff operate an audio-enabled live KDS, and floor waiters use rapid 4-digit PINs. Every order change is logged in the immutable Order Audit Log.",
  },
  {
    q: "How fast can we launch?",
    a: "Most single-location restaurants are live within 25 minutes. If you already have a physical or PDF menu, send it over and our onboarding team will digitize your catalog, modifier options, categories, and QR stands within 24 hours at zero cost.",
  },
];

export const LandingPage: React.FC = () => {
  // Mobile drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pricing currency & billing toggle
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("USD");
  const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Smooth scroll
  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#121417] font-sans antialiased overflow-x-hidden selection:bg-amber-100 selection:text-amber-950">
      {/* ========================================================= */}
      {/* 1. MINIMALIST RESPONSIVE NAVBAR (H-16 / 64PX)             */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full h-16 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Left: Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-[#121417] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-[#121417]">
              Dineeze
            </span>
          </Link>

          {/* Center Navigation Links (hidden on mobile/tablet) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <button
              onClick={() => scrollTo("platform")}
              className="hover:text-[#121417] transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              onClick={() => scrollTo("multi-branch")}
              className="hover:text-[#121417] transition-colors cursor-pointer"
            >
              Multi-Branch
            </button>
            <button
              onClick={() => scrollTo("customers")}
              className="hover:text-[#121417] transition-colors cursor-pointer"
            >
              Customers
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="hover:text-[#121417] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <Link
              to="/staff-login"
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
            >
              Staff Portal
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold text-stone-700 hover:text-[#121417] transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#121417] text-white hover:bg-stone-800 shadow-xs transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              Book a Demo / Start Free
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          </div>

          {/* Mobile & Tablet Controls (< 1024px) */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#121417] text-white hover:bg-stone-800 transition whitespace-nowrap shrink-0"
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
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold text-stone-800">
              <button
                onClick={() => scrollTo("platform")}
                className="text-left py-1 hover:text-stone-950"
              >
                Platform
              </button>
              <button
                onClick={() => scrollTo("multi-branch")}
                className="text-left py-1 hover:text-stone-950"
              >
                Multi-Branch & KDS
              </button>
              <button
                onClick={() => scrollTo("customers")}
                className="text-left py-1 hover:text-stone-950"
              >
                Customers & Stories
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="text-left py-1 hover:text-stone-950"
              >
                Pricing Plans
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
                  className="flex-1 text-center py-2 text-xs font-bold bg-[#121417] text-white rounded-lg shadow-xs"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. EDITORIAL SPLIT HERO WITH REAL PHOTOGRAPHY             */}
      {/* ========================================================= */}
      <section className="py-14 sm:py-20 lg:py-28 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Brand Statement & Primary Actions */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold tracking-wide uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  DINEEZE HOSPITALITY OS
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold font-display text-[#121417] tracking-tight leading-[1.08]">
                The modern operating system for{" "}
                <span className="font-serif italic font-normal text-amber-700">
                  busy dining rooms.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                QR table ordering, live kitchen displays, split billing, and multi-branch
                analytics—built for cafés, restaurants, and hospitality groups.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link
                  to="/register"
                  className="px-7 py-3.5 rounded-full font-bold bg-[#121417] hover:bg-stone-800 text-white shadow-xs transition-all flex items-center justify-center gap-2 text-sm sm:text-base group"
                >
                  Start Free in 5 Mins
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/m/table-1-spice-kitchen"
                  className="px-6 py-3.5 rounded-full font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 shadow-xs transition flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  View Live Guest Menu
                </Link>
              </div>

              <div className="pt-4 border-t border-stone-200 text-xs font-medium text-stone-500 flex items-center gap-2">
                <span>No POS hardware lock-in</span>
                <span>•</span>
                <span>Works in PKR, USD, GBP &amp; INR</span>
                <span>•</span>
                <span>Instant camera QR scan</span>
              </div>
            </div>

            {/* Right Column: Real Bustling Restaurant Photography with ONE Understated Status Card */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                  alt="Busy modern dining room"
                  className="w-full aspect-[4/3] object-cover"
                />

                {/* Single Restrained Status Card in Bottom Left */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-stone-200 shadow-md flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-display font-bold text-xs text-stone-900 truncate">
                      Table 08 • Order #204
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      Sent to kitchen • <span className="font-semibold text-emerald-700">Rs. 3,450</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">12s ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. TRUSTED VENUES & TRACTION STRIP                        */}
      {/* ========================================================= */}
      <section className="bg-white border-b border-stone-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-stone-400">
            TRUSTED BY MODERN KITCHENS &amp; CAFÉS ACROSS PAKISTAN, THE UK &amp; UAE
          </p>

          {/* Typographic Venue Brand Wordmarks */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-stone-700 font-display font-extrabold text-sm sm:text-base tracking-widest opacity-80">
            <span>ROAST &amp; RYE</span>
            <span>THE SMASH LAB</span>
            <span>SAFFRON COURTYARD</span>
            <span>KOBALT COFFEE</span>
            <span>URBAN TANDOOR</span>
          </div>

          {/* 3 Crisp Operational Stats */}
          <div className="pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 text-center">
            <div className="py-2 px-4 space-y-0.5">
              <p className="text-3xl font-extrabold font-display text-[#121417]">12 sec</p>
              <p className="text-xs text-stone-500">Average table order placement</p>
            </div>
            <div className="py-2 px-4 space-y-0.5">
              <p className="text-3xl font-extrabold font-display text-emerald-700">+22%</p>
              <p className="text-xs text-stone-500">Higher average check size via upsells</p>
            </div>
            <div className="py-2 px-4 space-y-0.5">
              <p className="text-3xl font-extrabold font-display text-[#121417]">99.9%</p>
              <p className="text-xs text-stone-500">Live kitchen WebSocket uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. ALTERNATING EDITORIAL PRODUCT PILLARS                   */}
      {/* ========================================================= */}
      <div id="platform" className="space-y-0">
        {/* Row 1: Guest Experience */}
        <section className="py-16 sm:py-24 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Photo on Left */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
                    alt="Café table guest experience"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>

              {/* Copy on Right */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  GUEST EXPERIENCE
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#121417] tracking-tight">
                  Zero-app ordering{" "}
                  <span className="font-serif italic font-normal text-amber-700">
                    guests actually love.
                  </span>
                </h2>
                <p className="text-base text-stone-600 leading-relaxed">
                  No App Store downloads. No sign-up walls. Customers scan an acrylic tabletop QR stand,
                  browse rich visual categories, add special chef notes, and checkout in seconds.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Instant Camera Scan</p>
                      <p className="text-xs text-stone-500">
                        Loads in 0.4 seconds on mobile Safari and Chrome with zero storage footprint.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Smart Combo Upsells</p>
                      <p className="text-xs text-stone-500">
                        Intelligent prompts recommend beverage pairings and side orders right before checkout (+22% lift).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">1-Tap Split Bills &amp; Ratings</p>
                      <p className="text-xs text-stone-500">
                        Groups divide checks equally without waiter math, then leave instant 5-star Google ratings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2: Kitchen & Floor Command — Dark #121417 Section */}
        <section className="py-16 sm:py-24 bg-[#121417] text-white border-b border-stone-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Copy on Left */}
              <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                  KITCHEN &amp; FLOOR COMMAND
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
                  A calm kitchen, even on{" "}
                  <span className="font-serif italic font-normal text-amber-400">
                    Friday night.
                  </span>
                </h2>
                <p className="text-base text-stone-300 leading-relaxed">
                  Eliminate scribbled paper tickets and server bottlenecks. Orders beam straight to
                  high-contrast kitchen displays and thermal printers with zero latency.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Real-Time KDS with Elapsed Timers</p>
                      <p className="text-xs text-stone-400">
                        Tickets track live cook duration so line cooks prioritize oldest tables automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Printer className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">80mm Thermal KOT Slip Integration</p>
                      <p className="text-xs text-stone-400">
                        Compatible with standard Epson and Star Micronics receipt printers via ESC/POS.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ChefHat className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Item-Level Prep Checkoffs &amp; Floor Map</p>
                      <p className="text-xs text-stone-400">
                        Strike through individual dishes as they leave the pass; floor staff view live table statuses.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo on Right */}
              <div className="lg:col-span-6 order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=80"
                    alt="Chefs working calm kitchen line"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 3: Multi-Branch & Team Control */}
        <section id="multi-branch" className="py-16 sm:py-24 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Visual Card on Left */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-5 text-left">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-stone-700" />
                      <span className="font-display font-bold text-sm text-stone-900">
                        Location Selector
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Strict Multi-Tenant Isolation
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <div className="p-3 bg-stone-900 text-white rounded-xl text-center space-y-0.5">
                      <p>Gulberg Flagship</p>
                      <p className="text-[10px] text-stone-400 font-normal">28 Tables Active</p>
                    </div>
                    <div className="p-3 bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-center space-y-0.5">
                      <p>F-7 Islamabad</p>
                      <p className="text-[10px] text-stone-400 font-normal">18 Tables Active</p>
                    </div>
                    <div className="p-3 bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-center space-y-0.5">
                      <p>Soho London</p>
                      <p className="text-[10px] text-stone-400 font-normal">12 Tables Active</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Staff PIN Access: Manager, Kitchen, Waiter
                    </span>
                    <span className="font-mono text-stone-400 text-[10px]">Tamper-Proof Logs</span>
                  </div>
                </div>
              </div>

              {/* Copy on Right */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  CHAIN ARCHITECTURE
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#121417] tracking-tight">
                  Scale from one café to a{" "}
                  <span className="font-serif italic font-normal text-amber-700">
                    multi-city group.
                  </span>
                </h2>
                <p className="text-base text-stone-600 leading-relaxed">
                  Expanding to a second location? Clone your full dish catalog, pricing, and modifier
                  trees in a single click while maintaining isolated tables, accounts, and financial reports.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">1-Click Menu Catalog Cloning</p>
                      <p className="text-xs text-stone-500">
                        Launch a new venue in minutes without retyping descriptions or uploading food photography.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Granular Role-Based Permissions (RBAC)</p>
                      <p className="text-xs text-stone-500">
                        Cooks see the KDS line, floor servers handle bill settlement, and managers view sales analytics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Unified Executive Sales Heatmaps</p>
                      <p className="text-xs text-stone-500">
                        Compare peak-hour volume, AOV, and item velocity across all operating branches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* 5. REAL OPERATOR STORIES (3 HOSPITALITY CASE STUDIES)     */}
      {/* ========================================================= */}
      <section id="customers" className="py-16 sm:py-24 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              OPERATOR EVIDENCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#121417] tracking-tight">
              Real results from high-volume dining rooms
            </h2>
            <p className="text-sm text-stone-600">
              Here is what happens when restaurant teams replace paper friction with Dineeze:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Story 1 */}
            <div className="p-6 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  &quot;During weekend brunch, guests scan and order before our baristas even walk over.
                  Our table turn speed jumped immediately with zero order errors.&quot;
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xs text-stone-900">Bilal H.</p>
                  <p className="text-[11px] text-stone-500">Founder, Roast &amp; Rye (Lahore)</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  +19% Table Turns
                </span>
              </div>
            </div>

            {/* Story 2 */}
            <div className="p-6 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  &quot;We used to waste hundreds of pounds reprinting menus when seasonal cuts changed.
                  Now 86-ing an item is instant, and combo upsells increased our burger average check by 22%.&quot;
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xs text-stone-900">Liam K.</p>
                  <p className="text-[11px] text-stone-500">Operations, The Smash Lab (UK)</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Saved $450/mo
                </span>
              </div>
            </div>

            {/* Story 3 */}
            <div className="p-6 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  &quot;Splitting bills used to tie up our servers for 10 minutes per table. With Dineeze,
                  guests split directly on their phones. It shaved 14 minutes off end-of-meal waiting.&quot;
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xs text-stone-900">Tariq M.</p>
                  <p className="text-[11px] text-stone-500">GM, Saffron Courtyard (Dubai)</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  -14m Bill Wait
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FLAGSHIP B2B PRICING & RESTAURANT FAQ                   */}
      {/* ========================================================= */}
      <section id="pricing" className="py-20 sm:py-28 border-b border-stone-200 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header & Controls */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-200/70 border border-stone-300">
              TRANSPARENT SOFTWARE TIERS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-[#121417] tracking-tight">
              Predictable pricing,{" "}
              <span className="font-serif italic font-normal text-amber-600">
                zero take rates.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
              No expensive proprietary terminals. No percentage cuts on food revenue. You keep 100% of your guest checks.
            </p>

            {/* Currency Selector + Billing Period Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {/* Currency Selector */}
              <div className="inline-flex p-1 rounded-xl bg-stone-200/80 border border-stone-300 text-xs font-bold shadow-xs">
                {(["PKR", "USD", "INR", "GBP"] as SupportedCurrency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCurrency(c)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      selectedCurrency === c
                        ? "bg-[#121417] text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Billing Cycle Toggle */}
              <div className="inline-flex p-1 rounded-xl bg-stone-200/80 border border-stone-300 text-xs font-semibold shadow-xs">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    billingPeriod === "monthly"
                      ? "bg-white text-stone-900 shadow-xs font-bold"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    billingPeriod === "annual"
                      ? "bg-[#121417] text-white shadow-xs font-bold"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>Annual</span>
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Tier Linear / Toast High-Contrast Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
            {/* Tier 1: Starter */}
            <div className="p-8 sm:p-9 rounded-3xl border border-stone-200 bg-white space-y-7 flex flex-col justify-between shadow-xs hover:border-stone-300 transition">
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-stone-600 bg-stone-100 border border-stone-200">
                    Starter
                  </span>
                  <p className="text-xs text-stone-500">
                    Ideal for single cafés, kiosks, and pop-up coffee bars
                  </p>
                  <div className="pt-2">
                    <p className="text-4xl sm:text-5xl font-extrabold font-display text-[#121417] tracking-tight">
                      {PRICING_DATA[selectedCurrency].starter[billingPeriod]}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">
                      Free forever • Up to 10 dining tables
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Included capabilities:
                  </p>
                  <ul className="space-y-3 text-xs text-stone-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Up to 10 Dining Tables</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>High-Resolution QR Mobile Guest Menu</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Real-Time Kitchen KDS with Chime Audio</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Basic Order &amp; Table Status Tracking</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant Dish 86-ing (Out-of-Stock Toggle)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Printable Acrylic QR Table-Tent PDF Export</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Multi-Currency Display (PKR, USD, INR, GBP)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  to="/register"
                  className="w-full py-3.5 rounded-full font-bold bg-stone-100 hover:bg-stone-200 text-stone-900 text-center text-xs transition border border-stone-200 block shadow-2xs"
                >
                  Start Free Single Branch
                </Link>
              </div>
            </div>

            {/* Tier 2: Growth (Flagship Obsidian Card) */}
            <div className="p-8 sm:p-9 rounded-3xl border-2 border-stone-800 bg-[#121417] text-white space-y-7 flex flex-col justify-between shadow-2xl relative lg:-translate-y-3 ring-1 ring-white/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#121417] text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                <span>★</span> MOST POPULAR
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/20">
                    Growth Restaurant
                  </span>
                  <p className="text-xs text-stone-400">
                    For full-service bistros, casual dining, and busy bars
                  </p>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
                        {PRICING_DATA[selectedCurrency].growth[billingPeriod]}
                      </p>
                      <span className="text-xs font-normal text-stone-400">
                        / location / mo
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-400 mt-1">
                      {billingPeriod === "annual"
                        ? "Billed annually • Save 20%"
                        : "Billed monthly • Cancel anytime"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
                    Everything in Starter, plus:
                  </p>
                  <ul className="space-y-3 text-xs text-stone-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <strong className="text-white">Unlimited Tables &amp; Multi-Room Floors</strong>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Live Floor Board with Color-Coded Timers</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Split-Bill Settlement &amp; Multi-Guest Pay</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Smart Cart Upsell Engine (+22% Avg Check)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>80mm Thermal Receipt &amp; Kitchen KOT Printing</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Staff Role PIN Access (Manager, Cook, Waiter)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Order Audit Logs &amp; Peak Hour Sales Heatmaps</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Executive Revenue &amp; Category Analytics</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  to="/register"
                  className="w-full py-4 rounded-full font-bold bg-white hover:bg-stone-100 text-stone-950 text-center text-xs transition shadow-lg flex items-center justify-center gap-2 group"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Tier 3: Multi-Branch */}
            <div className="p-8 sm:p-9 rounded-3xl border border-stone-200 bg-white space-y-7 flex flex-col justify-between shadow-xs hover:border-stone-300 transition">
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200">
                    Multi-Branch
                  </span>
                  <p className="text-xs text-stone-500">
                    For hospitality groups, franchises, and multi-unit chains
                  </p>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-4xl sm:text-5xl font-extrabold font-display text-[#121417] tracking-tight">
                        {PRICING_DATA[selectedCurrency].multiBranch[billingPeriod]}
                      </p>
                      <span className="text-xs font-normal text-stone-500">
                        / group / mo
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      {billingPeriod === "annual"
                        ? "Billed annually • Save 20%"
                        : "Billed monthly • Cancel anytime"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Everything in Growth, plus:
                  </p>
                  <ul className="space-y-3 text-xs text-stone-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <strong className="text-stone-900">Unlimited Branches &amp; Outlets</strong>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1-Click Central Menu Catalog Cloning</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cross-Branch Consolidated Executive Analytics</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Centralized Staff Role &amp; Permission Routing</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Custom Tenant Branding &amp; QR Styling</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Dedicated Hospitality Account Manager</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Priority 24/7 Phone &amp; WhatsApp Onboarding</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  to="/register"
                  className="w-full py-3.5 rounded-full font-bold bg-[#121417] hover:bg-stone-800 text-white text-center text-xs transition block shadow-xs"
                >
                  Start Multi-Branch Trial
                </Link>
              </div>
            </div>
          </div>

          {/* Zero-Risk Trust Strip */}
          <div className="max-w-5xl mx-auto rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                  <Smartphone className="w-4 h-4 text-stone-700" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs sm:text-sm text-stone-900">
                    Zero POS Hardware Lock-In
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Runs on existing tablets, phones, and browser. No proprietary terminal leases.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs sm:text-sm text-stone-900">
                    Free 24-Hour Menu Setup
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Send us your physical or PDF menu—our team digitizes and configs your catalog for free.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs sm:text-sm text-stone-900">
                    Cancel or Switch Anytime
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Zero take rates or hidden percentage fees on food revenue. You keep 100% of check sales.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Restaurant FAQ Accordion */}
          <div className="max-w-3xl mx-auto pt-4 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#121417] tracking-tight">
                Everything you need to know
              </h3>
              <p className="text-xs sm:text-sm text-stone-600">
                Common questions from restaurant owners, general managers, and head chefs.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {RESTAURANT_FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-stone-200 bg-white overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display font-bold text-sm sm:text-base text-stone-900">
                        {faq.q}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-stone-600 border border-stone-200">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 bg-stone-50/30">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FLAGSHIP CLOSING BANNER & CORPORATE FOOTER             */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#121417] text-white p-8 sm:p-14 text-center space-y-6 shadow-md">
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight">
              Ready to upgrade your{" "}
              <span className="font-serif italic font-normal text-amber-400">
                dining room?
              </span>
            </h2>
            <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Launch your digital menu in under 5 minutes. No proprietary hardware. Zero long-term contracts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full font-bold bg-white text-stone-900 hover:bg-stone-100 transition text-sm flex items-center justify-center gap-1.5 shadow-sm"
              >
                Start Free in 5 Minutes
                <ArrowRight className="w-4 h-4 text-amber-500" />
              </Link>
              <Link
                to="/m/table-1-spice-kitchen"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition text-sm flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                View Customer Demo Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate 4-Column Footer */}
      <footer className="border-t border-stone-200 bg-white py-14 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-left">
            {/* Col 1: Brand & Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#121417] text-white flex items-center justify-center">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="font-display font-bold text-sm text-[#121417]">Dineeze</span>
              </div>
              <p className="text-stone-500 leading-relaxed">
                The modern operating system for busy dining rooms. QR table self-ordering, real-time KDS, and multi-branch management.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Core Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Product</p>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => scrollTo("platform")} className="hover:text-black">
                    Guest Mobile Menu
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("platform")} className="hover:text-black">
                    Kitchen Display System (KDS)
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("multi-branch")} className="hover:text-black">
                    Floor Map &amp; Split-Check
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("pricing")} className="hover:text-black">
                    Pricing &amp; Free Plan
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Solutions */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Solutions</p>
              <ul className="space-y-1.5">
                <li>Full-Service Bistros &amp; Casual</li>
                <li>Specialty Coffee &amp; Roasteries</li>
                <li>Multi-Location Hospitality Groups</li>
                <li>Cloud Kitchens &amp; Food Halls</li>
              </ul>
            </div>

            {/* Col 4: Resources & Staff Portal */}
            <div className="space-y-2">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Access &amp; Credits
              </p>
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
                    Register New Restaurant
                  </Link>
                </li>
                <li className="pt-2 font-semibold text-stone-700">
                  Dineeze — A SovYCode Product
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
