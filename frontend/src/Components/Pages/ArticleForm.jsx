import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import useAxios from '../../utils/useAxios';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Bold,
    Essentials,
    Italic,
    Paragraph,
    Undo,
    List,
    Alignment,
    FontColor,
    FontBackgroundColor,
    Heading,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const articleValidationSchema = Yup.object({
    title_it: Yup.string().required('Il titolo in italiano è obbligatorio'),
    title_en: Yup.string().required('Il titolo in inglese è obbligatorio'),
    slug: Yup.string().required('Lo slug è obbligatorio'),
    meta_title_it: Yup.string(),
    meta_title_en: Yup.string(),
    meta_description_it: Yup.string(),
    meta_description_en: Yup.string(),
    category: Yup.number().required('La categoria è obbligatoria'),
    tags: Yup.array().of(Yup.number()),
    is_published: Yup.boolean(),
    published_at: Yup.string()
        .nullable()
        .when('is_published', {
            is: true,
            then: (schema) =>
                schema.required(
                    "La data di pubblicazione è obbligatoria quando l'articolo è pubblicato"
                ),
            otherwise: (schema) => schema.nullable(),
        }),
    blocks: Yup.array().of(
        Yup.object({
            block_type: Yup.string().required(),
            content_it: Yup.string().when('block_type', {
                is: 'text',
                then: (schema) =>
                    schema.required(
                        'Il contenuto in italiano è obbligatorio per i blocchi di testo'
                    ),
                otherwise: (schema) => schema,
            }),
            content_en: Yup.string().when('block_type', {
                is: 'text',
                then: (schema) =>
                    schema.required(
                        'Il contenuto in inglese è obbligatorio per i blocchi di testo'
                    ),
                otherwise: (schema) => schema,
            }),
            order: Yup.number().required(),
        })
    ),
});

