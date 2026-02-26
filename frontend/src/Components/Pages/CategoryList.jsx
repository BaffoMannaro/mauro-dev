import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import Navbar from '../Molecules/Navbar';
import Footer from '../Landing/Footer';
import GetInTouch from '../Landing/GetInTouch';
import useAxios from '../../utils/useAxios';

export default function CategoryList() {
    const { id } = useParams();
    const [articles, setArticles] = useState([]);
    const [category, setCategory] = useState(null);
    const [tags, setTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 6;

    const { i18n, t } = useTranslation();
    const activeLang = i18n.resolvedLanguage;
    const api = useAxios();

    // Fetch category details and all tags when id changes
    useEffect(() => {
        fetchCategory();
        fetchAllTags();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Fetch articles when id or selectedTag changes
    useEffect(() => {
        fetchArticles(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, selectedTag]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/blog/categories/${id}/`);
            setCategory(response.data);
        } catch (err) {
            console.error('Errore nel caricamento della categoria', err);
            toast.error('Errore nel caricamento della categoria');
        }
    };

    const fetchAllTags = async () => {
        try {
            // Fetch all articles from this category to extract all tags
            const response = await api.get(
                `/blog/articles/published/?category=${id}&page_size=100`
            );
            const allArticles = response.data.results || response.data;
            extractTags(allArticles);
        } catch (err) {
            console.error('Errore nel caricamento dei tag', err);
            toast.error('Errore nel caricamento dei tag');
        }
    };

    const fetchArticles = async (page = 1, reset = false) => {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let url = `/blog/articles/published/?page=${page}&page_size=${pageSize}&category=${id}`;
            if (selectedTag) {
                url += `&tags=${selectedTag}`;
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

    const extractTags = (articlesList) => {
        // Extract all unique tags from the articles
        const tagMap = new Map();
        articlesList.forEach((article) => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach((tag) => {
                    if (!tagMap.has(tag.id)) {
                        tagMap.set(tag.id, tag);
                    }
                });
            }
        });
        setTags(Array.from(tagMap.values()));
    };

    const handleTagClick = (tagId) => {
        setSelectedTag(tagId);
        setCurrentPage(1);
    };

    const loadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchArticles(nextPage, false);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-32 xl:pt-32 ">
                <div className="max-w-7xl mx-auto px-4 xl:px-0">
                    {/* Category Header */}
                    <div className="mb-8">
                        <h1 className="title mb-4 text-white">
                            {category?.display_name?.[activeLang] ||
                                'Categoria'}
                        </h1>
                    </div>

                    {/* Tags Filter */}
                    {loading ? (
                        <div className="mb-8 border-b border-[#434348] pb-4">
                            <div className="h-6 bg-gray-700 animate-pulse w-32 mb-3" />
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="h-10 w-24 bg-gray-700 animate-pulse"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        tags.length > 0 && (
                            <div className="mb-8 border-b border-[#434348] pb-4">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedTag(null);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors border border-[#434348] ${
                                            selectedTag === null
                                                ? 'bg-supero-green text-black border-supero-green'
                                                : 'text-gray-300 hover:bg-[#434348] hover:text-white'
                                        }`}
                                    >
                                        {t('all')}
                                    </button>
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() =>
                                                handleTagClick(tag.id)
                                            }
                                            className={`px-4 py-2 text-sm font-medium transition-colors border border-[#434348] ${
                                                selectedTag === tag.id
                                                    ? 'bg-supero-green text-black border-supero-green'
                                                    : 'text-gray-300 hover:bg-[#434348] hover:text-white'
                                            }`}
                                        >
                                            {tag.display_name?.[activeLang] ||
                                                tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    {/* Articles Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    ) : articles.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-600 dark:text-gray-400">
                                Nessun articolo trovato per questa categoria
                                {selectedTag && ' con il tag selezionato'}.
                            </p>
                        </div>
                    ) : (
                        <>
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

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="flex justify-center mt-12">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="px-8 py-3 bg-supero-green text-white font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
                                    >
                                        {loadingMore
                                            ? 'Caricamento...'
                                            : 'Carica altri articoli'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <GetInTouch />
            <Footer />
        </>
    );
}
