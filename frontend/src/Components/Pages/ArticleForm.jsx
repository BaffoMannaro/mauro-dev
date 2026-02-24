import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
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

const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Validation Schema
const articleValidationSchema = Yup.object({
    title_it: Yup.string().required('Il titolo in italiano è obbligatorio'),
    title_en: Yup.string().required('Il titolo in inglese è obbligatorio'),
    slug: Yup.string().required('Lo slug è obbligatorio'),
    meta_title_it: Yup.string(),
    meta_title_en: Yup.string(),
    meta_description_it: Yup.string(),
    meta_description_en: Yup.string(),
    main_tag: Yup.number().nullable(),
    other_tags: Yup.array().of(Yup.number()),
    is_published: Yup.boolean(),
    published_at: Yup.string().nullable(),
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

    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mainImageFile, setMainImageFile] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [initialValues, setInitialValues] = useState({
        title_it: '',
        title_en: '',
        slug: '',
        meta_title_it: '',
        meta_title_en: '',
        meta_description_it: '',
        meta_description_en: '',
        main_tag: '',
        other_tags: [],
        is_published: false,
        published_at: '',
        blocks: [],
    });

    useEffect(() => {
        fetchTags();
        if (isEditMode) {
            fetchArticle();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const fetchTags = async () => {
        try {
            const response = await axios.get('/blog/tags/');
            setTags(response.data.results || response.data);
        } catch (err) {
            console.error('Errore nel caricamento dei tag', err);
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
                main_tag: article.main_tag?.id || '',
                other_tags: article.other_tags?.map((t) => t.id) || [],
                is_published: article.is_published || false,
                published_at: article.published_at
                    ? article.published_at.split('T')[0]
                    : '',
                blocks:
                    article.blocks?.map((block) => ({
                        id: block.id,
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
            alert("Errore nel caricamento dell'articolo");
        } finally {
            setLoading(false);
        }
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainImageFile(file);
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

            if (values.main_tag) {
                formDataToSend.append('main_tag', values.main_tag);
            }

            if (values.published_at) {
                formDataToSend.append(
                    'published_at',
                    `${values.published_at}T00:00:00Z`
                );
            }

            // Add other_tags
            values.other_tags.forEach((tagId) => {
                formDataToSend.append('other_tags', tagId);
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
            if (err.response?.data) {
                setErrors(err.response.data);
            }
            alert("Errore nel salvataggio dell'articolo");
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
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <ErrorMessage
                                        name="title_it"
                                        component="p"
                                        className="text-red-500 text-sm mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        🇬 Title (English) *
                                    </label>
                                    <Field
                                        type="text"
                                        name="title_en"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
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
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">SEO</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        🇮🇹 Meta Title (Italiano)
                                    </label>
                                    <Field
                                        type="text"
                                        name="meta_title_it"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        🇬🇧 Meta Title (English)
                                    </label>
                                    <Field
                                        type="text"
                                        name="meta_title_en"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        🇮🇹 Meta Description (Italiano)
                                    </label>
                                    <Field
                                        as="textarea"
                                        name="meta_description_it"
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        🇬🇧 Meta Description (English)
                                    </label>
                                    <Field
                                        as="textarea"
                                        name="meta_description_en"
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
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
                                        Carica Immagine
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleMainImageChange}
                                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Formati supportati: JPG, PNG, GIF, WebP
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Tag</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Tag Principale
                                    </label>
                                    <Field
                                        as="select"
                                        name="main_tag"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="">
                                            Seleziona un tag
                                        </option>
                                        {tags.map((tag) => (
                                            <option key={tag.id} value={tag.id}>
                                                {tag.display_name?.it} /{' '}
                                                {tag.display_name?.en}
                                            </option>
                                        ))}
                                    </Field>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Altri Tag
                                    </label>
                                    <Field
                                        as="select"
                                        name="other_tags"
                                        multiple
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
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
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
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
                                            Data di Pubblicazione
                                        </label>
                                        <Field
                                            type="date"
                                            name="published_at"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Blocks */}
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    Contenuto (Blocchi)
                                </h2>
                                <div className="space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newBlock = {
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
                                                        key={index}
                                                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-4"
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
                                                                    className="text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                                                                >
                                                                    ↑
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
                                                                    className="text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                                                                >
                                                                    ↓
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        remove(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {block.block_type ===
                                                        'text' ? (
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-2">
                                                                        🇮🇹
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
                                                                        🇬🇧
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
                                                                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
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
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard/articles')}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
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
                    </Form>
                )}
            </Formik>
        </div>
    );
}
