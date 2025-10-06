import video from '../../assets/images/video-promo.mp4';
import poster from '../../assets/images/poster-video.png';
import { useState, useRef } from 'react';

export default function VideoSection() {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const videoRef = useRef(null);

    const handleStartVideo = () => {
        setIsVideoPlaying(true);
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    return (
        <div className="h-screen bg-supero-dark-grey relative flex items-center justify-center">
            {!isVideoPlaying && (
                <div className="absolute z-10 text-white text-center px-4">
                    <p className="title">
                        Finishing made easy. <br />
                        Watch it at work
                    </p>
                    <button
                        onClick={handleStartVideo}
                        className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between mx-auto mt-6"
                    >
                        <span className="relative z-10">SEE AI IN ACTION</span>

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
            )}
            <video
                ref={videoRef}
                className="w-full h-screen  object-contain"
                controls={isVideoPlaying}
                playsInline
                src={video}
                poster={poster}
            ></video>
        </div>
    );
}
