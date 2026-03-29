import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import Navbar from '../Molecules/Navbar';
import { siteUrl } from '../../utils/seo.js';
import { useLocation } from 'react-router-dom';
import {
    breadcrumbListJsonLd,
    jsonLdString,
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd,
} from '../../utils/jsonld.js';
import blockRight from '../../assets/images/block-right-kh.png';
import useAxios from '../../utils/useAxios';
import Footer from '../Landing/Footer';
import GetInTouch from '../Landing/GetInTouch';

export default function Articles() {
    const location = useLocation();
    const pageUrl = siteUrl(location.pathname);
    const pageTitle = 'SUPERO Knowledge Hub – Articles & Insights';
    const pageDescription =
        'Explore articles and insights about AI-driven robotics, surface finishing technology, and industrial automation innovation.';
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 6; // 6 articoli per pagina per /published/
    const isInitialMount = useRef(true);

    const { t } = useTranslation();

    const { i18n } = useTranslation();
    const activeLang = i18n.resolvedLanguage;
    const jsonLdLang = activeLang === 'en' ? 'en' : 'it';
    const resourcesLabel = activeLang === 'en' ? 'Resources' : 'Risorse';

    const api = useAxios();

    // Fetch categories and initial articles on mount
    useEffect(() => {
        fetchCategories();
        fetchArticles(1, true);
        isInitialMount.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset and fetch articles when category changes (skip initial mount)
    useEffect(() => {
        if (!isInitialMount.current) {
            setCurrentPage(1);
            fetchArticles(1, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const response = await api.get(`/blog/categories/`);
            console.log(response);

            setCategories(response.data.results);
        } catch (err) {
            console.error('Errore nel caricamento delle categorie', err);
            toast.error('Errore nel caricamento delle categorie');
        }
    };

    const fetchArticles = async (page = 1, reset = false) => {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let url = `/blog/articles/published/?page=${page}&page_size=${pageSize}`;
            if (selectedCategory) {
                url += `&category=${selectedCategory}`;
            }
            const response = await api.get(url);
            const newArticles = response.data.results || response.data;
            const totalCount = response.data.count || 0;

            if (reset) {
                setArticles(newArticles);
            } else {
                setArticles((prev) => [...prev, ...newArticles]);
            }

            // Check if there are more articles to load
            setHasMore(page * pageSize < totalCount);
        } catch (err) {
            console.error('Errore nel caricamento degli articoli', err);
            toast.error('Errore nel caricamento degli articoli');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchArticles(nextPage, false);
    };

    return (
        <>
            <Helmet>
                <title>{pageTitle}</title>
                <link rel="canonical" href={pageUrl} />
                <meta
                    name="description"
                    content={pageDescription}
                />
                <meta
                    property="og:title"
                    content={pageTitle}
                />
                <meta
                    property="og:description"
                    content={pageDescription}
                />
                <meta
                    property="og:url"
                    content={pageUrl}
                />
                <meta property="og:type" content="website" />
                <script type="application/ld+json">
                    {jsonLdString(organizationJsonLd({ url: siteUrl('/') }))}
                </script>
                <script type="application/ld+json">
                    {jsonLdString(websiteJsonLd({ url: siteUrl('/') }))}
                </script>
                <script type="application/ld+json">
                    {jsonLdString(
                        webPageJsonLd({
                            url: pageUrl,
                            name: pageTitle,
                            description: pageDescription,
                        })
                    )}
                </script>
                <script type="application/ld+json">
                    {jsonLdString(
                        breadcrumbListJsonLd({
                            lang: jsonLdLang,
                            items: [
                                {
                                    name: 'Home',
                                    url: siteUrl('/'),
                                },
                                {
                                    name: resourcesLabel,
                                    url: pageUrl,
                                },
                            ],
                        })
                    )}
                </script>
            </Helmet>
            <Navbar />
            <div className="h-[70vh] xl:h-[80vh] flex flex-wrap items-center pt-2 xl:pt-32 pb-6 xl:py-6 relative">
                <div className="px-6 xl:px-12 w-full xl:w-1/2 relative z-10">
                    <h3 className="title" style={{}}>
                        Knowledge <br className="xl:hidden" />
                        <span className="text-supero-green font-black font-stretch-125  tracking-tight">
                            Hub
                        </span>
                    </h3>
                    <p className="mt-6 xl:mt-12 max-w-[700px] text-left text-body-l whitespace-pre-line">
                        {t('knowledge_hub_description')}
                    </p>
                </div>

                <img
                    src={blockRight}
                    alt="Decorative block"
                    className="hidden xl:block absolute right-0 top-1/2 transform -translate-y-1/2" // center this block vertically on the right side
                />
            </div>
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <>
                        {/* Skeleton Loader */}
                        <div className="mb-8 flex px-4 xl:px-0 border-b border-[#434348] pb-4">
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-10 w-24 bg-gray-700 animate-pulse"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 xl:px-0">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="overflow-hidden">
                                    <div className="h-[240px] xl:h-[280px] w-full bg-gray-700 animate-pulse" />
                                    <div className="py-6">
                                        <div className="h-6 bg-gray-700 animate-pulse mb-3 w-20" />
                                        <div className="h-6 bg-gray-700 animate-pulse mb-2" />
                                        <div className="h-4 bg-gray-700 animate-pulse w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Category Filter */}
                        {categories.length > 0 && (
                            <div className="mb-8 flex px-4 xl:px-0 border-b border-[#434348] pb-4">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className={`px-4 py-2  text-sm font-medium transition-colors border border-[#434348] ${
                                            selectedCategory === ''
                                                ? 'bg-[#434348] text-white'
                                                : 'text-gray-300 '
                                        }`}
                                    >
                                        {t('all')}
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() =>
                                                setSelectedCategory(category.id)
                                            }
                                            className={`px-4 py-2  text-sm font-medium transition-colors border border-[#434348] ${
                                                selectedCategory === category.id
                                                    ? 'bg-[#434348] text-white'
                                                    : 'text-gray-300 '
                                            }`}
                                        >
                                            {category.display_name?.[
                                                activeLang
                                            ] || '-'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Articles Grid */}
                        {articles.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-xl text-gray-600 dark:text-gray-400">
                                    Nessun articolo pubblicato al momento.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 xl:px-0">
                                {articles.map((article) => (
                                    <div
                                        key={article.id}
                                        className="overflow-hidden group"
                                    >
                                        {/* Article Image */}
                                        {article.main_image && (
                                            <div className="h-[240px] xl:h-[280px] w-full overflow-hidden relative">
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_URL}${article.main_image}`}
                                                    alt={
                                                        article.title?.[
                                                            activeLang
                                                        ] || '-'
                                                    }
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                />

                                                <div className="absolute bottom-0 right-0 bg-supero-green h-12 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Link
                                                        to={`/articles/${article.slug}`}
                                                        className="relative w-6 h-6 overflow-hidden transform rotate-90"
                                                    >
                                                        <svg
                                                            width="24"
                                                            height="24"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="absolute transition-all duration-300 transform group-hover:translate-x-6 group-hover:-translate-y-6 group-hover:opacity-0"
                                                        >
                                                            <path
                                                                d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                                                fill="currentColor"
                                                            ></path>
                                                        </svg>
                                                        <svg
                                                            width="24"
                                                            height="24"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="absolute transition-all duration-300 transform -translate-x-6 translate-y-6 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                                                        >
                                                            <path
                                                                d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                                                fill="currentColor"
                                                            ></path>
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}

                                        {/* Article Content */}
                                        <div className="py-6">
                                            {/* Category */}
                                            {article.category && (
                                                <span className=" bg-[#434348] text-xs text-white  px-3 py-1 border border-[#434348] me-2">
                                                    {article.category
                                                        .display_name?.[
                                                        activeLang
                                                    ] || '-'}
                                                </span>
                                            )}

                                            {article.tags.map((tag) => {
                                                return (
                                                    <span
                                                        key={tag.id}
                                                        className="border border-[#434348] text-xs text-white  px-3 py-1 me-2"
                                                    >
                                                        {tag.display_name?.[
                                                            activeLang
                                                        ] || '-'}
                                                    </span>
                                                );
                                            })}

                                            {/* Title */}
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-5">
                                                {article.title?.[activeLang] ||
                                                    '-'}
                                            </h2>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Load More Button */}
                        {hasMore && !loading && (
                            <div className="mt-12 mb-8 px-4">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="w-full px-8 py-3 bg-[#A6A6AB] text-black uppercase transition-colors text-center hover:bg-[#555559] disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                                >
                                    {loadingMore ? 'Loading...' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <GetInTouch />
            <Footer />
        </>
    );
}
