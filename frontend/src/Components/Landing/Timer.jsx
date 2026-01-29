import { useState, useEffect } from 'react';

function Timer() {
    const targetDate = new Date();
    targetDate.setMonth(2);
    targetDate.setDate(4);
    targetDate.setFullYear(2026);
    targetDate.setHours(0, 0, 0, 0);

    /* if (targetDate.getTime() < new Date().getTime()) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
    } */

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    function calculateTimeLeft() {
        const difference = targetDate.getTime() - new Date().getTime();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            timeLeft = {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                expired: true,
            };
        }
        return timeLeft;
    }

    const timerComponents = [];

    const labels = {
        days: 'Days',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds',
    };

    Object.keys(timeLeft).forEach((interval) => {
        if (interval === 'expired') return;

        if (timeLeft[interval] >= 0) {
            timerComponents.push(
                <div
                    style={{
                        clipPath:
                            'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                        background:
                            'linear-gradient(-90deg, rgb(96, 96, 111) 0%, rgb(66, 66, 71) 100%)',
                    }}
                    key={interval}
                    className="w-full md:w-1/2  lg:w-[320px] flex flex-col items-center  p-4 mb-5 mx-2"
                >
                    <span className="text-white text-6xl font-extrabold">
                        {timeLeft[interval]}
                    </span>
                    <span className="text-white mt-2">{labels[interval]}</span>
                </div>
            );
        }
    });

    return (
        <div className="w-full  bg-supero-dark-grey pb-32 px-4">
            <p className="text-3xl xl:text-6xl font-bold text-white text-center mb-12 xl:mb-24">
                Meet Supero Finish at{' '}
                <span className="text-supero-green font-black font-stretch-125  tracking-tight">
                    MecSpe
                </span>{' '}
                Bologna 2026
            </p>
             {timeLeft.expired ? (
                ''
            ) : (
                <div className="flex justify-center flex-wrap ">
                    {timerComponents.length ? timerComponents : ''}
                </div>
            )}
        </div>
    );
}

export default Timer;
