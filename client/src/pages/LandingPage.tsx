import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  QrCode,
  ChefHat,
  Smartphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Zap,
  ShieldCheck,
  Clock,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="min-h-screen bg-canvas text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              Dineeze
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-hover shadow-sm transition flex items-center gap-1.5"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> Next-Generation Restaurant Tech
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold font-display text-slate-900 tracking-tight leading-tight">
          Dining Made <span className="text-accent underline decoration-accent/30">Effortless.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
          Empower guests to order directly from their table with branded QR menus. Receive orders instantly on a live kitchen display system without paper tickets or waiter delays.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold bg-accent text-white hover:bg-accent-hover shadow-md transition flex items-center justify-center gap-2"
          >
            Launch Your Restaurant in 2 Mins <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/m/table-1-spice-kitchen"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-slate-500" /> View Customer Demo Menu
          </Link>
        </div>
      </section>

      {/* Interactive 3-Step Preview */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-900">
              How Dineeze Works
            </h2>
            <p className="text-sm text-slate-500">
              Interactive 3-step contactless workflow from tabletop scan to hot food.
            </p>
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: 1, title: "1. Scan QR Poster", desc: "Guest points camera at table tent", icon: QrCode },
              { step: 2, title: "2. Mobile Ordering", desc: "No app download needed", icon: Smartphone },
              { step: 3, title: "3. Live Kitchen KDS", desc: "Order pops up with audio chime", icon: ChefHat },
            ].map((s) => (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-4 rounded-2xl text-left border transition flex items-start gap-3.5 ${
                  activeStep === s.step
                    ? "border-accent bg-emerald-50/50 ring-2 ring-accent/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    activeStep === s.step ? "bg-accent text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Interactive Screen Preview */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white min-h-[300px] flex items-center justify-center">
            {activeStep === 1 && (
              <div className="text-center space-y-4 max-w-md">
                <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                  <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                    <QrCode className="w-20 h-20 text-slate-800" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-display text-white">Table 04 • High-Res Printable Tent</h3>
                <p className="text-xs text-slate-400">
                  Custom-branded table tents with your restaurant logo, table number, and guest Wi-Fi details generated in one click.
                </p>
              </div>
            )}
            {activeStep === 2 && (
              <div className="text-center space-y-4 max-w-md">
                <div className="bg-slate-50 text-slate-900 p-4 rounded-2xl shadow-xl max-w-xs mx-auto text-left border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold font-display text-slate-800">The Spice Kitchen</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Table 01</span>
                  </div>
                  <div className="py-2 space-y-1.5">
                    <div className="text-xs font-medium flex justify-between">
                      <span>Butter Chicken Deluxe</span>
                      <span className="font-bold text-accent">$18.50</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Note: Medium spicy, extra naan</div>
                  </div>
                  <button className="w-full mt-2 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-sm">
                    Place Order ($18.50)
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Customers customize items, add kitchen notes, and track real-time prep status on their own phone.
                </p>
              </div>
            )}
            {activeStep === 3 && (
              <div className="text-center space-y-4 max-w-md">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 max-w-sm mx-auto text-left">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Order #1042
                    </span>
                    <span className="text-slate-400 text-[10px]">2m ago</span>
                  </div>
                  <div className="py-2 text-xs space-y-1">
                    <div className="font-bold text-white">Table 03 • 2 items</div>
                    <div className="text-slate-300 text-[11px]">• 1x Crispy Samosa Chaat</div>
                    <div className="text-slate-300 text-[11px]">• 1x Mango Lassi</div>
                  </div>
                  <button className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                    Start Preparing
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Kitchen staff receives audio chime alerts and transitions orders between Pending, Preparing, and Served in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-900">
            Engineered for Modern Hospitality
          </h2>
          <p className="text-sm text-slate-500">
            Everything your restaurant needs to boost table turns and reduce order errors.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-accent flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold font-display text-lg text-slate-900">Zero Waiter Bottlenecks</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Customers scan and place orders instantly upon sitting. No waiting for physical menus or waving down busy staff.
            </p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold font-display text-lg text-slate-900">Higher Average Check Size</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vivid food photography, easy modifier selections, and effortless beverage re-ordering consistently increase bill totals.
            </p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold font-display text-lg text-slate-900">Bulletproof Multi-Tenant Security</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Database isolation per restaurant, server-side price validation, and encrypted tokens guarantee strict security.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Free Tier Highlights */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-display">Simple, Transparent Pricing</h2>
            <p className="text-sm text-slate-400">Start free today. Scale as your restaurant grows.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-8 rounded-3xl bg-slate-800 border border-slate-700 space-y-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-accent">Starter Free Tier</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold font-display">$0</span>
                  <span className="text-xs text-slate-400">/ forever</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Perfect for popups, food trucks, and cafes.</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Up to 10 Dining Tables</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Unlimited Menu Items & Categories</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Real-time KDS with Audio Chimes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Printable QR Table Tent Generator</li>
              </ul>
              <Link
                to="/register"
                className="block text-center w-full py-3 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 transition text-xs"
              >
                Create Free Restaurant
              </Link>
            </div>
            <div className="p-8 rounded-3xl bg-slate-800 border-2 border-accent relative space-y-6 shadow-2xl">
              <span className="absolute top-4 right-4 bg-accent text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                Most Popular
              </span>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-accent">Pro Restaurant</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold font-display">$29</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">For busy dine-in venues and full-service restaurants.</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Unlimited Tables & Multi-Room Support</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Custom Branding & Color Theming</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Cloudinary High-Res Media Storage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Priority 24/7 Kitchen Support</li>
              </ul>
              <Link
                to="/register"
                className="block text-center w-full py-3 rounded-xl font-bold bg-accent text-white hover:bg-accent-hover transition text-xs shadow-md"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Dineeze Inc. All rights reserved. • Built with precision & modern engineering.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

