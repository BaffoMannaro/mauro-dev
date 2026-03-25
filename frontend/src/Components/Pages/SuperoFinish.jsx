import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../Molecules/Navbar';
import VariableProximity from '../Landing/VariableProximity';
import { useTranslation } from 'react-i18next';
import step0 from '../../assets/finish/step-0.png';
import step1 from '../../assets/finish/step-1.png';
import step2 from '../../assets/finish/step-2.png';
import step3 from '../../assets/finish/step-3.png';
import step4 from '../../assets/finish/step-4.png';
import superoos from '../../assets/finish/supero-os.png';
import scanVideo from '../../assets/finish/01-scan.mp4';
import pathVideo from '../../assets/finish/02-path.mp4';
import workVideo from '../../assets/finish/03-work.mp4';
import switchVideo from '../../assets/finish/04-switch.mp4';

import VideoSectionFinish from '../Landing/VideoSectionFinish';
import Footer from '../Landing/Footer';
import GetInTouch from '../Landing/GetInTouch';
import PartnersSectionFinish from '../Landing/PartnersSectionFinish';
import Applications from '../Landing/Applications';
import SuggestedArticles from '../Molecules/SuggestedArticles';
import LandingForm from '../Landing/LandingForm';

export default function SuperoFinish() {
    const [step, setStep] = useState(0);
    const [playingVideo, setPlayingVideo] = useState(null);

    const containerRef = useRef(null);
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);
    const video3Ref = useRef(null);
    const video4Ref = useRef(null);

    const { t } = useTranslation();

    const handleVideoToggle = (videoNumber) => {
        const refs = [video1Ref, video2Ref, video3Ref, video4Ref];

        // Pause all videos
        refs.forEach((ref) => {
            if (ref.current && !ref.current.paused) {
                ref.current.pause();
            }
        });

        // If clicking on a different video, play it
        if (playingVideo !== videoNumber) {
            const currentRef = refs[videoNumber - 1];
            if (currentRef.current) {
                currentRef.current.play();
                setPlayingVideo(videoNumber);
            }
        } else {
            // If clicking on the same video, just pause it
            setPlayingVideo(null);
        }
    };

    return (
        <>
            <style>{`
                .clip-top-right {
                    clip-path: polygon(calc(100% - 80px) 0, 100% calc(80px), 100% 100%, 0 100%, 0 0);
                }
                @media (min-width: 1280px) {
                    .clip-top-left-xl {
                        clip-path: polygon(80px 0, 100% 0, 100% 100%, 0 100%, 0 80px);
                    }
                }
            `}</style>
            <Helmet>
                <title>SUPERO Finish</title>
                <link
                    rel="canonical"
                    href="https://superotech.ai/supero-finish"
                />
                <meta
                    name="description"
                    content="Discover the SUPERO Finish, a revolutionary approach to surface finishing technology and industrial automation."
                />
                <meta property="og:title" content="SUPERO Finish" />
                <meta
                    property="og:description"
                    content="Discover the SUPERO Finish, a revolutionary approach to surface finishing technology and industrial automation."
                />
                <meta
                    property="og:url"
                    content="https://superotech.ai/supero-finish"
                />
                <meta property="og:type" content="website" />
            </Helmet>
            <Navbar />

            <div className="h-[100vh] xl:h-[100vh] flex flex-wrap items-center pt-2  xl:pt-32 pb-6 xl:py-6 relative bg-supero-finish">
                <div className="absolute z-[300] bottom-0 right-0 px-4">
                    <div
                        className="relative max-w-[300px] xl:max-w-[700px]"
                        ref={containerRef}
                    >
                        <VariableProximity
                            label={'Supero \n Finish'}
                            className={
                                'text-white text-6xl md:text-6xl lg:text-[110px] font-semibold leading-[48px] 2xl:leading-[110px] lett'
                            }
                            style={{
                                letterSpacing: '-4px',
                            }}
                            fromFontVariationSettings="'wght' 600, 'opsz' 9"
                            toFontVariationSettings="'wght' 1000, 'opsz' 40"
                            containerRef={containerRef}
                            radius={100}
                            falloff="linear"
                        />
                    </div>
                    <h1
                        className="text-white font-bold uppercase text-[20px] mb-24 whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                            __html: t('payoff_supero_finish'),
                        }}
                    ></h1>
                    <div className="mb-6 xl:mb-12 flex flex-col xl:flex-row">
                        <a
                            href="#video-finish"
                            className="mb-4 xl:mb-0 xl:me-4 group relative overflow-hidden bg-[#CCE535] hover:bg-transparent border border-supero-green hover:border-supero-green text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between"
                        >
                            <span className="relative z-10">
                                get a live demo
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
                        </a>

                        <a
                            href="#"
                            className="mb-4 xl:mb-0 xl:me-4 group relative overflow-hidden bg-white hover:bg-transparent border border-white hover:border-supero-green text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between"
                        >
                            <span className="relative z-10">
                                download datasheet
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
                        </a>
                    </div>
                </div>
            </div>

            <section className=" bg-supero-dark-grey px-4 xl:px-12 pt-24 xl:text-center">
                <p className="text-supero-mid-grey uppercase text-body-l mb-6 xl:mb-12">
                    l'hardware - the body
                </p>

                <h3 className="title" style={{}}>
                    Tecnologia <br /> d'avanguardia integrata
                </h3>

                <div className="flex items-center flex-col xl:flex-row min-h-screen ">
                    <div className="w-full xl:w-1/2 order-2 xl:order-1 relative h-[500px] xl:h-[800px]">
                        <img
                            src={superoos}
                            alt=""
                            className={
                                'max-h-full absolute top-[60px] -right-4 xl:right-0 transition-opacity duration-500 scale-50 xl:scale-100 ' +
                                (step === 0 ? 'opacity-100' : 'opacity-0')
                            }
                        />
                        <img
                            src={step0}
                            alt=""
                            className={
                                'max-h-full absolute bottom-0 right-0 transition-opacity duration-500 ' +
                                (step === 0 ? 'opacity-100' : 'opacity-20')
                            }
                        />

                        <img
                            src={step1}
                            alt=""
                            className={
                                'max-h-full absolute bottom-0 right-0 transition-opacity duration-500  ' +
                                (step === 1 ? 'opacity-100' : 'opacity-0')
                            }
                        />
                        <img
                            src={step2}
                            alt=""
                            className={
                                'max-h-full absolute bottom-0 right-0 transition-opacity duration-500  ' +
                                (step === 2 ? 'opacity-100' : 'opacity-0')
                            }
                        />
                        <img
                            src={step3}
                            alt=""
                            className={
                                'max-h-full absolute bottom-0 right-0 transition-opacity duration-500  ' +
                                (step === 3 ? 'opacity-100' : 'opacity-0')
                            }
                        />
                        <img
                            src={step4}
                            alt=""
                            className={
                                'max-h-full absolute bottom-0 right-0 transition-opacity duration-500  ' +
                                (step === 4 ? 'opacity-100' : 'opacity-0')
                            }
                        />
                    </div>
                    <div className="w-full xl:w-1/2 order-1 xl:order-2 h-[500px] xl:h-[800px] flex flex-col justify-center ">
                        <div className="h-24 w-full flex flex-col items-center justify-end">
                            <button
                                className={
                                    step > 0
                                        ? 'w-32 px-4 py-2 flex justify-center'
                                        : 'hidden'
                                }
                                onClick={() => {
                                    setStep((prev) => prev - 1);
                                }}
                            >
                                <svg
                                    width="29"
                                    height="16"
                                    viewBox="0 0 29 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M0.000442743 12.0708L10.607 1.46416C11.5447 0.526475 12.8165 -0.000309663 14.1426 -0.000309663C15.4687 -0.000309663 16.7404 0.526475 17.6781 1.46416L28.2847 12.0708L24.7492 15.6063L14.1426 4.99969L3.53598 15.6063L0.000442743 12.0708Z"
                                        fill="white"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="xl:max-w-[440px] mx-auto text-left ">
                            {(step === 0 && (
                                <div>
                                    <h2 className="text-white text-3xl font-bold mb-4">
                                        {t('steps.step_0.title')}
                                    </h2>
                                    <p className="text-supero-mid-grey whitespace-pre-line text-">
                                        {t('steps.step_0.description')}
                                    </p>
                                </div>
                            )) ||
                                (step === 1 && (
                                    <div>
                                        <h2 className="text-white text-3xl whitespace-pre-line font-bold mt-4 mb-4">
                                            {t('steps.step_1.title')}
                                        </h2>
                                        <p className="text-supero-mid-grey text-">
                                            {t('steps.step_1.description')}
                                        </p>
                                    </div>
                                )) ||
                                (step === 2 && (
                                    <div>
                                        <h2 className="text-white text-3xl whitespace-pre-line font-bold mt-4 mb-4">
                                            {t('steps.step_2.title')}
                                        </h2>{' '}
                                        <p className="text-supero-mid-grey text-">
                                            {t('steps.step_2.description')}
                                        </p>
                                    </div>
                                )) ||
                                (step === 3 && (
                                    <div>
                                        <h2 className="text-white text-3xl whitespace-pre-line font-bold mt-4 mb-4">
                                            {t('steps.step_3.title')}
                                        </h2>
                                        <p className="text-supero-mid-grey text-">
                                            {t('steps.step_3.description')}
                                        </p>
                                    </div>
                                )) ||
                                (step === 4 && (
                                    <div>
                                        <h2 className="text-white text-3xl whitespace-pre-line font-bold mt-4 mb-4">
                                            {t('steps.step_4.title')}
                                        </h2>
                                        <p className="text-supero-mid-grey text-">
                                            {t('steps.step_4.description')}
                                        </p>
                                    </div>
                                ))}
                        </div>

                        <div className="h-24 w-full flex flex-col items-center justify-end">
                            <button
                                className={
                                    step < 4
                                        ? 'w-32 px-4 py-2 flex justify-center'
                                        : 'hidden'
                                }
                                onClick={() => {
                                    setStep((prev) => prev + 1);
                                }}
                            >
                                <svg
                                    width="29"
                                    height="16"
                                    viewBox="0 0 29 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M0.000442743 3.53471L10.607 14.1413C11.5447 15.079 12.8165 15.6058 14.1426 15.6058C15.4687 15.6058 16.7404 15.079 17.6781 14.1413L28.2847 3.53471L24.7492 -0.000822362L14.1426 10.6058L3.53598 -0.000822362L0.000442743 3.53471Z"
                                        fill="white"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className=" bg-gradient-to-r from-[#424247] to-[#60606f] px-6 xl:px-24 2xl:px-36 pt-24 xl:text-center">
                <p className="text-supero-mid-grey uppercase text-body-l mb-6 xl:mb-12">
                    workflow
                </p>

                <h3 className="title mb-12">
                    <span className="text-supero-green">4</span>{' '}
                    {t('step_section.title')}
                </h3>

                <div className="flex flex-wrap mb-12 xl:mb-24">
                    <div className="w-full xl:w-3/5 relative order-1">
                        <button
                            className="absolute left-4 top-4 z-10 h-12 w-12 bg-supero-green rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all"
                            onClick={() => handleVideoToggle(1)}
                        >
                            {playingVideo === 1 ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="size-6 text-supero-dark-grey"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="size-6 text-supero-dark-grey"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                                    />
                                </svg>
                            )}
                        </button>
                        <video
                            ref={video1Ref}
                            className="w-full max-w-[800px] object-contain mb-6 xl:mb-0 clip-top-right"
                            src={scanVideo}
                            controlsList="nodownload"
                            playsInline
                            onEnded={() => setPlayingVideo(null)}
                        />
                    </div>
                    <div className="w-full xl:w-2/5 order-2 text-left xl:max-w-[400px] xl:mx-auto">
                        <p className="text-supero-green font-semibold text-sm">
                            STEP 1
                        </p>
                        <p className="text-white text-5xl font-semibold">
                            Scan
                        </p>

                        <p className="text-supero-mid-grey whitespace-pre-line mt-4 text-sm">
                            {t('step_section.scan')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap mb-12 xl:mb-24">
                    <div className="w-full xl:w-3/5 relative order-1 xl:order-2">
                        <div className="relative">
                            <button
                                className="absolute left-4 xl:left-auto xl:right-4 top-4 z-10 h-12 w-12 bg-supero-green rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all"
                                onClick={() => handleVideoToggle(2)}
                            >
                                {playingVideo === 2 ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-6 text-supero-dark-grey"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-6 text-supero-dark-grey"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                                        />
                                    </svg>
                                )}
                            </button>
                            <video
                                ref={video2Ref}
                                className="w-full max-w-[800px] object-contain mb-6 xl:mb-0 clip-top-right clip-top-left-xl xl:ms-auto"
                                src={pathVideo}
                                controlsList="nodownload"
                                playsInline
                                onEnded={() => setPlayingVideo(null)}
                            />
                        </div>
                    </div>
                    <div className="w-full xl:w-2/5 order-2 xl:order-1 text-left xl:max-w-[400px] xl:mx-auto">
                        <p className="text-supero-green font-semibold text-sm">
                            STEP 2
                        </p>
                        <p className="text-white text-5xl font-semibold">
                            Path
                        </p>

                        <p className="text-supero-mid-grey whitespace-pre-line mt-4 text-sm">
                            {t('step_section.path')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap mb-12 xl:mb-24">
                    <div className="w-full xl:w-3/5 relative order-1">
                        <button
                            className="absolute left-4 top-4 z-10 h-12 w-12 bg-supero-green rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all"
                            onClick={() => handleVideoToggle(3)}
                        >
                            {playingVideo === 3 ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="size-6 text-supero-dark-grey"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="size-6 text-supero-dark-grey"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                                    />
                                </svg>
                            )}
                        </button>
                        <video
                            ref={video3Ref}
                            className="w-full max-w-[800px] object-contain mb-6 xl:mb-0 clip-top-right"
                            src={workVideo}
                            controlsList="nodownload"
                            playsInline
                            onEnded={() => setPlayingVideo(null)}
                        />
                    </div>
                    <div className="w-full xl:w-2/5 order-2 text-left xl:max-w-[400px] xl:mx-auto">
                        <p className="text-supero-green font-semibold text-sm">
                            STEP 3
                        </p>
                        <p className="text-white text-5xl font-semibold">
                            Let it Work!
                        </p>

                        <p className="text-supero-mid-grey whitespace-pre-line mt-4 text-sm">
                            {t('step_section.let_it_work')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap pb-24">
                    <div className="w-full xl:w-3/5 relative order-1 xl:order-2">
                        <div className="relative">
                            <button
                                className="absolute left-4 xl:left-auto xl:right-4 top-4 z-10 h-12 w-12 bg-supero-green rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all"
                                onClick={() => handleVideoToggle(4)}
                            >
                                {playingVideo === 4 ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-6 text-supero-dark-grey"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-6 text-supero-dark-grey"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                                        />
                                    </svg>
                                )}
                            </button>
                            <video
                                ref={video4Ref}
                                className="w-full max-w-[800px] object-contain mb-6 xl:mb-0 clip-top-right clip-top-left-xl xl:ms-auto"
                                src={switchVideo}
                                controlsList="nodownload"
                                playsInline
                                onEnded={() => setPlayingVideo(null)}
                            />
                        </div>
                    </div>
                    <div className="w-full xl:w-2/5 order-2 xl:order-1 text-left xl:max-w-[400px] xl:mx-auto">
                        <p className="text-supero-green font-semibold text-sm">
                            STEP 4
                        </p>
                        <p className="text-white text-5xl font-semibold">
                            Switch & Repeat
                        </p>
                        <p className="text-supero-mid-grey whitespace-pre-line mt-4 text-sm">
                            {t('step_section.switch_repeat')}
                        </p>
                    </div>
                </div>
            </section>

            <VideoSectionFinish />

            <Applications />

            <SuggestedArticles categoryId={1} />
            <PartnersSectionFinish />

            <LandingForm />
            <GetInTouch />
            <Footer />
        </>
    );
}