export default function ArticleForm() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const axios = useAxios();
    const isEditMode = !!slug;

    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mainImageFile, setMainImageFile] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [mainImageError, setMainImageError] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [initialValues, setInitialValues] = useState({
        title_it: '',
        title_en: '',
        slug: '',
        meta_title_it: '',
        meta_title_en: '',
        meta_description_it: '',
        meta_description_en: '',
        category: '',
        tags: [],
        is_published: false,
        published_at: '',
        blocks: [],
    });

    useEffect(() => {
        fetchCategories();
        fetchTags();
        if (isEditMode) {
            fetchArticle();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/blog/categories/');
            setCategories(response.data.results || response.data);
        } catch (err) {
            console.error('Errore nel caricamento delle categorie', err);
            toast.error('Errore nel caricamento delle categorie');
        }
    };

    const fetchTags = async () => {
        try {
            const response = await axios.get('/blog/tags/');
            setTags(response.data.results || response.data);
        } catch (err) {
            console.error('Errore nel caricamento dei tag', err);
            toast.error('Errore nel caricamento dei tag');
        }
    };

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/blog/articles/${slug}/`);
            const article = response.data;

            setInitialValues({
                title_it: article.title?.it || '',
                title_en: article.title?.en || '',
                slug: article.slug || '',
                meta_title_it: article.meta_title?.it || '',
                meta_title_en: article.meta_title?.en || '',
                meta_description_it: article.meta_description?.it || '',
                meta_description_en: article.meta_description?.en || '',
                category: article.category?.id || '',
                tags: article.tags?.map((t) => t.id) || [],
                is_published: article.is_published || false,
                published_at: article.published_at
                    ? article.published_at.split('T')[0]
                    : '',
                blocks:
                    article.blocks?.map((block) => ({
                        id: block.id,
                        _key: block.id || `temp-${Date.now()}-${Math.random()}`,
                        block_type: block.block_type,
                        content_it: block.content?.it || '',
                        content_en: block.content?.en || '',
                        order: block.order,
                        imageFile: null,
                        imagePreview: block.image
                            ? block.image.startsWith('http')
                                ? block.image
                                : `${BACKEND_URL}${block.image}`
                            : null,
                    })) || [],
            });

            if (article.main_image) {
                const imageUrl = article.main_image.startsWith('http')
                    ? article.main_image
                    : `${BACKEND_URL}${article.main_image}`;
                setMainImagePreview(imageUrl);
            }
        } catch (err) {
            console.error("Errore nel caricamento dell'articolo", err);
            toast.error("Errore nel caricamento dell'articolo");
        } finally {
            setLoading(false);
        }
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainImageFile(file);
            setMainImageError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setMainImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeMainImage = () => {
        setMainImageFile(null);
        setMainImagePreview(null);
    };

    const handleBlockImageChange = (index, file, setFieldValue, values) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedBlocks = [...values.blocks];
                updatedBlocks[index] = {
                    ...updatedBlocks[index],
                    imageFile: file,
                    imagePreview: reader.result,
                };
                setFieldValue('blocks', updatedBlocks);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        // Validate main image
        if (!mainImageFile && !mainImagePreview) {
            setMainImageError("L'immagine principale è obbligatoria");
            setSubmitting(false);
            return;
        }

        try {
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append('title_it', values.title_it);
            formDataToSend.append('title_en', values.title_en);
            formDataToSend.append('slug', values.slug);
            formDataToSend.append('meta_title_it', values.meta_title_it);
            formDataToSend.append('meta_title_en', values.meta_title_en);
            formDataToSend.append(
                'meta_description_it',
                values.meta_description_it
            );
            formDataToSend.append(
                'meta_description_en',
                values.meta_description_en
            );
            formDataToSend.append('is_published', values.is_published);

            if (values.category) {
                formDataToSend.append('category', values.category);
            }

            if (values.published_at) {
                formDataToSend.append(
                    'published_at',
                    `${values.published_at}T00:00:00Z`
                );
            }

            // Add tags
            values.tags.forEach((tagId) => {
                formDataToSend.append('tags', tagId);
            });

            // Add main_image if present
            if (mainImageFile) {
                formDataToSend.append('main_image', mainImageFile);
            }

            // Prepare blocks data
            const blocksData = values.blocks.map((block, idx) => ({
                block_type: block.block_type,
                content_it: block.content_it || '',
                content_en: block.content_en || '',
                order: idx,
            }));
            formDataToSend.append('blocks', JSON.stringify(blocksData));

            // Add block images
            values.blocks.forEach((block, idx) => {
                if (block.imageFile) {
                    formDataToSend.append(
                        `block_image_${idx}`,
                        block.imageFile
                    );
                }
            });

            if (isEditMode) {
                await axios.put(`/blog/articles/${slug}/`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await axios.post('/blog/articles/', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            navigate('/dashboard/articles');
        } catch (err) {
            console.error('Errore nel salvataggio', err);
            toast.error("Errore nel salvataggio dell'articolo");
            if (err.response?.data) {
                setErrors(err.response.data);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && isEditMode) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl">Caricamento...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {isEditMode ? 'Modifica Articolo' : 'Nuovo Articolo'}
                </h1>
            </div>

            <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={articleValidationSchema}
                onSubmit={handleSubmit}
            >
                {({ values, setFieldValue, isSubmitting }) => (
                    <Form className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                Informazioni di Base
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Titolo (Italiano) *
                                    </label>
                                    <Field
                                        type="text"
                                        name="title_it"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <ErrorMessage
                                        name="title_it"
                                        component="p"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Title (English) *
                                    </label>
                                    <Field
                                        type="text"
                                        name="title_en"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <ErrorMessage
                                        name="title_en"
                                        component="p"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Slug *
                                    </label>
                                    <Field
                                        type="text"
                                        name="slug"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <ErrorMessage
                                        name="slug"
                                        component="p"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SEO Section */}
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">SEO</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Meta Title (Italiano)
                                    </label>
                                    <Field
                                        type="text"
                                        name="meta_title_it"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Meta Title (English)
                                    </label>
                                    <Field
                                        type="text"
                                        name="meta_title_en"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Meta Description (Italiano)
                                    </label>
                                    <Field
                                        as="textarea"
                                        name="meta_description_it"
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Meta Description (English)
                                    </label>
                                    <Field
                                        as="textarea"
                                        name="meta_description_en"
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                Immagine Principale
                            </h2>

                            <div className="space-y-4">
                                {mainImagePreview && (
                                    <div className="relative inline-block">
                                        <img
                                            src={mainImagePreview}
                                            alt="Anteprima"
                                            className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeMainImage}
                                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Carica Immagine *
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleMainImageChange}
                                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                                    />
                                    {mainImageError && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {mainImageError}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Formati supportati: JPG, PNG, GIF, WebP
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Category and Tags */}
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                Categoria e Tag
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Categoria *
                                    </label>
                                    <Field
                                        as="select"
                                        name="category"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">
                                            Seleziona una categoria
                                        </option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.display_name?.it} /{' '}
                                                {category.display_name?.en}
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage
                                        name="category"
                                        component="p"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Tag
                                    </label>
                                    <Field
                                        as="select"
                                        name="tags"
                                        multiple
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        size="4"
                                    >
                                        {tags.map((tag) => (
                                            <option key={tag.id} value={tag.id}>
                                                {tag.display_name?.it} /{' '}
                                                {tag.display_name?.en}
                                            </option>
                                        ))}
                                    </Field>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tieni premuto Cmd/Ctrl per selezionare
                                        più tag
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Publishing */}
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                Pubblicazione
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Field
                                        type="checkbox"
                                        name="is_published"
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label className="ml-2 text-sm font-medium">
                                        Pubblica articolo
                                    </label>
                                </div>

                                {values.is_published && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Data di Pubblicazione *
                                        </label>
                                        <Field
                                            type="date"
                                            name="published_at"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <ErrorMessage
                                            name="published_at"
                                            component="p"
                                            className="text-red-500 text-sm mt-1"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Blocks */}
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    Contenuto (Blocchi)
                                </h2>
                                <div className="space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newBlock = {
                                                _key: `temp-${Date.now()}-${Math.random()}`,
                                                block_type: 'text',
                                                content_it: '',
                                                content_en: '',
                                                order: values.blocks.length,
                                                imageFile: null,
                                                imagePreview: null,
                                            };
                                            setFieldValue('blocks', [
                                                ...values.blocks,
                                                newBlock,
                                            ]);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                    >
                                        <i className="fas fa-plus mr-1"></i>{' '}
                                        Testo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newBlock = {
                                                _key: `temp-${Date.now()}-${Math.random()}`,
                                                block_type: 'image',
                                                content_it: '',
                                                content_en: '',
                                                order: values.blocks.length,
                                                imageFile: null,
                                                imagePreview: null,
                                            };
                                            setFieldValue('blocks', [
                                                ...values.blocks,
                                                newBlock,
                                            ]);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                    >
                                        <i className="fas fa-plus mr-1"></i>{' '}
                                        Immagine
                                    </button>
                                </div>
                            </div>

                            <FieldArray name="blocks">
                                {({ remove, move }) => (
                                    <div className="space-y-4">
                                        {values.blocks.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">
                                                Nessun blocco aggiunto. Clicca
                                                su &quot;Testo&quot; o
                                                &quot;Immagine&quot; per
                                                iniziare.
                                            </p>
                                        ) : (
                                            values.blocks.map(
                                                (block, index) => (
                                                    <div
                                                        key={
                                                            block._key ||
                                                            block.id ||
                                                            index
                                                        }
                                                        className="border border-gray-300 rounded-lg p-4"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="font-medium">
                                                                {block.block_type ===
                                                                'text' ? (
                                                                    <>
                                                                        <i className="fas fa-align-left mr-2"></i>
                                                                        Blocco
                                                                        Testo #
                                                                        {index +
                                                                            1}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="fas fa-image mr-2"></i>
                                                                        Blocco
                                                                        Immagine
                                                                        #
                                                                        {index +
                                                                            1}
                                                                    </>
                                                                )}
                                                            </span>
                                                            <div className="space-x-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        move(
                                                                            index,
                                                                            index -
                                                                                1
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        index ===
                                                                        0
                                                                    }
                                                                    className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                    title="Sposta su"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                        stroke="currentColor"
                                                                        className="size-6"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        move(
                                                                            index,
                                                                            index +
                                                                                1
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        index ===
                                                                        values
                                                                            .blocks
                                                                            .length -
                                                                            1
                                                                    }
                                                                    className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                    title="Sposta giù"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                        stroke="currentColor"
                                                                        className="size-6"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        remove(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="px-3 py-1  rounded text-sm font-medium"
                                                                    title="Rimuovi blocco"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
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
                                                            </div>
                                                        </div>

                                                        {block.block_type ===
                                                        'text' ? (
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-2">
                                                                        Contenuto
                                                                        (Italiano)
                                                                        *
                                                                    </label>
                                                                    <div className="editor-container editor-container_classic-editor">
                                                                        <div className="editor-container__editor text-black prose">
                                                                            <div>
                                                                                <CKEditor
                                                                                    onChange={(
                                                                                        event,
                                                                                        editor
                                                                                    ) => {
                                                                                        const data =
                                                                                            editor.getData();
                                                                                        setFieldValue(
                                                                                            `blocks[${index}].content_it`,
                                                                                            data
                                                                                        );
                                                                                    }}
                                                                                    editor={
                                                                                        ClassicEditor
                                                                                    }
                                                                                    config={{
                                                                                        plugins:
                                                                                            [
                                                                                                Essentials,
                                                                                                Bold,
                                                                                                Italic,
                                                                                                Paragraph,
                                                                                                Undo,
                                                                                                List,
                                                                                                Alignment,
                                                                                                FontColor,
                                                                                                FontBackgroundColor,
                                                                                                Heading,
                                                                                            ],
                                                                                        toolbar:
                                                                                            [
                                                                                                'undo',
                                                                                                'redo',
                                                                                                '|',
                                                                                                'heading',
                                                                                                '|',
                                                                                                'bold',
                                                                                                'italic',
                                                                                                '|',
                                                                                                'fontColor',
                                                                                                'fontBackgroundColor',
                                                                                                '|',
                                                                                                'bulletedList',
                                                                                                'numberedList',
                                                                                                '|',
                                                                                                'alignment',
                                                                                            ],
                                                                                        heading:
                                                                                            {
                                                                                                options:
                                                                                                    [
                                                                                                        {
                                                                                                            model: 'paragraph',
                                                                                                            title: 'Paragraph',
                                                                                                            class: 'ck-heading_paragraph',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading1',
                                                                                                            view: 'h1',
                                                                                                            title: 'Heading 1',
                                                                                                            class: 'ck-heading_heading1',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading2',
                                                                                                            view: 'h2',
                                                                                                            title: 'Heading 2',
                                                                                                            class: 'ck-heading_heading2',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading3',
                                                                                                            view: 'h3',
                                                                                                            title: 'Heading 3',
                                                                                                            class: 'ck-heading_heading3',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading4',
                                                                                                            view: 'h4',
                                                                                                            title: 'Heading 4',
                                                                                                            class: 'ck-heading_heading4',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading5',
                                                                                                            view: 'h5',
                                                                                                            title: 'Heading 5',
                                                                                                            class: 'ck-heading_heading5',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading6',
                                                                                                            view: 'h6',
                                                                                                            title: 'Heading 6',
                                                                                                            class: 'ck-heading_heading6',
                                                                                                        },
                                                                                                    ],
                                                                                            },
                                                                                        initialData:
                                                                                            values
                                                                                                .blocks[
                                                                                                index
                                                                                            ]
                                                                                                ?.content_it ||
                                                                                            '',
                                                                                        placeholder:
                                                                                            'Inserisci il contenuto HTML...',
                                                                                        disallowedContent:
                                                                                            'script; img[onerror]; *[onload]',
                                                                                        allowedContent:
                                                                                            'b i strong em ul ol li p',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <ErrorMessage
                                                                        name={`blocks[${index}].content_it`}
                                                                        component="p"
                                                                        className="text-red-500 text-sm mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-2">
                                                                        Content
                                                                        (English)
                                                                        *
                                                                    </label>
                                                                    <div className="editor-container editor-container_classic-editor">
                                                                        <div className="editor-container__editor text-black prose">
                                                                            <div>
                                                                                <CKEditor
                                                                                    onChange={(
                                                                                        event,
                                                                                        editor
                                                                                    ) => {
                                                                                        const data =
                                                                                            editor.getData();
                                                                                        setFieldValue(
                                                                                            `blocks[${index}].content_en`,
                                                                                            data
                                                                                        );
                                                                                    }}
                                                                                    editor={
                                                                                        ClassicEditor
                                                                                    }
                                                                                    config={{
                                                                                        plugins:
                                                                                            [
                                                                                                Essentials,
                                                                                                Bold,
                                                                                                Italic,
                                                                                                Paragraph,
                                                                                                Undo,
                                                                                                List,
                                                                                                Alignment,
                                                                                                FontColor,
                                                                                                FontBackgroundColor,
                                                                                                Heading,
                                                                                            ],
                                                                                        toolbar:
                                                                                            [
                                                                                                'undo',
                                                                                                'redo',
                                                                                                '|',
                                                                                                'heading',
                                                                                                '|',
                                                                                                'bold',
                                                                                                'italic',
                                                                                                '|',
                                                                                                'fontColor',
                                                                                                'fontBackgroundColor',
                                                                                                '|',
                                                                                                'bulletedList',
                                                                                                'numberedList',
                                                                                                '|',
                                                                                                'alignment',
                                                                                            ],
                                                                                        heading:
                                                                                            {
                                                                                                options:
                                                                                                    [
                                                                                                        {
                                                                                                            model: 'paragraph',
                                                                                                            title: 'Paragraph',
                                                                                                            class: 'ck-heading_paragraph',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading1',
                                                                                                            view: 'h1',
                                                                                                            title: 'Heading 1',
                                                                                                            class: 'ck-heading_heading1',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading2',
                                                                                                            view: 'h2',
                                                                                                            title: 'Heading 2',
                                                                                                            class: 'ck-heading_heading2',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading3',
                                                                                                            view: 'h3',
                                                                                                            title: 'Heading 3',
                                                                                                            class: 'ck-heading_heading3',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading4',
                                                                                                            view: 'h4',
                                                                                                            title: 'Heading 4',
                                                                                                            class: 'ck-heading_heading4',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading5',
                                                                                                            view: 'h5',
                                                                                                            title: 'Heading 5',
                                                                                                            class: 'ck-heading_heading5',
                                                                                                        },
                                                                                                        {
                                                                                                            model: 'heading6',
                                                                                                            view: 'h6',
                                                                                                            title: 'Heading 6',
                                                                                                            class: 'ck-heading_heading6',
                                                                                                        },
                                                                                                    ],
                                                                                            },
                                                                                        initialData:
                                                                                            values
                                                                                                .blocks[
                                                                                                index
                                                                                            ]
                                                                                                ?.content_en ||
                                                                                            '',
                                                                                        placeholder:
                                                                                            'Enter HTML content...',
                                                                                        disallowedContent:
                                                                                            'script; img[onerror]; *[onload]',
                                                                                        allowedContent:
                                                                                            'b i strong em ul ol li p',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <ErrorMessage
                                                                        name={`blocks[${index}].content_en`}
                                                                        component="p"
                                                                        className="text-red-500 text-sm mt-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {block.imagePreview && (
                                                                    <div className="relative inline-block">
                                                                        <img
                                                                            src={
                                                                                block.imagePreview
                                                                            }
                                                                            alt="Anteprima blocco"
                                                                            className="max-w-xs max-h-32 rounded-lg border border-gray-300"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-2">
                                                                        Carica
                                                                        Immagine
                                                                    </label>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleBlockImageChange(
                                                                                index,
                                                                                e
                                                                                    .target
                                                                                    .files[0],
                                                                                setFieldValue,
                                                                                values
                                                                            )
                                                                        }
                                                                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                )}
                            </FieldArray>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                            <div>
                                {!values.is_published && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewData(values);
                                            setIsPreviewOpen(true);
                                        }}
                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                                    >
                                        <i className="fas fa-eye mr-2"></i>
                                        Preview
                                    </button>
                                )}
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate('/dashboard/articles')
                                    }
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400"
                                >
                                    {isSubmitting
                                        ? 'Salvataggio...'
                                        : isEditMode
                                          ? 'Aggiorna'
                                          : 'Crea'}
                                </button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>

            {/* Preview Modal */}
            {isPreviewOpen && previewData && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1a1a1a]">
                    {/* Close Button */}
                    <button
                        onClick={() => setIsPreviewOpen(false)}
                        className="fixed top-4 right-4 z-50 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
                        aria-label="Chiudi preview"
                    >
                        Chiudi preview
                    </button>

                    <div className="py-12 px-4 sm:px-6 pt-48">
                        <div className="max-w-5xl mx-auto">
                            {/* Category and Tags */}
                            <div className="flex items-center justify-center mb-12">
                                {previewData.category && (
                                    <span className="bg-supero-green text-black px-3 py-1 border border-supero-green me-2">
                                        {categories.find(
                                            (c) => c.id == previewData.category
                                        )?.display_name?.it || 'Categoria'}
                                    </span>
                                )}

                                {previewData.tags?.map((tagId) => {
                                    const tag = tags.find((t) => t.id == tagId);
                                    return tag ? (
                                        <span
                                            key={tag.id}
                                            className="border border-[#434348] text-white px-3 py-1 me-2"
                                        >
                                            {tag.display_name?.it || '-'}
                                        </span>
                                    ) : null;
                                })}
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl text-center font-bold text-white mb-4">
                                {previewData.title_it || 'Titolo articolo'}
                            </h1>

                            {/* Date */}
                            {previewData.published_at && (
                                <p className="text-white text-center my-16">
                                    {new Date(
                                        previewData.published_at
                                    ).toLocaleDateString('it-IT', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            )}
                        </div>

                        {/* Main Image */}
                        {mainImagePreview && (
                            <div className="w-full xl:max-w-6xl mx-auto overflow-hidden mb-12 px-12 xl:px-0">
                                <img
                                    src={mainImagePreview}
                                    alt={
                                        previewData.title_it ||
                                        'Immagine principale'
                                    }
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Article Content */}
                        <article className="max-w-5xl mx-auto">
                            <div className="p-8">
                                <div className="prose prose-lg max-w-none">
                                    {previewData.blocks?.map((block, index) => (
                                        <div
                                            key={block._key || index}
                                            className="mb-6"
                                        >
                                            {block.block_type === 'text' ? (
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            block.content_it ||
                                                            '',
                                                    }}
                                                    className="text-gray-200"
                                                />
                                            ) : (
                                                <div className="my-8">
                                                    {block.imagePreview && (
                                                        <img
                                                            src={
                                                                block.imagePreview
                                                            }
                                                            alt={`Immagine blocco ${index + 1}`}
                                                            className="w-full"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            )}
        </div>
    );
}
