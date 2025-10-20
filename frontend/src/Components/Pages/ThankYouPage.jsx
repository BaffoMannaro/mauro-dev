import React from 'react';
import Footer from '../Landing/Footer';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
export default function ThankYouPage() {
    return (
        <>
            <div className="min-h-screen pt-24 bg-supero-dark-grey flex flex-col items-center justify-center bg-typ">
                <p className="title text-center">
                    Let's make <br /> technology <br />
                    <span className="font-black font-stretch-125 tracking-tight">
                        work
                    </span>
                </p>
                <div className="max-w-[600px] text-center mt-8">
                    <p className="mt-4 text-body-l text-white">
                        Thanks for reaching out to the Supero team.
                    </p>
                    <p className="mt-4 text-body-l text-white mb-12">
                        We’ll be in touch soon to explore how Supero’s robotics
                        and automation can power your next industrial evolution.
                    </p>

                    <Link
                        to={'/'}
                        href="#landing-form"
                        className="group  relative overflow-hidden bg-[#CCE535] hover:bg-transparent border border-supero-green hover:border-supero-green text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex xl:inline-flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between mx-auto xl:mx-0"
                    >
                        <span className="relative z-10">Learn more</span>

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
                    </Link>
                </div>
            </div>

            <Footer />
        </>
    );
}
