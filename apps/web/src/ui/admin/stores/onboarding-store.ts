import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type OnboardingState = {
  tourCompleted: boolean;
  tourSkipped: boolean;
  setTourCompleted: () => void;
  setTourSkipped: () => void;
  resetTour: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      tourCompleted: false,
      tourSkipped: false,
      setTourCompleted: () => set({ tourCompleted: true, tourSkipped: false }),
      setTourSkipped: () => set({ tourSkipped: true }),
      resetTour: () => set({ tourCompleted: false, tourSkipped: false }),
    }),
    {
      name: 'admin-onboarding',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
