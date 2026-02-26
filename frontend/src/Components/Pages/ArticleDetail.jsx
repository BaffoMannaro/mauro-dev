import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Molecules/Navbar';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import SuggestedArticles from '../Molecules/SuggestedArticles';

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
        const lang = activeLang === 'en' ? 'en-US' : 'it-IT';
        return date.toLocaleDateString(lang, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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
                    Supero |{' '}
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
            <div className="py-12 px-4 sm:px-6 pt-48">
                <div className="max-w-5xl mx-auto">
                    {/* Back Button */}
                    {/*  <button
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
                    </button> */}
                    <div className="flex items-center justify-center mb-12">
                        {article.category && (
                            <span className=" bg-supero-green text-black  px-3 py-1 border border-supero-green me-2">
                                {article.category.display_name?.[activeLang] ||
                                    '-'}
                            </span>
                        )}

                        {article.tags.map((tag) => {
                            return (
                                <span
                                    key={tag.id}
                                    className="border border-[#434348] text-white  px-3 py-1 me-2"
                                >
                                    {tag.display_name?.[activeLang] || '-'}
                                </span>
                            );
                        })}
                    </div>
                    {/* Title */}
                    <h1 className="text-4xl text-center font-bold text-gray-900 dark:text-white mb-4">
                        {activeLang == 'en'
                            ? article.title?.en
                            : article.title?.it}
                    </h1>

                    {/* Date */}

                    {article.published_at && (
                        <p className="text-white text-center my-16">
                            {formatDate(
                                article.published_at || article.created_at
                            )}
                        </p>
                    )}
                </div>
            </div>

            {article.main_image && (
                <div className="w-full xl:max-w-6xl mx-auto overflow-hidden mb-12 px-12 xl:px-0">
                    <img
                        src={article.main_image}
                        alt={
                            activeLang == 'en'
                                ? article.title?.en
                                : article.title?.it
                        }
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <article className="max-w-5xl mx-auto">
                {/* Main Image */}

                {/* Article Content */}
                <div className="p-8">
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
                                        className="text-gray-200"
                                    />
                                ) : (
                                    <div className="my-8">
                                        <img
                                            src={block.image}
                                            alt={`Immagine blocco ${block.order}`}
                                            className="block mx-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </article>

            {/* related articles */}

            <SuggestedArticles categoryId={article.category?.id} />
        </>
    );
}
