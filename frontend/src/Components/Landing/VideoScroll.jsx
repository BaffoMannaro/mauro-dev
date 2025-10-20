import arm from '../../assets/images/arm.mp4';
import videoMobile from '../../assets/images/9-16.mp4';
import { useEffect, useRef, useCallback } from 'react';

export default function VideoScroll() {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const animationFrameRef = useRef(null);

    const updateVideoTime = useCallback(() => {
        const video = videoRef.current;
        const container = containerRef.current;

        if (!video || !container || !video.duration) {
            animationFrameRef.current = requestAnimationFrame(updateVideoTime);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        const scrollProgress = Math.max(
            0,
            Math.min(
                1,
                -containerRect.top / (containerRect.height - windowHeight)
            )
        );

        const targetTime = scrollProgress * video.duration;
        const currentTime = video.currentTime;
        const timeDiff = targetTime - currentTime;

        if (Math.abs(timeDiff) > 0.01) {
            video.currentTime = currentTime + timeDiff * 0.2;
        } else {
            video.currentTime = targetTime;
        }

        animationFrameRef.current = requestAnimationFrame(updateVideoTime);
    }, []);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(updateVideoTime);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [updateVideoTime]);

    return (
        <div ref={containerRef} className="video-scroll-container">
            <div className="video-fixed-wrapper">
                <video
                    ref={videoRef}
                    className="w-full object-contain"
                    controls={false}
                    playsInline
                    src={window.innerWidth < 1280 ? videoMobile : arm}
                    muted
                    preload="metadata"
                    controlsList="nodownload"
                ></video>
            </div>
        </div>
    );
}
