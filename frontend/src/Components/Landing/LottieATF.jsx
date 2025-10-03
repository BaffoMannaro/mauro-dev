import React from 'react';
import Lottie from 'lottie-react';

import logoAnimationData from '../../assets/logohome.json';

const LottieATF = () => {
    return (
        <div
            id="lottie"
            style={{
                width: '50vw',
                height: '100vh',
                backgroundColor: 'transparent',
                display: 'block',
                overflow: 'hidden',
                position: 'absolute',
                zIndex: 11,
                top: 0,
                right: '2vw',
                pointerEvents: 'none',
            }}
        >
            <Lottie
                animationData={logoAnimationData}
                loop={true}
                autoplay={true}
                style={{
                    width: '50vw',
                    height: '100vh',
                    transform: 'scale(1.5)',
                    opacity: 1,
                }}
            />
        </div>
    );
};

export default LottieATF;
