import logoNavbar from '../../assets/images/logo-navbar.png';
import landingArm from '../../assets/images/landing-arm.png';

export default function Landing() {
    return (
        <div className="">
            <div className="bg-slate-600 pt-5 absolute top-0 left-0 w-full z-50">
                <nav className="flex justify-between items-center px-2 xl:px-8 py-4 bg-[rgba(46,46,51,0.2)] backdrop-blur-[25px] rounded-lg mx-2 xl:mx-8">
                    {/* Logo */}
                    <div className="flex items-center">
                        <img
                            src={logoNavbar}
                            alt="Supero Logo"
                            className="h-8"
                        />
                    </div>

                    {/* Navigation Menu */}
                    <div className="flex items-center xl:space-x-8 ">
                        <a
                            href="#about"
                            className="hidden xl:block text-white hover:text-supero-green transition-colors duration-200 text-[18px] relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-supero-green after:transition-all after:duration-200 hover:after:w-full"
                        >
                            About
                        </a>
                        <a
                            href="#applications"
                            className="hidden xl:block text-white hover:text-supero-green transition-colors duration-200 text-[18px] relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-supero-green after:transition-all after:duration-200 hover:after:w-full"
                        >
                            Applications
                        </a>
                        <a
                            href="#how-it-works"
                            className="hidden xl:block text-white hover:text-supero-green transition-colors duration-200 text-[18px] relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-supero-green after:transition-all after:duration-200 hover:after:w-full"
                        >
                            How it works
                        </a>
                        <a
                            href="#contact"
                            className="hidden xl:block text-white hover:text-supero-green transition-colors duration-200 text-[18px] relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-supero-green after:transition-all after:duration-200 hover:after:w-full"
                        >
                            Contact
                        </a>

                        <span className="hidden xl:block h-[24px] w-[2px] bg-white"></span>
                        <button className="bg-transparent text-white xl:px-6 py-2 hover:text-supero-green transition-all duration-200 font-medium flex items-center text-[16px] group">
                            <span>GET A DEMO</span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="ms-3"
                            >
                                <path
                                    d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                    fill="white"
                                    className=" group-hover:fill-supero-green"
                                />
                            </svg>
                        </button>
                    </div>
                </nav>
            </div>
            <header className="min-h-screen flex flex-col bg-slate-600 justify-end px-6 xl:px-12">
                <div>
                    <h2 className="text-white text-5xl md:text-6xl lg:text-[110px] font-semibold leading-tight">
                        Technology <br />
                        that{' '}
                        <span className="font-black md:text-7xl xl:text-[150px]">
                            works
                        </span>{' '}
                        <br /> for you
                    </h2>

                    <div className="mb-6 xl:mb-12 mt-8 xl:mt-48 flex flex-col xl:flex-row">
                        <button className="mb-4 xl:mb-0 xl:me-4 group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between">
                            <span className="relative z-10">
                                SEE AI IN ACTION
                            </span>

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
                                    />
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
                                    />
                                </svg>
                            </div>
                        </button>

                        <button className="group relative overflow-hidden bg-transparent text-white border border-white hover:bg-[#2E2E33]  hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between">
                            <span className="relative z-10">GET A DEMO</span>

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
                                    />
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
                                    />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <section className="bg-supero-dark-grey p-12 text-center">
                <p className="text-supero-mid-grey uppercase text-[20px]">
                    Why integrate smart robotics?
                </p>

                <h3
                    className="xl:text-[60px] font-semibold text-white"
                    style={{}}
                >
                    Working{' '}
                    <span className="text-supero-green font-black">
                        smarter
                    </span>{' '}
                    - not harder.
                </h3>

                <div
                    className="relative h-[700px]"
                    style={{
                        backgroundImage: `url(${landingArm})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center bottom',
                        /* backgroundAttachment: 'fixed', */
                    }}
                >
                    <div className="absolute top-12 left-24">prova</div>
                </div>

                <div
                    className="h-[700px]"
                    style={{
                        background:
                            'linear-gradient(-90deg, #60606f 0%, #424247 100%)',
                        clipPath:
                            'polygon(calc(100% - 200px) 0, 100% 200px, 100% 100%, 0 100%, 0 0)',
                    }}
                ></div>
            </section>
        </div>
    );
}

/*  */
