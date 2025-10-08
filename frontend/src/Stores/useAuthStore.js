// frontend/src/store/useAuthStore.js

import { jwtDecode } from 'jwt-decode';
import {create} from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(persist(
  (set) => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    setUser: (accessToken) => {
      if (accessToken) {
        console.log('accessToken >>>>> ', accessToken);
        
        const user = jwtDecode(accessToken);
        set({ user: user });
      } else {
        set({ user: null });
      }
    },
    
    setTokens: (access, refresh) => {
      set({ accessToken: access, refreshToken: refresh });
      document.cookie = `accessToken=${access}; path=/`;
      document.cookie = `refreshToken=${refresh}; path=/`;
    },
    logout: () => {
      /* set({ accessToken: null, refreshToken: null, user: null });
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/'; */
    },
  }),
  {
    name: 'auth-storage',
  }
));

export default useAuthStore;
