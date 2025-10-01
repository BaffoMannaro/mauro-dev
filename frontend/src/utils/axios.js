import axios from 'axios';

const env = import.meta.env.MODE;

const backend =
    env === 'development' ? import.meta.env.VITE_BACKEND_URL : 'FIXME';
const apiInstance = axios.create({
    baseURL: backend,
    timeout: 5000, // timeout after 5 seconds
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

export default apiInstance;
