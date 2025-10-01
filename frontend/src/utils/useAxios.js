import useAuthStore from '../Stores/useAuthStore';

import axios from 'axios';

const useAxios = () => {
const instance = axios.create({
  baseURL: 'http://localhost:8000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

const logout = useAuthStore((state) => state.logout);  // Hook per forzare il logout

const setUser = useAuthStore((state) => state.setUser);

instance.interceptors.request.use(config => {
  const accessToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('accessToken='))
    ?.split('=')[1];
  
  if (accessToken) {
    console.log("ok");
    
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});

instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    console.log("error",error);
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("retry");
      
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refreshToken='))
        ?.split('=')[1];
      
        if (refreshToken) {
            try {
              const response = await axios.post('http://localhost:8000/api/token/refresh/', { refresh: refreshToken });
              document.cookie = `accessToken=${response.data.access}; path=/`;
  
              setUser(response.data.access);
              instance.defaults.headers.Authorization = `Bearer ${response.data.access}`;
  
              return instance(originalRequest);  // Riprova la richiesta originale
            } catch (err) {
              console.error("Refresh token scaduto o invalido", err);
              window.location.href = '/';
              logout();  // Forza il logout se il refresh token è scaduto/invalido
              return Promise.reject(err);  // Rifiuta la promessa e interrompi
            }
          } else {
            // Se non c'è un refresh token disponibile, forza il logout
            /* window.location.href = '/'; */
            logout();
            return Promise.reject(error);
          }
        
    }
    
    return Promise.reject(error);
  }
);

return instance;
};

export default useAxios;
