import { create } from "zustand";
interface Toast {
  id: number;
  message: string;
  tone: "success" | "error";
}
interface UI {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toasts: Toast[];
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
}
export const useUI = create<UI>((set) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  toasts: [],
  toast: (message, tone = "success") => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, message, tone }],
    }));
    window.setTimeout(() => useUI.getState().dismiss(id), 6000);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
