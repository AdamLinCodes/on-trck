// lib/store/useStore.ts
import { create } from 'zustand';
import dayjs from 'dayjs';
import { ensureDemoHabit, createHabitCheckin, completeTaskInstance } from '../data';

type Filters = { showArchived: boolean };

type AppState = {
  // UI
  selectedDate: string; // ISO
  filters: Filters;

  // lifecycle
  ready: boolean;
  init: () => Promise<void>;

  // setters
  setSelectedDate: (iso: string) => void;
  toggleArchived: () => void;

  // actions
  checkInHabit: (habitId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  selectedDate: dayjs().toISOString(),
  filters: { showArchived: false },
  ready: false,

  init: async () => {
    await ensureDemoHabit();
    set({ ready: true });
  },

  setSelectedDate: (iso) => set({ selectedDate: iso }),
  toggleArchived: () =>
    set((s) => ({ filters: { ...s.filters, showArchived: !s.filters.showArchived } })),

  checkInHabit: async (habitId: string) => {
    const day = dayjs(get().selectedDate).format('YYYY-MM-DD');
    await createHabitCheckin(habitId, day);
  },

  completeTask: async (taskId: string) => {
    const day = dayjs(get().selectedDate).format('YYYY-MM-DD');
    await completeTaskInstance(taskId, day);
  },
}));
