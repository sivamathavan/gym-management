import { create } from 'zustand';
import { authApi } from '../utils/api';

const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────
  user: null,
  token: localStorage.getItem('fitcore_token'),

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('fitcore_token', res.data.token);
    set({ token: res.data.token, user: res.data.user });
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('fitcore_token');
    set({ token: null, user: null });
  },

  fetchMe: async () => {
    try {
      const res = await authApi.me();
      set({ user: res.data });
    } catch {
      get().logout();
    }
  },

  // ── UI State ──────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Branch filter (for multi-branch) ─────────
  selectedBranch: 'all',
  setSelectedBranch: (id) => set({ selectedBranch: id }),
}));

export default useStore;
