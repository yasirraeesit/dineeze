import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Flame,
  Leaf,
  Upload,
  X,
  Check,
  Loader2,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";

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
  const [, setLoading] = useState(true);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Dish Modal State
  const [dishModalOpen, setDishModalOpen] = useState(false);
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
      // Optimistic update
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
      // Revert on error
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
      // Fallback preview
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
    setDishModalOpen(true);
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
    setDishModalOpen(true);
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

      setDishModalOpen(false);
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900">
            Menu Builder & Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize categories, upload dish imagery, and manage real-time item availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCatModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
          <button
            onClick={() => openAddDish()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Dish
          </button>
        </div>
      </div>

      {/* Categories & Dishes List */}
      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  {cat.name}
                  <span className="text-xs font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {cat.dishes.length} items
                  </span>
                </h2>
                {cat.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddDish(cat.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-accent" /> Add Item
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.dishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`border rounded-2xl p-4 flex gap-3.5 items-start relative transition ${
                    dish.isAvailable
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50/70 opacity-60"
                  }`}
                >
                  {/* Dish Image */}
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-display font-bold text-sm text-slate-900 truncate">
                        {dish.name}
                      </h3>
                      <span className="font-bold text-sm text-slate-900 shrink-0">
                        ${Number(dish.price).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {dish.description || "No description provided."}
                    </p>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {dish.isVegetarian && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <Leaf className="w-3 h-3 text-emerald-600" /> Veg
                        </span>
                      )}
                      {dish.isSpicy && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                          <Flame className="w-3 h-3 text-rose-600" /> Spicy
                        </span>
                      )}
                    </div>

                    {/* Quick Controls */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      {/* In-Stock / Sold-Out Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dish.isAvailable}
                          onChange={() => toggleAvailability(dish.id, dish.isAvailable)}
                          className="sr-only"
                        />
                        <div
                          className={`w-7 h-4 flex items-center rounded-full p-0.5 transition ${
                            dish.isAvailable ? "bg-accent" : "bg-slate-300"
                          }`}
                        >
                          <div
                            className={`bg-white w-3 h-3 rounded-full shadow-md transform transition ${
                              dish.isAvailable ? "translate-x-3" : "translate-x-0"
                            }`}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {dish.isAvailable ? "In Stock" : "Sold Out"}
                        </span>
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditDish(dish)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="Edit dish"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          title="Delete dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {cat.dishes.length === 0 && (
                <div className="col-span-full p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  No dishes in this category yet. Click "Add Item" above.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD/EDIT CATEGORY MODAL */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">Add Category</h3>
              <button onClick={() => setCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Starters, Main Course, Cocktails"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief summary for guests"
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-accent text-white rounded-xl hover:bg-accent-hover shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT DISH MODAL */}
      {dishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                {editingDish ? "Edit Dish" : "Add New Dish"}
              </h3>
              <button onClick={() => setDishModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDish} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="Crispy Samosa Chaat"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="12.50"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={dishCategory}
                  onChange={(e) => setDishCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  placeholder="Ingredients, flavors, and allergens..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Photo</label>
                <div className="flex items-center gap-3">
                  {dishImage ? (
                    <img src={dishImage} alt="Dish" className="w-14 h-14 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImage ? "Uploading to Cloudinary..." : "Choose Image"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={dishVeg}
                    onChange={(e) => setDishVeg(e.target.checked)}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={dishSpicy}
                    onChange={(e) => setDishSpicy(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold text-slate-700">Spicy</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDishModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDish || !dishName || !dishPrice}
                  className="px-6 py-2.5 text-xs font-bold bg-accent text-white rounded-xl hover:bg-accent-hover shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingDish ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Dish
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
