import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import useAxios from '../../utils/useAxios';

// Validation schema
const tagValidationSchema = Yup.object({
    name: Yup.string()
        .required('Il nome interno è obbligatorio')
        .matches(/^[a-z0-9-]+$/, 'Solo minuscole, numeri e trattini'),
    display_name_it: Yup.string().required(
        'Il nome in italiano è obbligatorio'
    ),
    display_name_en: Yup.string().required('Il nome in inglese è obbligatorio'),
});

export default function TagsList() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const axios = useAxios();

    useEffect(() => {
        fetchTags();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/blog/tags/');
            setTags(response.data.results || response.data);
            setError(null);
        } catch (err) {
            setError('Errore nel caricamento dei tag');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo tag?')) {
            return;
        }

        try {
            await axios.delete(`/blog/tags/${id}/`);
            setTags(tags.filter((tag) => tag.id !== id));
        } catch (err) {
            alert("Errore nell'eliminazione del tag");
            console.error(err);
        }
    };

    const openModal = (tag = null) => {
        setEditingTag(tag);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTag(null);
    };

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            if (editingTag) {
                const response = await axios.put(
                    `/blog/tags/${editingTag.id}/`,
                    {
                        name: values.name,
                        display_name_it: values.display_name_it,
                        display_name_en: values.display_name_en,
                    }
                );
                setTags(
                    tags.map((tag) =>
                        tag.id === editingTag.id ? response.data : tag
                    )
                );
            } else {
                const response = await axios.post('/blog/tags/', {
                    name: values.name,
                    display_name_it: values.display_name_it,
                    display_name_en: values.display_name_en,
                });
                setTags([...tags, response.data]);
            }
            closeModal();
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                setErrors(err.response.data);
            } else {
                alert('Errore nel salvataggio del tag');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTags = tags.filter(
        (tag) =>
            tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tag.display_name?.it
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            tag.display_name?.en
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl">Caricamento...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestione Tag</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Nuovo Tag
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Cerca tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Nome Interno
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Nome IT
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Nome EN
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Azioni
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTags.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Nessun tag trovato
                                </td>
                            </tr>
                        ) : (
                            filteredTags.map((tag) => (
                                <tr
                                    key={tag.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {tag.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {tag.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {tag.display_name?.it || ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            {tag.display_name?.en || ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openModal(tag)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                        >
                                            edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tag.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal with Formik */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingTag ? 'Modifica Tag' : 'Nuovo Tag'}
                        </h2>

                        <Formik
                            initialValues={{
                                name: editingTag?.name || '',
                                display_name_it:
                                    editingTag?.display_name?.it || '',
                                display_name_en:
                                    editingTag?.display_name?.en || '',
                            }}
                            validationSchema={tagValidationSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ isSubmitting }) => (
                                <Form>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Nome Interno *
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                placeholder="es: tecnologia"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <ErrorMessage
                                                name="name"
                                                component="p"
                                                className="text-red-500 text-sm mt-1"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Minuscole, numeri e trattini
                                                (usato internamente)
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                🇮🇹 Nome Visualizzato (Italiano)
                                                *
                                            </label>
                                            <Field
                                                type="text"
                                                name="display_name_it"
                                                placeholder="es: Tecnologia"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <ErrorMessage
                                                name="display_name_it"
                                                component="p"
                                                className="text-red-500 text-sm mt-1"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                🇬🇧 Display Name (English) *
                                            </label>
                                            <Field
                                                type="text"
                                                name="display_name_en"
                                                placeholder="e.g.: Technology"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <ErrorMessage
                                                name="display_name_en"
                                                component="p"
                                                className="text-red-500 text-sm mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                                        >
                                            Annulla
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400"
                                        >
                                            {isSubmitting
                                                ? 'Salvataggio...'
                                                : editingTag
                                                  ? 'Aggiorna'
                                                  : 'Crea'}
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            )}
        </div>
    );
}
