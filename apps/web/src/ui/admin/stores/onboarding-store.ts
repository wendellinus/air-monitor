import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type OnboardingState = {
  hasHydrated: boolean;
  tourCompleted: boolean;
  tourSkipped: boolean;
  setHydrated: (value: boolean) => void;
  setTourCompleted: () => void;
  setTourSkipped: () => void;
  resetTour: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      tourCompleted: false,
      tourSkipped: false,
      setHydrated: (value) => set({ hasHydrated: value }),
      setTourCompleted: () => set({ tourCompleted: true, tourSkipped: false }),
      setTourSkipped: () => set({ tourSkipped: true, tourCompleted: false }),
      resetTour: () => set({ tourCompleted: false, tourSkipped: false }),
    }),
    {
      name: 'admin-onboarding',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tourCompleted: state.tourCompleted,
        tourSkipped: state.tourSkipped,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
