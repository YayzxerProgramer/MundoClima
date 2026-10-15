import { create } from "zustand";
import { persist } from "zustand/middleware";
interface PendingOrder {
  userId: string;
  orderId: string;
}
export const usePendingOrder = create<{
  pending: PendingOrder | null;
  setPending: (pending: PendingOrder | null) => void;
}>()(
  persist(
    (set) => ({ pending: null, setPending: (pending) => set({ pending }) }),
    { name: "mundo-clima-pending-order" },
  ),
);
