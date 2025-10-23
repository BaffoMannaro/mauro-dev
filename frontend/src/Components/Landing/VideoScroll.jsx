import arm from '../../assets/images/arm.mp4';
import videoMobile from '../../assets/images/9-16.mp4';
import { useEffect, useRef, useCallback } from 'react';

export default function VideoScroll() {
    return (
        <>
            <video
                className="w-full object-contain hidden lg:block"
                controls={false}
                playsInline
                src={arm}
                autoPlay
                loop
                muted
                preload="metadata"
                controlsList="nodownload"
            ></video>

            <video
                className="w-full object-contain lg:hidden"
                controls={false}
                playsInline
                src={videoMobile}
                autoPlay
                loop
                muted
                preload="metadata"
                controlsList="nodownload"
            ></video>
        </>
    );
}
