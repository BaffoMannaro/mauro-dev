import logoNavbar from '../../assets/images/logo-navbar.png';
import landingArm from '../../assets/images/landing-arm.png';
import product1 from '../../assets/images/product-1.png';
import product2 from '../../assets/images/product-2.png';
import LottieATF from '../Atoms/LottieATF';

import PartnersSection from '../Atoms/PartnersSection';

export default function Landing() {
    return (
        <div className="">
            <div className="w-full relative">
                <LottieATF />
            </div>
            <header
                className="min-h-screen flex flex-col  justify-end px-6 xl:px-12 relative overflow-x-hidden"
                style={{
                    background:
                        'linear-gradient(90deg, #626271 0%, #2E2E33 100%)',
                }}
            >
                <div className=" pt-5 absolute top-0 left-0 w-full z-[300]">
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
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 1,
                        width: '489px',
                        height: '472px',
                        right: '281px',
                        top: 'calc(50% - 472px/2 + 23px)',
                        background: 'rgba(255, 255, 255, 0.74)',

                        filter: 'blur(250px)',
                    }}
                ></div>

                <div className="relative z-[300]">
                    <h2 className="text-white text-5xl md:text-6xl lg:text-[110px] font-semibold leading-tight group">
                        Technology <br />
                        that{' '}
                        <span className="font-extrabold inline-block group-hover:font-black group-hover:tracking-tight transition-all duration-300">
                            works
                        </span>{' '}
                        <br /> for you
                    </h2>
                    <h1 className="text-supero-mid-grey uppercase text-[20px] my-12">
                        Supero – Robotics & Automation Solutions for Industry
                    </h1>
                    <div className="mb-6 xl:mb-12 flex flex-col xl:flex-row">
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

            <section className="bg-supero-dark-grey px-12 pt-24 text-center">
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
                    className="relative h-[700px] flex justify-center items-center top-20"
                    style={{
                        backgroundImage: `url(${landingArm})`,
                        backgroundSize: '1200px 650px',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '50% 50%',
                        /* backgroundAttachment: 'fixed', */
                    }}
                >
                    <div
                        className="absolute  w-[350px] group hover:bg-[rgba(98,98,113,0.3)] hover:backdrop-blur-[5px] p-4 transition-all duration-300"
                        style={{
                            transform: 'translate(-95%, -85%)',
                        }}
                    >
                        <div className="flex justify-between">
                            <p
                                className="text-[24px] text-white font-bold uppercase group-hover:text-supero-green"
                                style={{
                                    fontFeatureSettings: "'ss01' on",
                                    fontStretch: '80',
                                    fontVariationSettings: "'slnt' 0",
                                }}
                            >
                                Advanced sensors
                            </p>
                            <svg
                                width="35"
                                height="35"
                                viewBox="0 0 35 35"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4.37383 10.9345H2.18692V4.3738C2.18692 3.79379 2.41733 3.23755 2.82745 2.82742C3.23758 2.4173 3.79382 2.18689 4.37383 2.18689H10.9346V4.3738H4.37383V10.9345ZM10.9346 32.8036H4.37383C3.79382 32.8036 3.23758 32.5732 2.82745 32.1631C2.41733 31.753 2.18692 31.1967 2.18692 30.6167V24.056H4.37383V30.6167H10.9346V32.8036ZM30.6167 32.8036H24.056V30.6167H30.6167V24.056H32.8036V30.6167C32.8036 31.1967 32.5732 31.753 32.1631 32.1631C31.753 32.5732 31.1967 32.8036 30.6167 32.8036ZM32.8036 10.9345H30.6167V4.3738H24.056V2.18689H30.6167C31.1967 2.18689 31.753 2.4173 32.1631 2.82742C32.5732 3.23755 32.8036 3.79379 32.8036 4.3738V10.9345Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 8.75H16.4042V15.3107H18.5911V8.75Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 19.6845H16.4042V26.2453H18.5911V19.6845Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M26.2453 16.4042H19.6845V18.5911H26.2453V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M15.3107 16.4042H8.75V18.5911H15.3107V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                            </svg>
                        </div>
                        <div className="text-white mt-4 text-left w-[270px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            High-precision 3D sensors ensure accurate surface
                            analysis and consistent finishing quality.
                        </div>
                    </div>

                    <div
                        className="absolute w-[350px] group hover:bg-[rgba(98,98,113,0.3)] hover:backdrop-blur-[5px] p-4 transition-all duration-300"
                        style={{
                            transform: 'translate(-120%, 55%)',
                        }}
                    >
                        <div className="flex justify-between">
                            <p
                                className="text-[24px] text-white font-bold uppercase group-hover:text-supero-green text-left"
                                style={{
                                    fontFeatureSettings: "'ss01' on",
                                    fontStretch: '80',
                                    fontVariationSettings: "'slnt' 0",
                                }}
                            >
                                Customised <br /> End-effectors
                            </p>
                            <svg
                                width="35"
                                height="35"
                                viewBox="0 0 35 35"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4.37383 10.9345H2.18692V4.3738C2.18692 3.79379 2.41733 3.23755 2.82745 2.82742C3.23758 2.4173 3.79382 2.18689 4.37383 2.18689H10.9346V4.3738H4.37383V10.9345ZM10.9346 32.8036H4.37383C3.79382 32.8036 3.23758 32.5732 2.82745 32.1631C2.41733 31.753 2.18692 31.1967 2.18692 30.6167V24.056H4.37383V30.6167H10.9346V32.8036ZM30.6167 32.8036H24.056V30.6167H30.6167V24.056H32.8036V30.6167C32.8036 31.1967 32.5732 31.753 32.1631 32.1631C31.753 32.5732 31.1967 32.8036 30.6167 32.8036ZM32.8036 10.9345H30.6167V4.3738H24.056V2.18689H30.6167C31.1967 2.18689 31.753 2.4173 32.1631 2.82742C32.5732 3.23755 32.8036 3.79379 32.8036 4.3738V10.9345Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 8.75H16.4042V15.3107H18.5911V8.75Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 19.6845H16.4042V26.2453H18.5911V19.6845Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M26.2453 16.4042H19.6845V18.5911H26.2453V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M15.3107 16.4042H8.75V18.5911H15.3107V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                            </svg>
                        </div>
                        <div className="text-white mt-4 text-left w-[270px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Tailor-made tools adapt to complex surfaces and
                            specific finishing needs.
                        </div>
                    </div>

                    <div
                        className="absolute w-[350px] group hover:bg-[rgba(98,98,113,0.3)] hover:backdrop-blur-[5px] p-4 transition-all duration-300"
                        style={{
                            transform: 'translate(120%, 55%)',
                        }}
                    >
                        <div className="flex justify-between">
                            <svg
                                width="35"
                                height="35"
                                viewBox="0 0 35 35"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4.37383 10.9345H2.18692V4.3738C2.18692 3.79379 2.41733 3.23755 2.82745 2.82742C3.23758 2.4173 3.79382 2.18689 4.37383 2.18689H10.9346V4.3738H4.37383V10.9345ZM10.9346 32.8036H4.37383C3.79382 32.8036 3.23758 32.5732 2.82745 32.1631C2.41733 31.753 2.18692 31.1967 2.18692 30.6167V24.056H4.37383V30.6167H10.9346V32.8036ZM30.6167 32.8036H24.056V30.6167H30.6167V24.056H32.8036V30.6167C32.8036 31.1967 32.5732 31.753 32.1631 32.1631C31.753 32.5732 31.1967 32.8036 30.6167 32.8036ZM32.8036 10.9345H30.6167V4.3738H24.056V2.18689H30.6167C31.1967 2.18689 31.753 2.4173 32.1631 2.82742C32.5732 3.23755 32.8036 3.79379 32.8036 4.3738V10.9345Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 8.75H16.4042V15.3107H18.5911V8.75Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 19.6845H16.4042V26.2453H18.5911V19.6845Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M26.2453 16.4042H19.6845V18.5911H26.2453V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M15.3107 16.4042H8.75V18.5911H15.3107V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                            </svg>
                            <p
                                className="text-[24px] text-white font-bold uppercase group-hover:text-supero-green text-left"
                                style={{
                                    fontFeatureSettings: "'ss01' on",
                                    fontStretch: '80',
                                    fontVariationSettings: "'slnt' 0",
                                }}
                            >
                                Ease of use
                            </p>
                        </div>
                        <div className="text-white mt-4 text-left w-[270px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            A user-friendly web interface makes setup, control,
                            and monitoring simple and intuitive.
                        </div>
                    </div>

                    <div
                        className="absolute w-[350px] group hover:bg-[rgba(98,98,113,0.3)] hover:backdrop-blur-[5px] p-4 transition-all duration-300"
                        style={{
                            transform: 'translate(70%, -55%)',
                        }}
                    >
                        <div className="flex justify-between">
                            <svg
                                width="35"
                                height="35"
                                viewBox="0 0 35 35"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4.37383 10.9345H2.18692V4.3738C2.18692 3.79379 2.41733 3.23755 2.82745 2.82742C3.23758 2.4173 3.79382 2.18689 4.37383 2.18689H10.9346V4.3738H4.37383V10.9345ZM10.9346 32.8036H4.37383C3.79382 32.8036 3.23758 32.5732 2.82745 32.1631C2.41733 31.753 2.18692 31.1967 2.18692 30.6167V24.056H4.37383V30.6167H10.9346V32.8036ZM30.6167 32.8036H24.056V30.6167H30.6167V24.056H32.8036V30.6167C32.8036 31.1967 32.5732 31.753 32.1631 32.1631C31.753 32.5732 31.1967 32.8036 30.6167 32.8036ZM32.8036 10.9345H30.6167V4.3738H24.056V2.18689H30.6167C31.1967 2.18689 31.753 2.4173 32.1631 2.82742C32.5732 3.23755 32.8036 3.79379 32.8036 4.3738V10.9345Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 8.75H16.4042V15.3107H18.5911V8.75Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M18.5911 19.6845H16.4042V26.2453H18.5911V19.6845Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M26.2453 16.4042H19.6845V18.5911H26.2453V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                                <path
                                    d="M15.3107 16.4042H8.75V18.5911H15.3107V16.4042Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                            </svg>
                            <p
                                className="text-[24px] text-white font-bold uppercase group-hover:text-supero-green text-left"
                                style={{
                                    fontFeatureSettings: "'ss01' on",
                                    fontStretch: '80',
                                    fontVariationSettings: "'slnt' 0",
                                }}
                            >
                                Artificial <br /> intelligence
                            </p>
                        </div>
                        <div className="text-white mt-4 text-left w-[270px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Smart algorithms generate robotic paths and adjust
                            processes in real time.
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-supero-dark-grey px-12 pb-12">
                <div
                    className="h-auto relative"
                    style={{
                        background:
                            'linear-gradient(-90deg, #60606f 0%, #424247 100%)',
                        /* clipPath:
                            'polygon(calc(100% - 200px) 0, 100% 200px, 100% 100%, 0 100%, 0 0)', */
                    }}
                >
                    <div
                        className="absolute top-0 right-0 w-[200px] h-[200px] bg-supero-dark-grey"
                        style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }}
                    ></div>
                    <div className="w-full flex flex-wrap items-center pb-24">
                        <div className="w-1/2">
                            <img
                                src={product1}
                                alt="robot arm"
                                className="transform -translate-x-12 py-16"
                            />
                        </div>
                        <div className="w-1/2">
                            <p className="font-semibold text-[80px] text-white leading-[90%]">
                                Developed <br /> to work, <br />
                                powered to <br />{' '}
                                <span className="font-black">perform.</span>
                            </p>

                            <p className="text-[16px] text-[#BABABF] leading-[155%] my-12 max-w-[570px]">
                                Supero’s collaborative robotic stations bring
                                speed, consistency, and scalability to
                                manufacturing. From sanding and coating to
                                palletizing, they ensure higher quality, stable
                                throughput, and measurable efficiency—ready to
                                grow with your production needs.
                            </p>

                            <button className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between">
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
                        </div>

                        <div className="w-1/2 px-12 pt-32">
                            <p className="text-supero-mid-grey uppercase text-[20px] mb-12">
                                Why integrate smart robotics?
                            </p>

                            <p className="font-semibold text-[80px] text-white leading-[90%]">
                                <span className="font-black block">
                                    Let it do
                                </span>
                                the dirty work.
                            </p>

                            <p className="text-[16px] text-[#BABABF] leading-[155%] my-12 max-w-[570px]">
                                Supero automates the heavy, repetitive tasks
                                that slow production down. With an intuitive
                                interface that guides every phase—from start to
                                stop—operators manage processes with ease. The
                                result: fewer errors, safer workflows, and
                                higher quality at scale.
                            </p>

                            <button className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between">
                                <span className="relative z-10">
                                    GET A DEMO
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

                            <p className="text-supero-mid-grey uppercase text-[20px] mt-24">
                                What will You do with supero tomorrow?
                            </p>

                            <p className="text-supero-mid-grey text-[20px]">
                                Coating <span className="mx-2">|</span> Spraying{' '}
                                <span className="mx-2">|</span> Palletising
                            </p>
                        </div>

                        <div className="w-1/2 px-12 pt-32">
                            <img src={product2} alt="robot arm" />
                        </div>
                    </div>
                </div>
            </section>

            <PartnersSection />

            <section className="bg-red-500">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Adipisci, vero iusto! Ad dolorem iste praesentium placeat.
                Consequuntur sed adipisci quos harum impedit animi voluptatem
                officiis provident et laboriosam ipsum eveniet tempore labore,
                quod ducimus velit nesciunt rem dolorum assumenda quis vero!
                Tempore libero ipsam maxime. Reiciendis quaerat explicabo
                delectus maiores similique accusantium laboriosam labore saepe
                quae sunt dolorem fugit aperiam minus minima eos deserunt, eaque
                magnam doloribus, ipsa ab ex fuga blanditiis vitae voluptatum!
                Optio exercitationem necessitatibus laboriosam eveniet
                voluptates nihil id, dolorem assumenda sapiente recusandae
                asperiores aliquam itaque expedita labore? Voluptatibus,
                repellat? Unde similique fugiat, distinctio repellendus placeat
                voluptatem!
            </section>
        </div>
    );
}

/*  */
