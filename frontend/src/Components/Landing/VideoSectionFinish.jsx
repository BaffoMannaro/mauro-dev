import video from '../../assets/images/video-promo.mp4';
import poster from '../../assets/images/poster-video.png';

import { useState, useRef } from 'react';
import VideoScroll from './VideoScroll';
import { useTranslation } from 'react-i18next';

export default function VideoSectionFinish() {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const videoRef = useRef(null);

    const { t } = useTranslation();

    const handleStartVideo = () => {
        setIsVideoPlaying(true);
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    return (
        <>
            <div
                id="video-finish"
                className=" bg-supero-dark-grey relative flex flex-col items-center justify-center pt-8 xl:pt-0"
            >
                <div className="px-4 xl:hidden">
                    <p className="title text-center text-4xl mb-4">
                        {t('video_claim_finish')}
                    </p>
                </div>
                {!isVideoPlaying && (
                    <div className="xl:absolute z-10 text-white xl:text-center px-4">
                        <p className="title mb-6 xl:mb-0 hidden xl:block whitespace-pre-line">
                            {t('video_claim_finish')}
                        </p>
                        <div className="absolute bottom-[50px] left-[50%] translate-x-[-50%] xl:hidden">
                            <button
                                onClick={handleStartVideo}
                                className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between mx-auto mt-6"
                            >
                                <span className="relative z-10">
                                    WATCH VIDEO
                                </span>

                                <div className="relative w-6 h-6 overflow-hidden transform ">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="absolute transition-all duration-300 transform group-hover:translate-x-6 group-hover:-translate-y-6 group-hover:opacity-0"
                                    >
                                        <path
                                            d="M0.75 17.9999C0.551088 17.9999 0.360322 17.9209 0.21967 17.7802C0.0790178 17.6395 0 17.4488 0 17.2499V0.749872C2.23132e-05 0.619544 0.0340055 0.491471 0.0986001 0.378277C0.163195 0.265083 0.256171 0.170674 0.368365 0.104357C0.480559 0.0380404 0.608097 0.00210363 0.73841 8.95819e-05C0.868722 -0.00192447 0.99731 0.0300537 1.1115 0.0928718L16.1115 8.34287C16.2291 8.40761 16.3271 8.50273 16.3954 8.6183C16.4637 8.73386 16.4998 8.86564 16.4998 8.99987C16.4998 9.13411 16.4637 9.26588 16.3954 9.38145C16.3271 9.49701 16.2291 9.59213 16.1115 9.65687L1.1115 17.9069C1.00076 17.9678 0.876412 17.9998 0.75 17.9999ZM1.5 2.01737V15.9824L14.1937 8.99987L1.5 2.01737Z"
                                            fill="#2E2E33"
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
                                            d="M0.75 17.9999C0.551088 17.9999 0.360322 17.9209 0.21967 17.7802C0.0790178 17.6395 0 17.4488 0 17.2499V0.749872C2.23132e-05 0.619544 0.0340055 0.491471 0.0986001 0.378277C0.163195 0.265083 0.256171 0.170674 0.368365 0.104357C0.480559 0.0380404 0.608097 0.00210363 0.73841 8.95819e-05C0.868722 -0.00192447 0.99731 0.0300537 1.1115 0.0928718L16.1115 8.34287C16.2291 8.40761 16.3271 8.50273 16.3954 8.6183C16.4637 8.73386 16.4998 8.86564 16.4998 8.99987C16.4998 9.13411 16.4637 9.26588 16.3954 9.38145C16.3271 9.49701 16.2291 9.59213 16.1115 9.65687L1.1115 17.9069C1.00076 17.9678 0.876412 17.9998 0.75 17.9999ZM1.5 2.01737V15.9824L14.1937 8.99987L1.5 2.01737Z"
                                            fill="#2E2E33"
                                        />
                                    </svg>
                                </div>
                            </button>
                        </div>
                        <button
                            onClick={handleStartVideo}
                            className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] border border-supero-green text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold hidden xl:flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between mx-auto mt-6"
                        >
                            <span className="relative z-10">WATCh VIDEO</span>

                            <div className="relative w-6 h-6 overflow-hidden transform ">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute transition-all duration-300 transform group-hover:translate-x-6 group-hover:-translate-y-6 group-hover:opacity-0"
                                >
                                    <path
                                        d="M0.75 17.9999C0.551088 17.9999 0.360322 17.9209 0.21967 17.7802C0.0790178 17.6395 0 17.4488 0 17.2499V0.749872C2.23132e-05 0.619544 0.0340055 0.491471 0.0986001 0.378277C0.163195 0.265083 0.256171 0.170674 0.368365 0.104357C0.480559 0.0380404 0.608097 0.00210363 0.73841 8.95819e-05C0.868722 -0.00192447 0.99731 0.0300537 1.1115 0.0928718L16.1115 8.34287C16.2291 8.40761 16.3271 8.50273 16.3954 8.6183C16.4637 8.73386 16.4998 8.86564 16.4998 8.99987C16.4998 9.13411 16.4637 9.26588 16.3954 9.38145C16.3271 9.49701 16.2291 9.59213 16.1115 9.65687L1.1115 17.9069C1.00076 17.9678 0.876412 17.9998 0.75 17.9999ZM1.5 2.01737V15.9824L14.1937 8.99987L1.5 2.01737Z"
                                        fill="#2E2E33"
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
                                        d="M0.75 17.9999C0.551088 17.9999 0.360322 17.9209 0.21967 17.7802C0.0790178 17.6395 0 17.4488 0 17.2499V0.749872C2.23132e-05 0.619544 0.0340055 0.491471 0.0986001 0.378277C0.163195 0.265083 0.256171 0.170674 0.368365 0.104357C0.480559 0.0380404 0.608097 0.00210363 0.73841 8.95819e-05C0.868722 -0.00192447 0.99731 0.0300537 1.1115 0.0928718L16.1115 8.34287C16.2291 8.40761 16.3271 8.50273 16.3954 8.6183C16.4637 8.73386 16.4998 8.86564 16.4998 8.99987C16.4998 9.13411 16.4637 9.26588 16.3954 9.38145C16.3271 9.49701 16.2291 9.59213 16.1115 9.65687L1.1115 17.9069C1.00076 17.9678 0.876412 17.9998 0.75 17.9999ZM1.5 2.01737V15.9824L14.1937 8.99987L1.5 2.01737Z"
                                        fill="#fff"
                                        className="group-hover:fill-supero-green"
                                    />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}
                <video
                    ref={videoRef}
                    className="w-full object-contain"
                    controls={isVideoPlaying}
                    playsInline
                    src={video}
                    poster={poster}
                    controlsList="nodownload"
                ></video>
            </div>
        </>
    );
}
