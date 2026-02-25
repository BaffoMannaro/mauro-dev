import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Molecules/Navbar';
import { useTranslation } from 'react-i18next';
import blockRight from '../../assets/images/block-right-kh.png';
import useAxios from '../../utils/useAxios';
import Footer from '../Landing/Footer';
import GetInTouch from '../Landing/GetInTouch';

export default function Articles() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [selectedTag, setSelectedTag] = useState('');
    const [tags, setTags] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 6; // 6 articoli per pagina per /published/
    const isInitialMount = useRef(true);

    const { t } = useTranslation();

    const { i18n } = useTranslation();
    const activeLang = i18n.resolvedLanguage;

    const api = useAxios();

    // Fetch tags and initial articles on mount
    useEffect(() => {
        fetchTags();
        fetchArticles(1, true);
        isInitialMount.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset and fetch articles when tag changes (skip initial mount)
    useEffect(() => {
        if (!isInitialMount.current) {
            setCurrentPage(1);
            fetchArticles(1, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTag]);

    const fetchTags = async () => {
        try {
            const response = await api.get(`/blog/tags/`);
            console.log(response);

            setTags(response.data.results);
        } catch (err) {
            console.error('Errore nel caricamento dei tag', err);
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
            if (selectedTag) {
                url += `&main_tag=${selectedTag}`;
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
            {loading ? (
                <div>
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="text-xl">Caricamento articoli...</div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="max-w-7xl mx-auto">
                        {/* Tag Filter */}
                        {tags.length > 0 && (
                            <div className="mb-8 flex px-4 xl:px-0 border-b border-[#434348] pb-4">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedTag('')}
                                        className={`px-4 py-2  text-sm font-medium transition-colors border border-[#434348] ${
                                            selectedTag === ''
                                                ? 'bg-[#434348] text-white'
                                                : 'text-gray-300 '
                                        }`}
                                    >
                                        Tutti
                                    </button>
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() =>
                                                setSelectedTag(tag.id)
                                            }
                                            className={`px-4 py-2  text-sm font-medium transition-colors border border-[#434348] ${
                                                selectedTag === tag.id
                                                    ? 'bg-[#434348] text-white'
                                                    : 'text-gray-300 '
                                            }`}
                                        >
                                            {tag.display_name?.[activeLang] ||
                                                '-'}
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
                                            {/* Tag */}
                                            {article.main_tag && (
                                                <span className=" bg-[#434348] text-white  px-3 py-1 border border-[#434348] me-2">
                                                    {article.main_tag
                                                        .display_name?.[
                                                        activeLang
                                                    ] || '-'}
                                                </span>
                                            )}

                                            {article.other_tags.map((tag) => {
                                                return (
                                                    <span
                                                        key={tag.id}
                                                        className="border border-[#434348] text-white  px-3 py-1 me-2"
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
                    </div>
                </>
            )}

            <GetInTouch />
            <Footer />
        </>
    );
}
