import { useEffect, useState } from 'react';
import useAxios from '../../utils/useAxios';
import Button from '../Atoms/Button';
import { toast } from 'react-hot-toast';

const pageSize = 10;
export default function AdminPage() {
    const api = useAxios();
    const [data, setData] = useState();

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [sortField, setSortField] = useState('first_name');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);

    const [pageCount, setPageCount] = useState();

    const getData = async () => {
        try {
            let handPoint = '/users/?';

            handPoint += `&email=${email}&first_name=${firstName}&last_name=${lastName}&order_by=${sortField}&sort_order=${sortOrder}`;

            handPoint += `&page=${page}`;
            // handle pagination
            const response = await api.get(handPoint);
            console.log(response);
            setData(response.data.results);

            setPageCount(Math.ceil(response.data.count / pageSize));
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getData();
    }, [email, firstName, lastName, page]);

    useEffect(() => {
        setPage(1);
    }, [email, firstName, lastName]);

    const handlePage = (order) => {
        if (order === 'next') {
            setPage((prev) => prev + 1);
        } else {
            setPage((prev) => prev - 1);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await api.delete(`/users/${id}`);
            console.log(response);
            toast.success('User deleted!');
            getData();
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };
    return (
        <>
            <div className="flex justify-center mt-12">
                <div className="relative overflow-x-auto w-11/12 sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Id
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    <input
                                        type="text"
                                        value={firstName}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                        placeholder="First name"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    <input
                                        type="text"
                                        value={lastName}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                        placeholder="Last name"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    <input
                                        type="text"
                                        value={email}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="Email"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Groups
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Is Staff
                                </th>
                                <th scope="col" className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data &&
                                data.map((el) => {
                                    return (
                                        <tr
                                            key={el.id}
                                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                                        >
                                            <th
                                                scope="row"
                                                className="px-6 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                            >
                                                {el.id}
                                            </th>
                                            <th
                                                scope="row"
                                                className="px-6 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                            >
                                                {el.first_name}
                                            </th>
                                            <td className="px-6 py-2">
                                                {el.last_name}
                                            </td>
                                            <td className="px-6 py-2">
                                                {el.email}
                                            </td>
                                            <td className="px-6 py-2">
                                                {el.groups.join('-')}
                                            </td>
                                            <td className="px-6 py-2">
                                                {el.is_staff ? 'YES' : 'NO'}
                                            </td>
                                            <td className="px-6 py-2">
                                                <i
                                                    className="fas fa-trash"
                                                    onClick={() =>
                                                        handleDelete(el.id)
                                                    }
                                                ></i>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
            {pageCount > 0 && (
                <div className="mb-12 mt-24 flex w-full items-center justify-center">
                    {page > 1 && (
                        <Button
                            type="button"
                            label="Prev page"
                            onClick={() => handlePage('prev')}
                        />
                    )}

                    <span className="mx-4">
                        {page} / {pageCount}
                    </span>

                    {page < pageCount && (
                        <Button
                            type="button"
                            label="Next page"
                            onClick={() => handlePage('next')}
                        />
                    )}
                </div>
            )}
        </>
    );
}
