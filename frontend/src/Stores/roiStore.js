import { create } from 'zustand';

const useROIStore = create((set) => ({
    roiData: null,
    setROIData: (data) => set({ roiData: data }),
    clearROIData: () => set({ roiData: null }),
}));

export default useROIStore;
