import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Flame,
  Leaf,
  Upload,
  X,
  Check,
  Loader2,
  Search,
  Clock,
  BookOpen,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";
import { formatCurrency } from "../../utils/currency";

interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  dishes: Dish[];
}

interface Dish {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  preparationTime?: number;
}

export const MenuBuilderPage: React.FC = () => {
  const { activeRestaurant } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "SPICY" | "AVAILABLE">("ALL");

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Dish Slide-Over Drawer State
  const [dishDrawerOpen, setDishDrawerOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishCategory, setDishCategory] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishDesc, setDishDesc] = useState("");
  const [dishImage, setDishImage] = useState("");
  const [dishVeg, setDishVeg] = useState(false);
  const [dishSpicy, setDishSpicy] = useState(false);
  const [dishPrepTime, setDishPrepTime] = useState("15");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingDish, setSubmittingDish] = useState(false);

  const fetchMenu = async () => {
    if (!activeRestaurant) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/menu/categories?restaurantId=${activeRestaurant.id}`);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [activeRestaurant?.id]);

  // Fast In-Stock / Sold-Out Toggle
  const toggleAvailability = async (dishId: string, currentStatus: boolean) => {
    try {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          dishes: cat.dishes.map((d) =>
            d.id === dishId ? { ...d, isAvailable: !currentStatus } : d
          ),
        }))
      );

      await api.patch(`/api/menu/items/${dishId}/availability`, {
        isAvailable: !currentStatus,
      });
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      fetchMenu();
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurant || !catName.trim()) return;

    try {
      await api.post("/api/menu/categories", {
        restaurantId: activeRestaurant.id,
        name: catName.trim(),
        description: catDesc.trim(),
        sortOrder: categories.length + 1,
      });
      setCatName("");
      setCatDesc("");
      setCatModalOpen(false);
      fetchMenu();
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category and all its items?")) return;
    try {
      await api.delete(`/api/menu/categories/${catId}`);
      fetchMenu();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  // Image Upload to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", `dineeze/${activeRestaurant?.slug || "general"}`);

    try {
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDishImage(res.data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
      const reader = new FileReader();
      reader.onloadend = () => setDishImage(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddDish = (catId?: string) => {
    setEditingDish(null);
    setDishName("");
    setDishCategory(catId || (categories.length > 0 ? categories[0].id : ""));
    setDishPrice("");
    setDishDesc("");
    setDishImage("");
    setDishVeg(false);
    setDishSpicy(false);
    setDishPrepTime("15");
    setDishDrawerOpen(true);
  };

  const openEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishCategory(dish.categoryId);
    setDishPrice(String(dish.price));
    setDishDesc(dish.description || "");
    setDishImage(dish.imageUrl || "");
    setDishVeg(dish.isVegetarian);
    setDishSpicy(dish.isSpicy);
    setDishPrepTime(String(dish.preparationTime || 15));
    setDishDrawerOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurant || !dishName || !dishPrice || !dishCategory) return;

    setSubmittingDish(true);
    try {
      const payload = {
        restaurantId: activeRestaurant.id,
        categoryId: dishCategory,
        name: dishName.trim(),
        price: parseFloat(dishPrice),
        description: dishDesc.trim(),
        imageUrl: dishImage,
        isVegetarian: dishVeg,
        isSpicy: dishSpicy,
        preparationTime: parseInt(dishPrepTime) || 15,
      };

      if (editingDish) {
        await api.put(`/api/menu/items/${editingDish.id}`, payload);
      } else {
        await api.post("/api/menu/items", payload);
      }

      setDishDrawerOpen(false);
      fetchMenu();
    } catch (err) {
      console.error("Save dish failed:", err);
    } finally {
      setSubmittingDish(false);
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm("Are you sure you want to remove this dish?")) return;
    try {
      await api.delete(`/api/menu/items/${dishId}`);
      fetchMenu();
    } catch (err) {
      console.error("Failed to delete dish:", err);
    }
  };

  // Compute total dish counts
  const totalDishes = categories.reduce((sum, c) => sum + (c.dishes?.length || 0), 0);

  // Filter categories and dishes
  const displayedCategories = categories
    .filter((cat) => selectedCategoryTab === "ALL" || cat.id === selectedCategoryTab)
    .map((cat) => {
      const filteredDishes = (cat.dishes || []).filter((dish) => {
        const matchesSearch =
          searchQuery.trim() === "" ||
          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDietary =
          dietaryFilter === "ALL" ||
          (dietaryFilter === "VEG" && dish.isVegetarian) ||
          (dietaryFilter === "SPICY" && dish.isSpicy) ||
          (dietaryFilter === "AVAILABLE" && dish.isAvailable);

        return matchesSearch && matchesDietary;
      });

      return { ...cat, dishes: filteredDishes };
    })
    .filter((cat) => cat.dishes.length > 0 || selectedCategoryTab === cat.id);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-950">
              Menu Builder & Catalog
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {totalDishes} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Curate categories, configure item modifiers, and toggle instant in-stock availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCatModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
          <button
            onClick={() => openAddDish()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Dish
          </button>
        </div>
      </div>

      {/* Filter & Category Bar */}
      <div className="space-y-3">
        {/* Category Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategoryTab === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Categories ({totalDishes})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({cat.dishes?.length || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar & Dietary Filter Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name or ingredients..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Quick Dietary Filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setDietaryFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                dietaryFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter("VEG")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                dietaryFilter === "VEG" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-500" /> Veg Only
            </button>
            <button
              onClick={() => setDietaryFilter("SPICY")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                dietaryFilter === "SPICY" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Flame className="w-3 h-3 text-red-500" /> Spicy
            </button>
            <button
              onClick={() => setDietaryFilter("AVAILABLE")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                dietaryFilter === "AVAILABLE" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              In Stock Only
            </button>
          </div>
        </div>
      </div>

      {/* Categories & Dishes Grid */}
      <div className="space-y-8">
        {displayedCategories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            {/* Category Subheader */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <span>{cat.name}</span>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    ({cat.dishes.length} items)
                  </span>
                </h3>
                {cat.description && (
                  <p className="text-xs text-slate-500">{cat.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddDish(cat.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dish Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.dishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition flex flex-col justify-between ${
                    dish.isAvailable
                      ? "border-slate-200/90 hover:border-slate-300"
                      : "border-slate-200/60 bg-slate-50/50 opacity-75"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">
                            {dish.name}
                          </h4>
                          {dish.isVegetarian && (
                            <span title="Vegetarian">
                              <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </span>
                          )}
                          {dish.isSpicy && (
                            <span title="Spicy">
                              <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        {dish.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="font-display font-extrabold text-sm text-slate-900">
                            {formatCurrency(dish.price, activeRestaurant?.currency)}
                          </span>
                          {dish.preparationTime && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {dish.preparationTime}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cloudinary Dish Image */}
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: In-Stock Toggle & Actions */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    {/* Fast In-Stock / Sold Out Toggle */}
                    <button
                      onClick={() => toggleAvailability(dish.id, dish.isAvailable)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        dish.isAvailable
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                      title="Click to toggle availability"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dish.isAvailable ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <span>{dish.isAvailable ? "In Stock" : "Sold Out"}</span>
                    </button>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDish(dish)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        title="Edit dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDish(dish.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cat.dishes.length === 0 && (
              <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                No items in this category yet. Click &quot;Add Item&quot; to create one.
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && !loading && (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-display font-bold text-base text-slate-900">Your Menu is Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by creating your first category (e.g. Starters, Main Courses, Drinks) and adding dishes.
            </p>
            <button
              onClick={() => setCatModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
            >
              + Create Category
            </button>
          </div>
        )}
      </div>

      {/* Right-Side Slide-Over Drawer for Dish Create & Edit */}
      {dishDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop blur */}
          <div
            onClick={() => setDishDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-950">
                  {editingDish ? "Edit Dish" : "Add New Dish"}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure dish specifications, image, and modifiers.
                </p>
              </div>
              <button
                onClick={() => setDishDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleSaveDish} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Smoky Truffle Burger"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price ({activeRestaurant?.currency || "USD"}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder={activeRestaurant?.currency === "PKR" ? "1250" : activeRestaurant?.currency === "INR" ? "450" : "16.50"}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  placeholder="Ingredients, preparation details, allergens..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Cloudinary Image Uploader */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dish Photography
                </label>
                <div className="flex items-center gap-3">
                  {dishImage ? (
                    <img
                      src={dishImage}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          <span>Streaming to CDN...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload Image</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Streamed directly to Cloudinary CDN (JPG, PNG, WebP).
                    </p>
                  </div>
                </div>
              </div>

              {/* Prep time & Dietary checks */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dishPrepTime}
                    onChange={(e) => setDishPrepTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={dishVeg}
                      onChange={(e) => setDishVeg(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Vegetarian
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={dishSpicy}
                      onChange={(e) => setDishSpicy(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <Flame className="w-3.5 h-3.5 text-red-500" /> Spicy
                  </label>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDishDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDish}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingDish ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {editingDish ? "Update Dish" : "Create Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setCatModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-950">
                New Menu Category
              </h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Artisanal Pizzas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Hand-stretched 48-hour fermented crust..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuBuilderPage;
