// frontend/src/pages/Register.js

import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import useAxios from '../../utils/useAxios';
import useAuthStore from '../../Stores/useAuthStore';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const setTokens = useAuthStore((state) => state.setTokens);
    const setUser = useAuthStore((state) => state.setUser);

    const api = useAxios();
    const nav = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            /*  const response = await fetch(
        "http://localhost:8000/api/users/register/",
        {
          username: email,
          email,
          password,
        }
      ); */

            const response = await api.post(
                'http://localhost:8000/users/register/',
                {
                    username: email,
                    email,
                    password,
                }
            );
            const { access, refresh } = response.data;
            setTokens(access, refresh);
            setUser(access);

            console.log(response.data);

            nav('/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;
