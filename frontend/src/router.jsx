import { createBrowserRouter } from 'react-router-dom';

import Home from './Components/Pages/HomePage';
import AuthRoot from './Layouts/AuthRoot';
import DashRoot from './Layouts/DashRoot';
import ProtectedRoute from './Components/ProtectedRoute';
import NotFound from './Components/Pages/NotFound';
import Login from './Components/Pages/Login';
import Landing from './Components/Pages/Landing';
import ThankYouPage from './Components/Pages/ThankYouPage';
import PressRelease from './Components/Pages/PressRelease';
import ArticlesList from './Components/Pages/ArticlesList';
import ArticleForm from './Components/Pages/ArticleForm';
import TagsList from './Components/Pages/TagsList';
import CategoriesList from './Components/Pages/CategoriesList';
import Articles from './Components/Pages/Articles';
import ArticleDetail from './Components/Pages/ArticleDetail';
import CategoryList from './Components/Pages/CategoryList';
import SuperoFinish from './Components/Pages/SuperoFinish';

const publicChildren = [
    { index: true, element: <Landing /> },
    { path: 'articles', element: <Articles /> },
    { path: 'articles/:slug', element: <ArticleDetail /> },
    { path: 'category/:id', element: <CategoryList /> },
    { path: 'thank-you-page', element: <ThankYouPage /> },
    { path: 'comunicato-stampa-rebranding', element: <PressRelease /> },
    { path: 'supero-finish', element: <SuperoFinish /> },
    { path: 'login', element: <Login /> },
];

const dashboardRoute = {
    path: 'dashboard',
    element: <DashRoot />,
    children: [
        {
            index: true,
            element: (
                <ProtectedRoute>
                    <Home />
                </ProtectedRoute>
            ),
        },
        {
            path: 'articles',
            element: (
                <ProtectedRoute>
                    <ArticlesList />
                </ProtectedRoute>
            ),
        },
        {
            path: 'articles/new',
            element: (
                <ProtectedRoute>
                    <ArticleForm />
                </ProtectedRoute>
            ),
        },
        {
            path: 'articles/edit/:slug',
            element: (
                <ProtectedRoute>
                    <ArticleForm />
                </ProtectedRoute>
            ),
        },
        {
            path: 'tags',
            element: (
                <ProtectedRoute>
                    <TagsList />
                </ProtectedRoute>
            ),
        },
        {
            path: 'categories',
            element: (
                <ProtectedRoute>
                    <CategoriesList />
                </ProtectedRoute>
            ),
        },
    ],
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AuthRoot />,
        errorElement: <NotFound />,
        children: [...publicChildren, dashboardRoute],
    },
]);
