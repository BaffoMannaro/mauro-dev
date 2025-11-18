/* import React from 'react';
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
 */

import React from 'react';
import Lottie from 'lottie-react';

import logoAnimationData from '../../assets/logohomedef.json';

const LottieATF = () => {
    return (
        <div
            id="lottie"
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: 'transparent',
                display: 'block',
                overflow: 'hidden',
                position: 'absolute',
                zIndex: 11,
                top: window.innerWidth > 768 ? '10vh' : '-20vh',
                right: window.innerWidth > 768 ? '5vw' : '10vw',
                pointerEvents: 'none',
                overflowX: 'hidden',
            }}
        >
            <Lottie
                animationData={logoAnimationData}
                loop={true}
                autoplay={true}
                style={{
                    width: '100vw',
                    height: '100vh',
                    transform:
                        window.innerWidth > 768 ? 'scale(1)' : 'scale(1.3)',
                    position: 'relative',

                    right: window.innerWidth > 768 ? '0vw' : '20vw',
                    /* opacity: 1,
                    background: 'red', */
                }}
            />
        </div>
    );
};

export default LottieATF;
