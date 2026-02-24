import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Molecules/Navbar';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function ArticleDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { i18n } = useTranslation();

    const activeLang = i18n.resolvedLanguage;

    useEffect(() => {
        fetchArticle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${BACKEND_URL}/blog/articles/${slug}/`
            );

            // Verifica che l'articolo sia pubblicato (per utenti non autenticati)
            if (!response.data.is_published) {
                setError('Articolo non trovato');
                return;
            }

            setArticle(response.data);
        } catch (err) {
            console.error("Errore nel caricamento dell'articolo", err);
            if (err.response?.status === 404) {
                setError('Articolo non trovato');
            } else {
                setError("Errore nel caricamento dell'articolo");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        return imageUrl.startsWith('http')
            ? imageUrl
            : `${BACKEND_URL}${imageUrl}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl">Caricamento articolo...</div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <div className="text-xl text-red-600 mb-4">
                    {error || 'Articolo non trovato'}
                </div>
                <button
                    onClick={() => navigate('/articles')}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                    Torna agli articoli
                </button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>
                    {activeLang == 'en' ? article.title?.en : article.title?.it}
                </title>
                <meta
                    name="description"
                    content={
                        activeLang == 'en'
                            ? article.meta_description?.en
                            : article.meta_description?.it
                    }
                />
            </Helmet>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 pt-48">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/articles')}
                        className="mb-6 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Torna agli articoli
                    </button>

                    {/* Article Header */}
                    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        {/* Main Image */}
                        {article.main_image && (
                            <div className="w-full h-96 overflow-hidden">
                                <img
                                    src={getImageUrl(article.main_image)}
                                    alt={
                                        activeLang == 'en'
                                            ? article.title?.en
                                            : article.title?.it
                                    }
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Article Content */}
                        <div className="p-8">
                            {/* Tags */}
                            <div className="mb-4 flex flex-wrap gap-2">
                                {article.main_tag && (
                                    <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full font-semibold">
                                        {activeLang == 'en'
                                            ? article.main_tag.display_name?.en
                                            : article.main_tag.display_name?.it}
                                    </span>
                                )}
                                {article.other_tags?.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm px-3 py-1 rounded-full"
                                    >
                                        {activeLang == 'en'
                                            ? tag.display_name?.en
                                            : tag.display_name?.it}
                                    </span>
                                ))}
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                {activeLang == 'en'
                                    ? article.title?.en
                                    : article.title?.it}
                            </h1>

                            {/* Date */}
                            {article.published_at && (
                                <p className="text-gray-500 dark:text-gray-400 mb-8">
                                    Pubblicato il{' '}
                                    {formatDate(article.published_at)}
                                </p>
                            )}

                            {/* Meta Description */}
                            {article.meta_description && (
                                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                    {activeLang == 'en'
                                        ? article.meta_description?.en
                                        : article.meta_description?.it}
                                </p>
                            )}

                            {/* Content Blocks */}
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                                {article.blocks?.map((block) => (
                                    <div key={block.id} className="mb-6">
                                        {block.block_type === 'text' ? (
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        activeLang == 'en'
                                                            ? block.content?.en
                                                            : block.content?.it,
                                                }}
                                                className="text-gray-800 dark:text-gray-200"
                                            />
                                        ) : (
                                            <div className="my-8">
                                                <img
                                                    src={getImageUrl(
                                                        block.image ||
                                                            block.content
                                                    )}
                                                    alt={`Immagine blocco ${block.order}`}
                                                    className="w-full rounded-lg shadow-md"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </article>

                    {/* Related Articles could go here */}
                </div>
            </div>
        </>
    );
}
