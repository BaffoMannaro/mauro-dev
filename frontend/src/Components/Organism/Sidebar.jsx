import ThemeSwitcher from '../Molecules/ThemeSwitcher';
import useAuthStore from '../../Stores/useAuthStore';
import useSidebarStore from '../../Stores/sidebarStore';
import SidebarLink from '../Atoms/SidebarLink';
import { useNavigate } from 'react-router';

import { Link } from 'react-router-dom';
import SidebarDropdown from '../Molecules/SidebarDropdown';

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
        <div className="h-[100vh] px-3 py-4 overflow-y-auto bg-primary-light-50 dark:bg-deep-space-2 relative">
            <div className="text-center text-black dark:text-white">
                <Link to="/dashboard/profile-page">
                    <i className="fal fa-user-circle fa-2x mb-0"></i>
                    <p
                        className={`p-2 mb-4 text-md ${!open && 'text-transparent'}`}
                    ></p>
                </Link>
            </div>

            <ul className="space-y-2 font-medium">
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
                            <SidebarDropdown
                                icon="fa-blog"
                                label="Blog"
                                open={open}
                            >
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
                            </SidebarDropdown>
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

            <ul className="absolute bottom-4">
                <li>
                    <button className="ms-2" onClick={logOut}>
                        Logout
                    </button>
                </li>
            </ul>
        </div>
    );
}
