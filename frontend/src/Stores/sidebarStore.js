import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSidebarStore = create()(
    persist(
        (set) => ({
            open: !false,
            toggleSidebar: () =>
                set((state) => ({
                    open: state.open === true ? false : true,
                })),
            setSidebar: (value) =>
                set((state) => ({
                    open: value,
                })),
        }),
        {
            name: 'sidebar',
        }
    )
);

export default useSidebarStore;
