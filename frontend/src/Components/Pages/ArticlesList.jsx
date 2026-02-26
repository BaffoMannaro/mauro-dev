import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAxios from '../../utils/useAxios';

export default function ArticlesList() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10; // 10 articoli per pagina per la vista admin
    const api = useAxios();

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [searchTerm]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    // Fetch articles when page or search term changes
    useEffect(() => {
        fetchArticles(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearchTerm]);

    const fetchArticles = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                page_size: pageSize,
                ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
            };
            const response = await api.get('/blog/articles/', { params });
            setArticles(response.data.results || response.data);
            setTotalCount(response.data.count || 0);
            setTotalPages(Math.ceil((response.data.count || 0) / pageSize));
            setError(null);
        } catch (err) {
            setError('Errore nel caricamento degli articoli');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (slug) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo articolo?')) {
            return;
        }

        try {
            await api.delete(`/blog/articles/${slug}/`);
            setArticles(articles.filter((article) => article.slug !== slug));
        } catch (err) {
            alert("Errore nell'eliminazione dell'articolo");
            console.error(err);
        }
    };

    return (
        <div className="max-w-[80vw] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestione Articoli</h1>
                <Link
                    to="/dashboard/articles/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Nuovo Articolo
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Cerca articoli..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-scroll">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[300px] w-[300px]">
                                Titolo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Slug
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tag Principale
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stato
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data Creazione
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Azioni
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {articles.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Nessun articolo trovato
                                </td>
                            </tr>
                        ) : (
                            articles.map((article) => (
                                <tr
                                    key={article.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 w-[300px] max-w-[300px]">
                                        <div className="text-sm font-medium text-gray-900 truncate overflow-hidden">
                                            {article.title.it}
                                        </div>
                                        <div className="text-sm font-medium italic text-gray-900 truncate overflow-hidden">
                                            {article.title.en}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {article.slug}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {article.category ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {article.category.display_name
                                                    ?.it ||
                                                    article.category
                                                        .display_name?.en ||
                                                    '-'}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {article.is_published ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Pubblicato
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Bozza
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(
                                            article.created_at
                                        ).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center">
                                        <Link
                                            to={`/dashboard/articles/edit/${article.slug}`}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                                />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(article.slug)
                                            }
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                        onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === 1
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        ← Precedente
                    </button>

                    <div className="flex items-center gap-2">
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Mostra solo alcune pagine per evitare troppi pulsanti
                            if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 &&
                                    pageNumber <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() =>
                                            setCurrentPage(pageNumber)
                                        }
                                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                            currentPage === pageNumber
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            } else if (
                                pageNumber === currentPage - 2 ||
                                pageNumber === currentPage + 2
                            ) {
                                return (
                                    <span
                                        key={pageNumber}
                                        className="text-gray-500"
                                    >
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                            )
                        }
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === totalPages
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        Successivo →
                    </button>
                </div>
            )}

            <div className="text-center text-sm text-gray-600 mt-4">
                {articles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
                {Math.min(currentPage * pageSize, totalCount)} ({totalCount})
            </div>
        </div>
    );
}
