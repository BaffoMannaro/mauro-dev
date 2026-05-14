import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Slider from 'react-slick';
import useAxios from '../../utils/useAxios';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export default function SuggestedArticles({ categoryId, excludeSlug }) {
    const [articles, setArticles] = useState([]);

    const [slidesToShow, setSlidesToShow] = useState(1);
    const { i18n } = useTranslation();
    const activeLang = i18n.resolvedLanguage;
    const api = useAxios();

    useEffect(() => {
        // Determina il numero iniziale di slide basato sulla larghezza
        const updateSlidesToShow = () => {
            if (typeof window !== 'undefined') {
                const width = window.innerWidth;
                if (width > 1200) {
                    setSlidesToShow(3.5);
                } else if (width > 768) {
                    setSlidesToShow(2);
                } else {
                    setSlidesToShow(1);
                }
            }
        };

        updateSlidesToShow();
        window.addEventListener('resize', updateSlidesToShow);

        return () => window.removeEventListener('resize', updateSlidesToShow);
    }, []);

    useEffect(() => {
        fetchSuggestedArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId, excludeSlug]);

    const fetchSuggestedArticles = async () => {
        if (!categoryId) {
            return;
        }

        try {
            let url = `/blog/articles/suggested/?category=${categoryId}`;
            if (excludeSlug) {
                url += `&exclude_slug=${excludeSlug}`;
            }
            const response = await api.get(url);
            setArticles(response.data || []);
        } catch (err) {
            console.error(
                'Errore nel caricamento degli articoli suggeriti',
                err
            );
        }
    };

    const sliderSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        initialSlide: 0,
        arrows: true,
        responsive: [
            {
                breakpoint: 1200,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    infinite: true,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: true,
                },
            },
        ],
    };

    if (!articles.length) {
        return null;
    }

    return (
        <div className="bg-[#434348]">
            <div className="max-w-7xl mx-auto py-12 px-4 xl:px-0 ">
                <h2 className="text-3xl font-bold text-white mb-8 uppercase ">
                    Discover more
                </h2>
                <div className="px-6">
                    <Slider {...sliderSettings}>
                        {articles.map((article) => (
                            <div key={article.id} className="px-2 ">
                                <div className="overflow-hidden group block max-w-[320px] mx-auto">
                                    {/* Article Image */}
                                    {article.main_image && (
                                        <Link
                                            to={`/articles/${article.slug}`}
                                            className="h-[200px]  w-full overflow-hidden relative"
                                        >
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
                                                <div className="relative w-6 h-6 overflow-hidden transform rotate-90">
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
                                                </div>
                                            </div>
                                        </Link>
                                    )}

                                    {/* Article Content */}
                                    <div className="py-6">
                                        {/* Category */}
                                        <div className="flex flex-wrap">
                                            {article.category && (
                                                <span className="bg-supero-green text-xs text-black px-3 py-1 border border-[#434348] me-2">
                                                    {article.category
                                                        .display_name?.[
                                                        activeLang
                                                    ] || '-'}
                                                </span>
                                            )}

                                            {article.tags?.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="border bg-[#626271] border-[#434348] text-xs text-white px-3 py-1 me-2 text-nowrap"
                                                >
                                                    {tag.display_name?.[
                                                        activeLang
                                                    ] || '-'}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-5">
                                            {article.title?.[activeLang] || '-'}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </div>
    );
}
