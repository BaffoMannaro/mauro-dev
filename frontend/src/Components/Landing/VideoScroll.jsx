import arm from '../../assets/images/arm.mp4';
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

        // Calcola la percentuale di scroll del video nel viewport
        // Il video inizia quando entra nel viewport e finisce quando esce
        const scrollStart = windowHeight;
        const scrollEnd = -containerHeight;
        const scrollRange = scrollStart - scrollEnd;
        const scrollProgress = Math.max(
            0,
            Math.min(1, (scrollStart - containerTop) / scrollRange)
        );

        // Imposta il tempo del video basato sulla progressione dello scroll
        if (video.duration) {
            const targetTime = scrollProgress * video.duration;

            // Smooth interpolation per transizioni più fluide
            const currentTime = video.currentTime;
            const timeDiff = targetTime - currentTime;

            // Se la differenza è piccola, applica interpolazione
            if (Math.abs(timeDiff) < 0.1) {
                video.currentTime = currentTime + timeDiff * 0.1;
            } else {
                video.currentTime = targetTime;
            }
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            // Throttling con requestAnimationFrame per performance migliori
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(() => {
                const now = performance.now();
                // Limita gli aggiornamenti a 60fps
                if (now - lastScrollTimeRef.current >= 16) {
                    updateVideoTime();
                    lastScrollTimeRef.current = now;
                }
            });
        };

        // Aggiungi event listener per lo scroll con passive per performance
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Chiama handleScroll una volta per impostare la posizione iniziale
        handleScroll();

        // Cleanup
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
                src={arm}
                muted
                preload="metadata"
                controlsList="nodownload"
            ></video>
        </div>
    );
}
