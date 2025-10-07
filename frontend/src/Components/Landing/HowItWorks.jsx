import { Fade } from 'react-awesome-reveal';

export default function HowItWorks() {
    return (
        <section className="w-full flex flex-wrap bg-[#434348]">
            <div className="w-full xl:w-1/2 p-4 xl:p-12">
                <p className="title my-6">
                    How it <span className="font-black">works</span>
                </p>

                <button className=" group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[16px] uppercase tracking-wider min-w-[250px] justify-between">
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
                </button>
            </div>
            <div className="w-full xl:w-1/2 p-4 xl:p-12">
                <div className="mb-0  text-white max-w-[512px] relative after:content-[''] after:absolute after:w-[2px] after:h-full after:left-[-4px] xl:after:left-[-40px] after:top-0 after:bg-supero-green">
                    <Fade direction="up" delay={100} className="relative">
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-11px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Problem Analysis</p>
                            <p className="text-body-m text-[#BABABF]">
                                We carefully examine your production process to
                                identify inefficiencies and opportunities for
                                automation.
                            </p>
                        </div>
                    </Fade>

                    <Fade direction="up" delay={200} className="relative">
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-11px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Requirement Collection</p>
                            <p className="text-body-m text-[#BABABF]">
                                We collect all the necessary information about
                                your goals, constraints, and operational needs
                                to define a tailored solution.
                            </p>
                        </div>
                    </Fade>

                    <Fade direction="up" delay={300} className="relative">
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-11px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Solution Design</p>
                            <p className="text-body-m text-[#BABABF]">
                                We create a detailed plan that integrates
                                collaborative robotics, software, and processes
                                to optimize productivity and safety.
                            </p>
                        </div>
                    </Fade>

                    <Fade direction="up" delay={400} className="relative">
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-11px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Tech R&D</p>
                            <p className="text-body-m text-[#BABABF]">
                                We experiment and test advanced technologies to
                                ensure high performance and innovative
                                solutions.
                            </p>
                        </div>
                    </Fade>

                    <Fade direction="up" delay={500} className="relative">
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-11px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Deployment & Testing</p>
                            <p className="text-body-m text-[#BABABF]">
                                We install and configure the solution,
                                performing rigorous tests to guarantee flawless
                                operation in your production environment.
                            </p>
                        </div>
                    </Fade>

                    <Fade direction="up" delay={600} className="relative">
                        <div className="h-4 w-4 bg-supero-green rounded-full absolute left-[-11px] xl:left-[-47px] -top-1"></div>
                        <div className="pb-6 ps-3 xl:ps-0">
                            <p className="title-xs">Business Integration</p>
                            <p className="text-body-m text-[#BABABF]">
                                We support your team during adoption, training,
                                and continuous optimization, turning automation
                                into a tangible advantage.
                            </p>
                        </div>
                    </Fade>
                </div>
            </div>
        </section>
    );
}
