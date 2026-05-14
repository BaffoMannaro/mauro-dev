// frontend/src/store/useAuthStore.js

import { jwtDecode } from 'jwt-decode';
import {create} from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(persist(
  (set) => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    isLoading: true, // Stato di loading per rehydration
    
    setIsLoading: (loading) => set({ isLoading: loading }),
    
    setUser: (accessToken) => {
      if (accessToken) {
        console.log('accessToken >>>>> ', accessToken);
        
        const user = jwtDecode(accessToken);
        set({ user: user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    },
    
    setTokens: (access, refresh) => {
      console.log('=== setTokens() chiamato ===');
      set({ accessToken: access, refreshToken: refresh });
      document.cookie = `accessToken=${access}; path=/; max-age=${60 * 60 * 24}`;
      document.cookie = `refreshToken=${refresh}; path=/; max-age=${60 * 60 * 24 * 7}`;
      console.log('Tokens saved in cookies:', document.cookie);
    },
    logout: () => {
      set({ accessToken: null, refreshToken: null, user: null });
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Pulisci anche il localStorage di Zustand
      localStorage.removeItem('auth-storage');
    },
  }),
  {
    name: 'auth-storage',
    // Non persistere isLoading - deve sempre partire da true
    partialize: (state) => ({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
      // NON includere isLoading
    }),
  }
));

export default useAuthStore;
