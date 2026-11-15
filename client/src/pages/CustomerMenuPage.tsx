import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  UtensilsCrossed,
  Search,
  Wifi,
  ShoppingBag,
  Plus,
  Minus,
  Flame,
  Leaf,
  CheckCircle2,
  X,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Loader2,
  Volume2,
  VolumeX,
  Clock,
  Star,
  Sparkles,
} from "lucide-react";
import api from "../utils/api";
import useCartStore from "../stores/cartStore";
import useSocket from "../hooks/useSocket";
import { getContrastTextColor } from "../utils/color";
import { formatCurrency } from "../utils/currency";
import audioChime from "../components/AudioChime";

interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  preparationTime?: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  dishes: Dish[];
}

interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  accentColor: string;
  currency: string;
  logoUrl?: string;
  bannerUrl?: string;
  wifiPassword?: string;
  isActive: boolean;
}

interface TableData {
  id: string;
  tableNumber: number;
  label?: string;
  qrToken: string;
}

export const CustomerMenuPage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();

  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [table, setTable] = useState<TableData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  // Search & Active Category
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");

  // Cart & Drawer State
  const cart = useCartStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kitchenNotes, setKitchenNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Live Order Tracking State
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState<number>(15);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem("dineeze_guest_muted") === "true";
  });

  // Smart Cart Upsells
  const [upsells, setUpsells] = useState<any[]>([]);
  const [, setLoadingUpsells] = useState(false);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("dineeze_guest_muted", String(next));
      return next;
    });
  };

  // Socket for Live Order Tracking
  const socket = useSocket(placedOrder ? "order" : undefined, placedOrder?.id);

  // Initialize cart with qrToken
  useEffect(() => {
    if (qrToken) {
      cart.initCart(qrToken);
    }
  }, [qrToken]);

  // Fetch Smart Cart Upsell Recommendations whenever cart items change
  useEffect(() => {
    if (!qrToken || cart.items.length === 0) {
      setUpsells([]);
      return;
    }

    const fetchUpsells = async () => {
      try {
        setLoadingUpsells(true);
        const itemIds = cart.items.map((i) => i.dishId).join(",");
        const res = await api.get(`/api/menu/${qrToken}/upsells?itemIds=${itemIds}`);
        if (res.data?.upsells) {
          const cartDishIds = new Set(cart.items.map((i) => i.dishId));
          setUpsells(res.data.upsells.filter((u: any) => !cartDishIds.has(u.id)));
        }
      } catch (err) {
        console.warn("Could not load smart upsells:", err);
      } finally {
        setLoadingUpsells(false);
      }
    };

    fetchUpsells();
  }, [qrToken, cart.items.length, drawerOpen]);

  // Fetch Public Menu & Table data
  useEffect(() => {
    const fetchMenu = async () => {
      if (!qrToken) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/menu/${qrToken}`);
        setRestaurant(res.data.restaurant);
        setTable(res.data.table);
        setCategories(res.data.categories || []);
        if (res.data.estimatedWaitMinutes) {
          setEstimatedWaitMinutes(res.data.estimatedWaitMinutes);
        }
      } catch (err: any) {
        setError({
          message:
            err.response?.data?.error ||
            "Unable to load menu. The table QR code may be invalid or inactive.",
          code: err.response?.data?.code || "ERROR",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [qrToken]);

  // Listen for real-time status updates on placed order
  useEffect(() => {
    if (!socket || !placedOrder) return;

    const handleOrderUpdate = (updated: any) => {
      if (updated.id === placedOrder.id) {
        // Trigger Guest Ready Chime & Vibration alert when status changes to READY
        if (updated.status === "READY" && placedOrder.status !== "READY") {
          if (!isMuted) {
            audioChime.playOrderReadyChime();
          }
          if ("vibrate" in navigator) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch (e) {
              console.warn("Vibration failed:", e);
            }
          }
        }
        setPlacedOrder(updated);
      }
    };

    socket.on("order_status_updated", handleOrderUpdate);
    return () => {
      socket.off("order_status_updated", handleOrderUpdate);
    };
  }, [socket, placedOrder?.id, placedOrder?.status, isMuted]);

  const handleCopyWifi = () => {
    if (restaurant?.wifiPassword) {
      navigator.clipboard.writeText(restaurant.wifiPassword);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!placedOrder) return;
    setSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await api.post(`/api/orders/${placedOrder.id}/feedback`, {
        rating: ratingScore,
        feedbackComment: feedbackComment.trim() || undefined,
      });
      setPlacedOrder(res.data.order);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      setFeedbackError(err.response?.data?.error || "Could not submit rating. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0 || !qrToken) return;

    setPlacingOrder(true);
    try {
      const payload = {
        qrToken,
        items: cart.items.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || undefined,
        })),
        customerName: customerName.trim() || undefined,
        notes: kitchenNotes.trim() || undefined,
      };

      const res = await api.post("/api/orders", payload);
      setPlacedOrder(res.data.order);
      cart.clearCart();
      setDrawerOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit order. Please check with staff.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const accent = restaurant?.accentColor || "#10B981";
  const contrast = getContrastTextColor(accent);

  // Error View
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            {error.code === "TABLE_NOT_FOUND" ? "Table Not Found" : "Menu Unavailable"}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error.message}</p>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Please ask your server for a physical menu or a new QR code.
          </p>
        </div>
      </div>
    );
  }

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="text-xs text-slate-500 font-sans">Loading digital dining menu...</p>
        </div>
      </div>
    );
  }

  // Filter Dishes by search and active category
  const filteredCategories = categories
    .map((cat) => {
      const dishes = cat.dishes.filter((d) => {
        const matchesSearch =
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      });
      return { ...cat, dishes };
    })
    .filter((cat) => {
      if (activeCategoryId !== "all" && cat.id !== activeCategoryId) return false;
      return cat.dishes.length > 0;
    });

  return (
    <div
      className="min-h-screen bg-canvas font-sans selection:bg-accent/20"
      style={
        {
          "--tenant-accent": accent,
          "--tenant-contrast": contrast,
        } as React.CSSProperties
      }
    >
      {/* Mobile Frame Container: max-w-md mx-auto */}
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative pb-28 border-x border-slate-200/60">
        {/* Cover Banner */}
        <div
          className="h-36 bg-cover bg-center relative"
          style={{
            backgroundImage: restaurant?.bannerUrl ? `url(${restaurant.bannerUrl})` : undefined,
            backgroundColor: accent,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Table Badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold font-display text-slate-900 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
            <span>{table?.label || `Table ${table?.tableNumber}`}</span>
          </div>
        </div>

        {/* Restaurant Header */}
        <div className="px-5 pt-3 pb-4 relative">
          <div className="flex items-end justify-between -mt-10 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg border border-slate-100 overflow-hidden shrink-0">
              {restaurant?.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div
                  className="w-full h-full rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: accent, color: contrast }}
                >
                  <UtensilsCrossed className="w-7 h-7" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200/60">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>~{estimatedWaitMinutes || 15}m prep</span>
              </div>

              {restaurant?.wifiPassword && (
                <button
                  onClick={handleCopyWifi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition shadow-sm"
                >
                  <Wifi className="w-3.5 h-3.5 text-slate-500" />
                  <span>Wi-Fi: {restaurant.wifiPassword}</span>
                  {copiedWifi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold font-display text-slate-900 leading-tight">
            {restaurant?.name}
          </h1>
          {restaurant?.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {restaurant.description}
            </p>
          )}

          {/* Instant Search Bar */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, or ingredients..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sticky Horizontal Category Tabs */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-y border-slate-100 px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar shadow-xs">
          <button
            onClick={() => setActiveCategoryId("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeCategoryId === "all"
                ? "shadow-sm font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            style={
              activeCategoryId === "all"
                ? { backgroundColor: accent, color: contrast }
                : undefined
            }
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeCategoryId === cat.id
                  ? "shadow-sm font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={
                activeCategoryId === cat.id
                  ? { backgroundColor: accent, color: contrast }
                  : undefined
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="p-4 space-y-6">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <h2 className="font-display font-bold text-sm text-slate-900 flex items-center justify-between pb-1 border-b border-slate-100">
                <span>{cat.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {cat.dishes.length} dishes
                </span>
              </h2>

              <div className="space-y-3">
                {cat.dishes.map((dish) => {
                  const cartItem = cart.items.find((i) => i.dishId === dish.id);
                  const isSoldOut = !dish.isAvailable;

                  return (
                    <div
                      key={dish.id}
                      className={`p-3.5 rounded-2xl border flex gap-3.5 items-start transition ${
                        isSoldOut
                          ? "bg-slate-50/70 border-slate-200 opacity-60"
                          : "bg-white border-slate-200/80 shadow-xs"
                      }`}
                    >
                      {/* Dish Photo */}
                      <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 relative">
                        {dish.imageUrl ? (
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className={`w-full h-full object-cover ${isSoldOut ? "grayscale" : ""}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <UtensilsCrossed className="w-6 h-6" />
                          </div>
                        )}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white bg-rose-600 px-1.5 py-0.5 rounded">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info & Add Action */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-display font-bold text-sm text-slate-900 leading-snug truncate">
                              {dish.name}
                            </h3>
                            <span className="font-bold text-xs text-slate-900 shrink-0">
                              {formatCurrency(dish.price, restaurant?.currency)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                            {dish.description}
                          </p>

                          {/* Dietary Badges */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {dish.isVegetarian && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800">
                                <Leaf className="w-2.5 h-2.5 text-emerald-600" /> Veg
                              </span>
                            )}
                            {dish.isSpicy && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-50 text-rose-800">
                                <Flame className="w-2.5 h-2.5 text-rose-600" /> Spicy
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cart Stepper Action */}
                        <div className="flex justify-end pt-1">
                          {isSoldOut ? (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Unavailable
                            </span>
                          ) : cartItem ? (
                            <div className="inline-flex items-center gap-2 bg-slate-100 rounded-xl p-1 shadow-xs border border-slate-200">
                              <button
                                onClick={() => cart.updateQuantity(dish.id, cartItem.quantity - 1)}
                                className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-xs hover:bg-slate-50"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold text-slate-900 min-w-4 text-center">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => cart.updateQuantity(dish.id, cartItem.quantity + 1)}
                                className="w-6 h-6 rounded-lg text-white flex items-center justify-center shadow-xs"
                                style={{ backgroundColor: accent, color: contrast }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => cart.addItem(dish)}
                              className="px-3 py-1 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1 active:scale-95"
                              style={{ backgroundColor: accent, color: contrast }}
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No matching items found.
            </div>
          )}
        </div>

        {/* Floating Bottom Cart Bar */}
        {cart.getTotalCount() > 0 && (
          <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-30 pointer-events-none">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between pointer-events-auto transition active:scale-98 animate-in fade-in slide-in-from-bottom-3"
              style={{ backgroundColor: accent, color: contrast }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-black/15 flex items-center justify-center font-extrabold text-xs">
                  {cart.getTotalCount()}
                </div>
                <span className="font-bold text-sm">View Cart</span>
              </div>
              <div className="flex items-center gap-1 font-extrabold text-sm">
                <span>{formatCurrency(cart.getTotalAmount(), restaurant?.currency)}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Slide-Up Checkout Drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl max-w-md mx-auto w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-accent" />
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Your Order ({table?.label || `Table ${table?.tableNumber}`})
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.dishId} className="pt-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {formatCurrency(item.price, restaurant?.currency)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-2 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => cart.updateQuantity(item.dishId, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold min-w-3 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => cart.updateQuantity(item.dishId, item.quantity + 1)}
                          className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-xs text-slate-900 min-w-14 text-right">
                        {formatCurrency(item.price * item.quantity, restaurant?.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Smart Cart Upsell Carousel: "Pairs Well With Your Order" */}
              {upsells.length > 0 && (
                <div className="pt-3 pb-1 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pairs Well With Your Order</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Frequently ordered together</span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x">
                    {upsells.map((dish) => (
                      <div
                        key={dish.id}
                        className="min-w-[170px] max-w-[190px] shrink-0 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between snap-start transition hover:border-slate-300"
                      >
                        <div className="flex items-start gap-2">
                          {dish.imageUrl ? (
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 text-xs font-bold">
                              🍽️
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] text-slate-900 truncate leading-tight">
                              {dish.name}
                            </p>
                            <p className="text-[11px] font-mono font-bold text-emerald-600 mt-0.5">
                              {formatCurrency(dish.price, restaurant?.currency)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            cart.addItem({
                              id: dish.id,
                              name: dish.name,
                              price: Number(dish.price),
                              imageUrl: dish.imageUrl || undefined,
                            });
                          }}
                          className="mt-2 w-full py-1.5 px-2 rounded-xl text-[11px] font-bold text-white transition flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                          style={{ backgroundColor: accent }}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Order</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Name & Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kitchen Instructions (Optional)
                  </label>
                  <textarea
                    value={kitchenNotes}
                    onChange={(e) => setKitchenNotes(e.target.value)}
                    placeholder="Allergies, extra napkins, dress sauce on the side..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Subtotal & Confirmation */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Estimated Kitchen Time</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-accent" /> ~{estimatedWaitMinutes || 15} mins
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.getTotalAmount(), restaurant?.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Due</span>
                  <span className="text-base text-accent">{formatCurrency(cart.getTotalAmount(), restaurant?.currency)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: accent, color: contrast }}
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting to Kitchen...
                    </>
                  ) : (
                    <>
                      Place Dine-in Order • {formatCurrency(cart.getTotalAmount(), restaurant?.currency)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Live Order Tracker Modal */}
        {placedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="text-center space-y-1">
                {placedOrder.status === "CANCELLED" ? (
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto mb-2">
                    <AlertCircle className="w-6 h-6" />
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-accent mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </span>
                )}
                <h3 className="font-display font-extrabold text-lg text-slate-900">
                  {placedOrder.status === "CANCELLED" ? "Order Cancelled" : "Order Placed!"}
                </h3>
                <p className="text-xs text-slate-500 font-mono font-bold">
                  {placedOrder.orderNumber} • {table?.label || `Table ${table?.tableNumber}`}
                </p>

                {/* Live Estimated Wait Time Badge */}
                {placedOrder.status !== "CANCELLED" && placedOrder.status !== "SERVED" && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>
                        Est. Kitchen Wait: ~{placedOrder.estimatedWaitMinutes || estimatedWaitMinutes} mins
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* CANCELLED STATUS HANDLING */}
              {placedOrder.status === "CANCELLED" ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-center">
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs uppercase tracking-wider text-rose-900">
                      Cancellation Reason
                    </p>
                    <p className="text-xs font-semibold text-rose-800 bg-white/80 py-1 px-3 rounded-lg border border-rose-200 inline-block">
                      "{placedOrder.cancelReason || "Cancelled by kitchen staff"}"
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                      We apologize for the inconvenience. Your table has not been charged.
                    </p>
                  </div>
                  <button
                    onClick={() => setPlacedOrder(null)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
                  >
                    Order Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Order Ready • Serving Shortly Alert Banner */}
                  {placedOrder.status === "READY" && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-3 shadow-xs animate-pulse">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <div>
                          <p className="font-extrabold text-xs text-emerald-950 leading-tight">
                            Order Ready • Serving Shortly
                          </p>
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            Fresh from the kitchen pass and heading to your table!
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                        Ready
                      </span>
                    </div>
                  )}

                  {/* Mute Pill & Sync Indicator */}
                  <div className="flex items-center justify-between px-0.5">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                        isMuted
                          ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      }`}
                      title="Toggle audio alert on status update"
                    >
                      {isMuted ? (
                        <VolumeX className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{isMuted ? "Chime Muted" : "Chime & Vibration Active"}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
                    </span>
                  </div>

                  {/* Visual Order Progress Timeline */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="space-y-3">
                      {[
                        { key: "PENDING", label: "Order Received", desc: "Sent to kitchen display" },
                        { key: "PREPARING", label: "Preparing in Kitchen", desc: "Chef is cooking your meal" },
                        { key: "READY", label: "Ready / On the Way", desc: "Plated and heading to your table" },
                        { key: "SERVED", label: "Served", desc: "Enjoy your dining experience!" },
                      ].map((step, idx) => {
                        const statusOrder = ["PENDING", "PREPARING", "READY", "SERVED"];
                        const currentIdx = statusOrder.indexOf(placedOrder.status);
                        const stepIdx = statusOrder.indexOf(step.key);
                        const isDone = currentIdx >= stepIdx;
                        const isCurrent = currentIdx === stepIdx;

                        return (
                          <div key={step.key} className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                isDone
                                  ? "bg-accent text-white"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <div>
                              <p
                                className={`text-xs font-bold leading-tight ${
                                  isCurrent ? "text-accent" : isDone ? "text-slate-800" : "text-slate-400"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="text-[10px] text-slate-400">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Post-Meal Guest Rating & Feedback Card */}
                  {(placedOrder.status === "READY" || placedOrder.status === "SERVED") && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      {placedOrder.rating ? (
                        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-center space-y-1">
                          <p className="text-xs font-bold text-amber-900">Thank you for your review! ⭐</p>
                          <div className="flex items-center justify-center gap-1 text-amber-500 py-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= placedOrder.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          {placedOrder.feedbackComment && (
                            <p className="text-[11px] text-amber-800 italic">
                              "{placedOrder.feedbackComment}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <div className="text-center space-y-0.5">
                            <p className="text-xs font-bold text-slate-900">Rate Your Experience</p>
                            <p className="text-[10px] text-slate-500">
                              How was your food and service today?
                            </p>
                          </div>

                          {feedbackError && (
                            <p className="text-[11px] text-rose-600 text-center font-medium">
                              {feedbackError}
                            </p>
                          )}

                          <div className="flex items-center justify-center gap-1.5 py-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingScore(star)}
                                className="p-1 hover:scale-115 transition cursor-pointer text-amber-400"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= ratingScore
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="Optional note for the chef..."
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-accent"
                          />

                          <button
                            type="button"
                            onClick={handleSubmitFeedback}
                            disabled={submittingFeedback}
                            className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            {submittingFeedback ? "Submitting..." : "Submit Rating"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={() => setPlacedOrder(null)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Order More Food
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMenuPage;
