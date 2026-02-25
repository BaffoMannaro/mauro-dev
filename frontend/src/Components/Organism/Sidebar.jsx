import useAuthStore from '../../Stores/useAuthStore';
import SidebarLink from '../Atoms/SidebarLink';
import { useNavigate } from 'react-router';

export default function Sidebar() {
    const user = useAuthStore((state) => state.user);

    /* const open = useSidebarStore((state) => state.open); */
    const open = true;
    const navigate = useNavigate();

    /* const isAdmin = user.groups.includes('admin'); */
    console.log(user);

    const logout = useAuthStore((state) => state.logout);

    const logOut = async () => {
        /* setSidebar(false); */
        navigate('/');
        logout();
    };

    return (
        <div className="h-[100vh] p-4 overflow-y-auto  relative w-full">
            <div className="bg-slate-200 rounded-xl h-full">
                <ul className="space-y-2 font-medium pt-24">
                    <li>
                        <SidebarLink
                            path="dashboard"
                            icon="fa-home"
                            label="Dashboard"
                            open={open}
                        />
                    </li>

                    {user && (
                        <>
                            <li>
                                <SidebarLink
                                    path="dashboard/articles"
                                    icon="fa-newspaper"
                                    label="Articoli"
                                    open={open}
                                />
                            </li>
                            <li>
                                <SidebarLink
                                    path="dashboard/tags"
                                    icon="fa-tags"
                                    label="Tag"
                                    open={open}
                                />
                            </li>
                        </>
                    )}

                    {/* {user && user.groups && user.groups.includes('admin') && (
                    <>
                        <li>
                            <SidebarLink
                                path="dashboard/admin"
                                icon="fa-users"
                                label="Admin Only Page"
                                open={open}
                            />
                        </li>
                    </>
                )} */}
                </ul>

                <ul className="absolute bottom-12 ">
                    <li>
                        <button className="ms-2" onClick={logOut}>
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}
