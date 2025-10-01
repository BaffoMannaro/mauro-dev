import ThemeSwitcher from '../Molecules/ThemeSwitcher';
import useAuthStore from '../../Stores/useAuthStore';
import useSidebarStore from '../../Stores/sidebarStore';
import SidebarLink from '../Atoms/SidebarLink';
import { useNavigate } from 'react-router';

import { Link } from 'react-router-dom';
import SidebarDropdown from '../Molecules/SidebarDropdown';

export default function Sidebar() {
    const user = useAuthStore((state) => state.user);
    const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
    /* const open = useSidebarStore((state) => state.open); */
    const open = true;
    const navigate = useNavigate();
    const setSidebar = useSidebarStore((state) => state.setSidebar);

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
            <pre>{JSON.stringify(user, null, 2)}</pre>
            <pre>{localStorage.getItem('rememberMe')}</pre>
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

                <li>
                    <SidebarLink
                        path="dashboard/get-post-test"
                        icon="fa-link"
                        label="Get Post Test"
                        open={open}
                    />
                </li>

                <li>
                    <SidebarLink
                        path="dashboard/layout"
                        icon="fa-link"
                        label="Layout"
                        open={open}
                    />
                </li>

                <li>
                    <SidebarLink
                        path="dashboard/charts"
                        icon="fa-link"
                        label="Charts"
                        open={open}
                    />
                </li>

                <li>
                    <SidebarDropdown
                        icon="fa-link"
                        label="UI Components"
                        open={open}
                    >
                        <li>
                            <SidebarLink
                                path="dashboard/buttons"
                                icon="fa-link"
                                label="Buttons"
                                open={open}
                            />
                        </li>
                        <li>
                            <SidebarLink
                                path="dashboard/cards"
                                icon="fa-link"
                                label="Cards"
                                open={open}
                            />
                        </li>
                        <li>
                            <SidebarLink
                                path="dashboard/typography"
                                icon="fa-link"
                                label="Typography"
                                open={open}
                            />
                        </li>
                        <li>
                            <SidebarLink
                                path="dashboard/steps"
                                icon="fa-link"
                                label="Stepper"
                                open={open}
                            />
                        </li>
                    </SidebarDropdown>
                </li>

                <li>
                    <SidebarLink
                        path="dashboard/form-recipes"
                        icon="fa-link"
                        label="Form Recipes"
                        open={open}
                    />
                </li>

                {user && user.groups.includes('admin') && (
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
                )}
            </ul>

            <ul className="absolute bottom-4">
                <li className="">
                    <ThemeSwitcher />
                </li>
                <li className="">
                    <button
                        className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={toggleSidebar}
                    >
                        {open ? (
                            <i className="fal fa-toggle-on text-gray-900 dark:text-white"></i>
                        ) : (
                            <i className="fal fa-toggle-off text-gray-900 dark:text-white"></i>
                        )}
                    </button>
                </li>

                <li>
                    <button className="ms-2" onClick={logOut}>
                        <i className="fal fa-sign-out text-gray-900 dark:text-white"></i>
                    </button>
                </li>
            </ul>
        </div>
    );
}
