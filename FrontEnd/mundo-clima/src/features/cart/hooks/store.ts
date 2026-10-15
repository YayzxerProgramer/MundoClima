import { create } from "zustand";
import { persist } from "zustand/middleware";
interface CartLine {
  productId: string;
  quantity: number;
}
interface Cart {
  items: CartLine[];
  add: (id: string, quantity: number, stock: number) => void;
  setQuantity: (id: string, quantity: number, stock: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}
export const useCart = create<Cart>()(
  persist(
    (set) => ({
      items: [],
      add: (id, quantity, stock) =>
        set((state) => {
          if (stock < 1) return state;
          const existing = state.items.find((item) => item.productId === id);
          const next = Math.min(
            stock,
            (existing?.quantity ?? 0) + Math.max(1, Math.floor(quantity)),
          );
          return {
            items: existing
              ? state.items.map((item) =>
                  item.productId === id ? { ...item, quantity: next } : item,
                )
              : [...state.items, { productId: id, quantity: next }],
          };
        }),
      setQuantity: (id, quantity, stock) =>
        set((state) => ({
          items:
            stock < 1
              ? state.items.filter((item) => item.productId !== id)
              : state.items.map((item) =>
                  item.productId === id
                    ? {
                        ...item,
                        quantity: Math.max(
                          1,
                          Math.min(stock, Math.floor(quantity)),
                        ),
                      }
                    : item,
                ),
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== id),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "mundo-clima-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
