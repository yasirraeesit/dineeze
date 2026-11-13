import { create } from "zustand";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  accentColor: string;
  currency: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  wifiPassword?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  restaurants: Restaurant[];
  activeRestaurant: Restaurant | null;
  setAuth: (token: string, user: User, restaurants?: Restaurant[]) => void;
  setActiveRestaurant: (restaurant: Restaurant) => void;
  updateActiveRestaurant: (data: Partial<Restaurant>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem("dineeze_token");
  const savedUser = localStorage.getItem("dineeze_user");
  const savedActiveRestaurant = localStorage.getItem("dineeze_active_restaurant");

  return {
    token: savedToken || null,
    user: savedUser ? JSON.parse(savedUser) : null,
    restaurants: [],
    activeRestaurant: savedActiveRestaurant ? JSON.parse(savedActiveRestaurant) : null,

    setAuth: (token, user, restaurants = []) => {
      localStorage.setItem("dineeze_token", token);
      localStorage.setItem("dineeze_user", JSON.stringify(user));
      const active = restaurants.length > 0 ? restaurants[0] : null;
      if (active) {
        localStorage.setItem("dineeze_active_restaurant", JSON.stringify(active));
      }
      set({ token, user, restaurants, activeRestaurant: active });
    },

    setActiveRestaurant: (restaurant) => {
      localStorage.setItem("dineeze_active_restaurant", JSON.stringify(restaurant));
      set({ activeRestaurant: restaurant });
    },

    updateActiveRestaurant: (data) => {
      set((state) => {
        if (!state.activeRestaurant) return state;
        const updated = { ...state.activeRestaurant, ...data };
        localStorage.setItem("dineeze_active_restaurant", JSON.stringify(updated));
        return {
          activeRestaurant: updated,
          restaurants: state.restaurants.map((r) =>
            r.id === updated.id ? updated : r
          ),
        };
      });
    },

    logout: () => {
      localStorage.removeItem("dineeze_token");
      localStorage.removeItem("dineeze_user");
      localStorage.removeItem("dineeze_active_restaurant");
      set({ token: null, user: null, restaurants: [], activeRestaurant: null });
    },
  };
});

export default useAuthStore;

