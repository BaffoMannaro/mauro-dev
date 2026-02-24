import { createBrowserRouter } from 'react-router-dom';

import Home from './Components/Pages/HomePage';
import AuthRoot from './Layouts/AuthRoot';

import DashRoot from './Layouts/DashRoot';

import WithRoles from './Components/WithRole';
import ProtectedRoute from './Components/ProtectedRoute';
/* import AdminPage from './Components/Pages/AdminPage'; */
import NotFound from './Components/Pages/NotFound';

import Login from './Components/Pages/Login';

import AdminPage from './Components/Pages/AdminPage';
import Landing from './Components/Pages/Landing';
import ThankYouPage from './Components/Pages/ThankYouPage';
import PressRelease from './Components/Pages/PressRelease';
import ArticlesList from './Components/Pages/ArticlesList';
import ArticleForm from './Components/Pages/ArticleForm';
import TagsList from './Components/Pages/TagsList';
import Articles from './Components/Pages/Articles';
import ArticleDetail from './Components/Pages/ArticleDetail';

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
                path: '/articles',
                element: <Articles />,
            },
            {
                path: '/articles/:slug',
                element: <ArticleDetail />,
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
            {
                path: '/dashboard/',
                element: <DashRoot />,
                children: [
                    {
                        path: '/dashboard/',
                        element: (
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        ),
                    },

                    {
                        path: '/dashboard/articles/',
                        element: (
                            <ProtectedRoute>
                                <ArticlesList />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/dashboard/articles/new',
                        element: (
                            <ProtectedRoute>
                                <ArticleForm />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/dashboard/articles/edit/:slug',
                        element: (
                            <ProtectedRoute>
                                <ArticleForm />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/dashboard/tags/',
                        element: (
                            <ProtectedRoute>
                                <TagsList />
                            </ProtectedRoute>
                        ),
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
            },
        ],
    },
]);
