import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProfileState {
  /** Name printed on certificates. Stored only in this browser. */
  learnerName: string;
  setLearnerName: (name: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      learnerName: "",
      setLearnerName: (learnerName) => set({ learnerName }),
    }),
    { name: "oyelabs-profile" },
  ),
);
