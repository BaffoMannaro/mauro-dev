import { createBrowserRouter } from 'react-router-dom';

import Home from './Components/Pages/HomePage';
import AuthRoot from './Layouts/AuthRoot';

import DashRoot from './Layouts/DashRoot';

import WithRoles from './Components/WithRole';
/* import AdminPage from './Components/Pages/AdminPage'; */
import NotFound from './Components/Pages/NotFound';
import Buttons from './Components/Pages/Buttons';
import Cards from './Components/Pages/Cards';
import GetPostTest from './Components/Pages/GetPostTest';
/* import ProfilePage from './Components/Pages/ProfilePage'; */
import ForgotPassword from './Components/Pages/ForgotPassword';
import ResetPassword from './Components/Pages/ResetPassword';

import FormRecipes from './Components/Pages/FormRecipes';
import Typo from './Components/Pages/Typo';
import Steps from './Components/Pages/Steps';
import Layout from './Components/Pages/Layout';
import Charts from './Components/Pages/Charts';

import Login from './Components/Pages/Login';
import Register from './Components/Pages/Register';
import AdminPage from './Components/Pages/AdminPage';
import Landing from './Components/Pages/Landing';
import ThankYouPage from './Components/Pages/ThankYouPage';
import PressRelease from './Components/Pages/PressRelease';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AuthRoot />,
        errorElement: <NotFound />,
        children: [
            {
                path: '/',
                element: <Landing />,
            },
            {
                path: '/thank-you-page',
                element: <ThankYouPage />,
            },
            {
                path: '/comunicato-stampa-rebranding',
                element: <PressRelease />,
            },
            {
                path: '/login',
                element: <Login />,
            },
            /*  {
                path: '/register',
                element: <Register />,
            },
            {
                path: '/forgot-password',
                element: <ForgotPassword />,
            },
            {
                path: '/reset-password',
                element: <ResetPassword />,
            },

            {
                path: '/dashboard/',
                element: <DashRoot />,
                children: [
                    {
                        path: '/dashboard/',
                        element: <Home />,
                    },
                  
                    {
                        path: '/dashboard/buttons/',
                        element: <Buttons />,
                    },
                    {
                        path: '/dashboard/cards/',
                        element: <Cards />,
                    },
                    {
                        path: '/dashboard/typography/',
                        element: <Typo />,
                    },
                    {
                        path: '/dashboard/steps/',
                        element: <Steps />,
                    },
                    {
                        path: '/dashboard/layout/',
                        element: <Layout />,
                    },
                    {
                        path: '/dashboard/charts/',
                        element: <Charts />,
                    },
                    {
                        path: '/dashboard/get-post-test/',
                        element: <GetPostTest />,
                    },
                    {
                        path: '/dashboard/form-recipes/',
                        element: <FormRecipes />,
                    },

                    {
                        path: '/dashboard/admin',
                        element: (
                            <WithRoles allowedRoles={['admin']}>
                                <AdminPage />
                            </WithRoles>
                        ),
                    },
                ],
            }, */
        ],
    },
]);
