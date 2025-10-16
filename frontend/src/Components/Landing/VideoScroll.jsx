import arm from '../../assets/images/arm.mp4';
import videoMobile from '../../assets/images/9-16.mp4';
import { useEffect, useRef, useCallback } from 'react';

export default function VideoScroll() {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastScrollTimeRef = useRef(0);

    const updateVideoTime = useCallback(() => {
        const video = videoRef.current;
        const container = containerRef.current;

        if (!video || !container) return;

        const containerRect = container.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerHeight = containerRect.height;
        const windowHeight = window.innerHeight;

        const scrollStart = windowHeight;
        const scrollEnd = -containerHeight;
        const scrollRange = scrollStart - scrollEnd;
        const scrollProgress = Math.max(
            0,
            Math.min(1, (scrollStart - containerTop) / scrollRange)
        );

        if (video.duration) {
            const targetTime = scrollProgress * video.duration;

            const currentTime = video.currentTime;
            const timeDiff = targetTime - currentTime;

            if (Math.abs(timeDiff) < 0.1) {
                video.currentTime = currentTime + timeDiff * 0.1;
            } else {
                video.currentTime = targetTime;
            }
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(() => {
                const now = performance.now();

                if (now - lastScrollTimeRef.current >= 16) {
                    updateVideoTime();
                    lastScrollTimeRef.current = now;
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [updateVideoTime]);
    return (
        <div ref={containerRef} className="w-full">
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
    );
}
