import { create } from "zustand"

import type { User } from "@/types/users"

interface AuthState {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  clearAuthState: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearAuthState: () => set({ currentUser: null }),
}))
