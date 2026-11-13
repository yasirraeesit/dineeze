import { create } from "zustand";

export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  specialInstructions?: string;
}

interface CartState {
  qrToken: string | null;
  items: CartItem[];
  initCart: (qrToken: string) => void;
  addItem: (dish: { id: string; name: string; price: number; imageUrl?: string }, specialInstructions?: string) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => {
  return {
    qrToken: null,
    items: [],

    initCart: (token: string) => {
      const savedKey = `dineeze_cart_${token}`;
      const saved = localStorage.getItem(savedKey);
      set({
        qrToken: token,
        items: saved ? JSON.parse(saved) : [],
      });
    },

    addItem: (dish, specialInstructions = "") => {
      const state = get();
      const existingIndex = state.items.findIndex((item) => item.dishId === dish.id);

      let newItems: CartItem[];
      if (existingIndex > -1) {
        newItems = [...state.items];
        newItems[existingIndex].quantity += 1;
        if (specialInstructions) {
          newItems[existingIndex].specialInstructions = specialInstructions;
        }
      } else {
        newItems = [
          ...state.items,
          {
            dishId: dish.id,
            name: dish.name,
            price: Number(dish.price),
            imageUrl: dish.imageUrl,
            quantity: 1,
            specialInstructions,
          },
        ];
      }

      if (state.qrToken) {
        localStorage.setItem(`dineeze_cart_${state.qrToken}`, JSON.stringify(newItems));
      }
      set({ items: newItems });
    },

    removeItem: (dishId: string) => {
      const state = get();
      const newItems = state.items.filter((item) => item.dishId !== dishId);
      if (state.qrToken) {
        localStorage.setItem(`dineeze_cart_${state.qrToken}`, JSON.stringify(newItems));
      }
      set({ items: newItems });
    },

    updateQuantity: (dishId: string, quantity: number) => {
      const state = get();
      if (quantity <= 0) {
        return state.removeItem(dishId);
      }

      const newItems = state.items.map((item) =>
        item.dishId === dishId ? { ...item, quantity } : item
      );

      if (state.qrToken) {
        localStorage.setItem(`dineeze_cart_${state.qrToken}`, JSON.stringify(newItems));
      }
      set({ items: newItems });
    },

    clearCart: () => {
      const state = get();
      if (state.qrToken) {
        localStorage.removeItem(`dineeze_cart_${state.qrToken}`);
      }
      set({ items: [] });
    },

    getTotalCount: () => {
      return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },

    getTotalAmount: () => {
      return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
  };
});

export default useCartStore;

