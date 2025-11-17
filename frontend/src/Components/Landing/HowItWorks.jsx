import { Fade } from 'react-awesome-reveal';

export default function HowItWorks() {
    return (
        <section className="w-full flex flex-wrap bg-[#434348]">
            <div className="w-full xl:w-1/2 p-4 xl:p-12">
                <p className="title my-6">
                    How it{' '}
                    <span className="font-black font-stretch-125">works</span>
                </p>

                <a
                    href="#landing-form"
                    className="group  relative overflow-hidden bg-[#CCE535] hover:bg-transparent border border-supero-green  text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex xl:inline-flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between mx-auto xl:mx-0"
                >
                    <span className="relative z-10">start your project</span>

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
            <div className="w-full xl:w-1/2 p-4 xl:p-12">
                <div className="mb-0  text-white max-w-[512px] relative after:content-[''] after:absolute after:w-[2px] after:h-full after:left-[2px] xl:after:left-[-40px] after:top-0 after:bg-supero-green">
                    <Fade
                        direction="up"
                        delay={100}
                        className="relative mb-12 xl:mb-4"
                    >
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-7px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Problem Analysis</p>
                            <p className="text-body-m text-[#BABABF]">
                                Understanding the process to unlock efficiency.{' '}
                                <br />
                                We study your workflow in detail, identifying
                                friction points, repetitive tasks, and
                                opportunities where automation can deliver real
                                performance gains.
                            </p>
                        </div>
                    </Fade>

                    <Fade
                        direction="up"
                        delay={200}
                        className="relative mb-12 xl:mb-4"
                    >
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-7px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Requirement Collection</p>
                            <p className="text-body-m text-[#BABABF]">
                                From challenges to measurable goals. <br />
                                We define every operational need — targets,
                                constraints, materials, and cycles — translating
                                them into technical requirements for a precise
                                solution design.
                            </p>
                        </div>
                    </Fade>

                    <Fade
                        direction="up"
                        delay={300}
                        className="relative mb-12 xl:mb-4"
                    >
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-7px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Technology at work</p>
                            <p className="text-body-m text-[#BABABF]">
                                We integrate robotics, software, and process
                                control into one functional system — engineered
                                to perform, optimized to last.
                            </p>
                        </div>
                    </Fade>

                    <Fade
                        direction="up"
                        delay={400}
                        className="relative mb-12 xl:mb-4"
                    >
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-7px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Deployment & Validation</p>
                            <p className="text-body-m text-[#BABABF]">
                                Our team manages setup, calibration, and
                                validation directly on-site, ensuring the system
                                runs reliably under real production conditions.
                            </p>
                        </div>
                    </Fade>

                    <Fade
                        direction="up"
                        delay={500}
                        className="relative mb-12 xl:mb-4"
                    >
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-7px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Business Integration</p>
                            <p className="text-body-m text-[#BABABF]">
                                Automation that becomes part of your workflow.{' '}
                                <br />
                                We train your team, monitor data, and optimize
                                performance over time — turning technology into
                                a concrete, measurable advantage.
                            </p>
                        </div>
                    </Fade>
                </div>
            </div>
        </section>
    );
}
