import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
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
            toast.error('Errore nel caricamento dei tag');
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
            toast.error("Errore nell'eliminazione del tag");
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
            toast.error('Errore nel salvataggio del tag');
            if (err.response?.data) {
                setErrors(err.response.data);
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nome Interno
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nome IT
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nome EN
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Azioni
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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
                                <tr key={tag.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {tag.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {tag.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {tag.display_name?.it || ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {tag.display_name?.en || ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openModal(tag)}
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
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tag.id)}
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

            {/* Modal with Formik */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                                Nome Visualizzato (Italiano) *
                                            </label>
                                            <Field
                                                type="text"
                                                name="display_name_it"
                                                placeholder="es: Tecnologia"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <ErrorMessage
                                                name="display_name_it"
                                                component="p"
                                                className="text-red-500 text-sm mt-1"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Display Name (English) *
                                            </label>
                                            <Field
                                                type="text"
                                                name="display_name_en"
                                                placeholder="e.g.: Technology"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
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
