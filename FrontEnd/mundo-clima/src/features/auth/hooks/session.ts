import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";
interface Session {
  token: string | null;
  user: User | null;
  revision: number;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}
export const useSession = create<Session>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      revision: 0,
      setToken: (token) =>
        set((state) => ({ token, user: null, revision: state.revision + 1 })),
      setUser: (user) =>
        set((state) => ({ user, revision: state.revision + 1 })),
      logout: () =>
        set((state) => ({
          token: null,
          user: null,
          revision: state.revision + 1,
        })),
    }),
    {
      name: "mundo-clima-session",
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
