import logoNavbar from '../../assets/images/logo-navbar.png';
import landingArm from '../../assets/images/landing-arm.png';
import product1 from '../../assets/images/product-1.png';
import product2 from '../../assets/images/product-2.png';
import LottieATF from '../Landing/LottieATF';
import { useState } from 'react';

import PartnersSection from '../Landing/PartnersSection';
import HowItWorks from '../Landing/HowItWorks';
import LandingForm from '../Landing/LandingForm';
import GetInTouch from '../Landing/GetInTouch';
import Footer from '../Landing/Footer';
import VideoSection from '../Landing/VideoSection';

export default function Landing() {
    const [activeAccordion, setActiveAccordion] = useState(false);

    const accordionItems = [
        {
            title: 'Advanced sensors',
            content:
                'High-precision 3D sensors ensure accurate surface analysis and consistent finishing quality.',
        },
        {
            title: 'Customised End-effectors',
            content:
                'Tailor-made tools adapt to complex surfaces and specific finishing needs.',
        },
        {
            title: 'Ease of use',
            content:
                'A user-friendly web interface makes setup, control, and monitoring simple and intuitive.',
        },
        {
            title: 'Artificial intelligence',
            content:
                'Smart algorithms generate robotic paths and adjust processes in real time.',
        },
    ];

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
                        <span className="font-extrabold inline-block group-hover:font-black group-hover:tracking-tight transition-all duration-300 font-stretch-125">
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

            <section className="bg-supero-dark-grey px-4 xl:px-12 pt-24 xl:text-center">
                <p className="text-supero-mid-grey uppercase text-[14px] xl:text-[20px] mb-6 xl:mb-0">
                    Why integrate smart robotics?
                </p>

                <h3 className="title" style={{}}>
                    Working <br className="xl:hidden" />
                    <span className="text-supero-green font-black font-stretch-125  tracking-tight">
                        smarter
                    </span>
                    <br className="xl:hidden" /> - not harder.
                </h3>

                <p className="mt-6 xl:mt-12 max-w-[600px] mx-auto text-left xl:text-center text-body-l">
                    From repetition to risk, production tasks can burden teams.{' '}
                    Supero integrates collaborative robots, 3D vision, and
                    easy-to-use software to automate processes—boosting quality,
                    throughput, and safety.
                </p>

                <div className="flex justify-center mt-6">
                    <button className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider w-full xl:w-[250px] justify-between">
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

                {/* mobile accordion */}
                <div className="xl:hidden px-0 py-8">
                    <div className="space-y-4">
                        {accordionItems.map((item, index) => (
                            <div key={index} className="">
                                <button
                                    className="w-full py-4 px-2 text-left flex justify-between items-center  bg-[rgba(98,98,113,0.3)] backdrop-blur-[5px] transition-all duration-300"
                                    onClick={() =>
                                        setActiveAccordion(
                                            activeAccordion === index
                                                ? -1
                                                : index
                                        )
                                    }
                                >
                                    <p className="text-[14px] text-supero-green font-bold uppercase px-2">
                                        {item.title}
                                    </p>
                                    <svg
                                        className={`w-5 h-5 text-white transition-transform duration-300 ${
                                            activeAccordion === index
                                                ? 'rotate-180'
                                                : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        activeAccordion === index
                                            ? 'max-h-96 opacity-100'
                                            : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="pb-4 px-2 bg-[rgba(98,98,113,0.3)] backdrop-blur-[5px] ">
                                        <p className="text-[14px] text-white leading-relaxed">
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="relative h-[700px] justify-center items-center top-20 hidden xl:flex"
                    style={{
                        backgroundImage: `url(${landingArm})`,
                        backgroundSize: '1200px 650px',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '50% 50%',
                    }}
                >
                    <div
                        className="absolute  w-[350px] group hover:bg-[rgba(98,98,113,0.3)] hover:backdrop-blur-[5px] p-4 transition-all duration-300"
                        style={{
                            transform: 'translate(-95%, -85%)',
                        }}
                    >
                        <div className="flex justify-between">
                            <p className="text-[24px] text-white font-bold uppercase group-hover:text-supero-green">
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
            <section className="bg-supero-dark-grey xl:px-12 pb-12">
                <div
                    className="h-auto relative"
                    style={{
                        background:
                            'linear-gradient(-90deg, #60606f 0%, #424247 100%)',
                    }}
                >
                    <div
                        className="absolute top-0 right-0 w-[50px] h-[50px] xl:w-[200px] xl:h-[200px] bg-supero-dark-grey"
                        style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }}
                    ></div>
                    <div className="w-full flex flex-wrap items-center">
                        <div className="w-full xl:w-1/2 order-2 xl:order-1">
                            <img
                                src={product1}
                                alt="robot arm"
                                className="transform xl:-translate-x-12 py-16"
                            />
                        </div>
                        <div className="w-full xl:w-1/2 order-1 xl:order-2 px-4 xl:px-0 pt-12 xl:pt-0">
                            <p className="title">
                                Developed <br /> to work, <br />
                                powered to <br />{' '}
                                <span className="font-black">perform.</span>
                            </p>

                            <p className="text-body-l text-[#BABABF] my-12 max-w-[570px]">
                                Supero's collaborative robotic stations bring
                                speed, consistency, and scalability to
                                manufacturing. From sanding and coating to
                                palletizing, they ensure higher quality, stable
                                throughput, and measurable efficiency—ready to
                                grow with your production needs.
                            </p>

                            <button className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between mx-auto xl:mx-0">
                                <span className="relative z-10">
                                    get a demo
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
                    </div>

                    <div className="w-full flex flex-wrap items-center pb-12 mb-24">
                        <div className="w-full xl:w-1/2 px-4 xl:px-12">
                            <p className="text-supero-mid-grey uppercase text-body-m mb-12">
                                what can you do with Supero today
                            </p>

                            <p className="title">
                                <span className="font-black block">
                                    Let it do
                                </span>
                                the dirty work.
                            </p>

                            <p className="text-body-l text-[#BABABF] my-12 max-w-[570px]">
                                Supero automates the heavy, repetitive tasks
                                that slow production down. With an intuitive
                                interface that guides every phase—from start to
                                stop—operators manage processes with ease. The
                                result: fewer errors, safer workflows, and
                                higher quality at scale.
                            </p>

                            <button className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between mx-auto xl:mx-0">
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

                            <div className="hidden xl:block">
                                <p className="text-supero-mid-grey uppercase text-[20px] mt-24">
                                    What will You do with supero tomorrow?
                                </p>

                                <p className="text-supero-mid-grey text-[20px]">
                                    Coating <span className="mx-2">|</span>{' '}
                                    Spraying <span className="mx-2">|</span>{' '}
                                    Palletising
                                </p>
                            </div>
                        </div>

                        <div className="w-full xl:w-1/2 px-12 pt-32">
                            <img
                                src={product2}
                                alt="robot arm"
                                className="block mx-auto"
                            />

                            <div className="xl:hidden">
                                <p className="text-supero-mid-grey uppercase text-body-m mt-24">
                                    What will You do with supero tomorrow?
                                </p>

                                <p className="text-supero-mid-grey text-body-s">
                                    Coating <span className="mx-2">|</span>{' '}
                                    Spraying <span className="mx-2">|</span>{' '}
                                    Palletising
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <VideoSection />
            <PartnersSection />

            <HowItWorks />
            <LandingForm />

            <GetInTouch />
            <Footer />
        </div>
    );
}

/*  */
