import footerLogo from '../../assets/images/logo-footer.png';

import eu from '../../assets/images/logos/eu.png';
import italiadomani from '../../assets/images/logos/italiadomani.png';
import miur from '../../assets/images/logos/miur.png';
import fair from '../../assets/images/logos/fair.png';

import coesione from '../../assets/images/logos/coesione.png';
import regionePuglia from '../../assets/images/logos/regionePuglia.png';
import pugliaSviluppo from '../../assets/images/logos/pugliaSviluppo.png';
import cofinanziato from '../../assets/images/logos/cofinanziato.png';
import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-supero-dark-grey py-2">
            <img
                src={footerLogo}
                alt="Supero Logo"
                className="mx-auto block relative bottom-[-1px]"
            />

            <div className="bg-[#434348] py-6 px-4 xl:px-12 mt-18">
                <div className="w-full flex items-center justify-around flex-wrap">
                    <div className="w-full xl:w-4/5 xl:pe-12">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-8 mb-8">
                            <div>
                                <img src={eu} alt="European Union Logo" />
                            </div>
                            <div className="hidden xl:block w-[1px] h-16 bg-[#626271]"></div>
                            <div>
                                <img src={miur} alt="MIUR Logo" />
                            </div>
                            <div className="hidden xl:block w-[1px] h-16 bg-[#626271]"></div>
                            <div>
                                <img
                                    src={italiadomani}
                                    alt="Italia Domani Logo"
                                />
                            </div>
                            <div className="hidden xl:block w-[1px] h-16 bg-[#626271]"></div>
                            <div>
                                <img src={fair} alt="FAIR Logo" />
                            </div>
                        </div>
                    </div>
                    <div className="w-full xl:w-1/5">
                        <div className="">
                            <p className="text-body-s opacity-70">
                                {t('banded_with')}
                            </p>
                        </div>
                    </div>
                </div>
                <hr className="bg-[#626271] mt-8" />
            </div>

            <div className="bg-[#434348] py-6 px-4 xl:px-12">
                <div className="w-full flex items-center justify-around flex-wrap">
                    <div className="w-full xl:w-4/5 xl:pe-12">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-8 mb-8">
                            <div>
                                <img
                                    src={cofinanziato}
                                    alt="Cofinanziato Logo"
                                />
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <div>
                                <img src={miur} alt="MIUR Logo" />
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <div>
                                <div>
                                    <img src={coesione} alt="Coesione Logo" />
                                </div>
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <div>
                                <img
                                    src={regionePuglia}
                                    alt="Regione Puglia Logo"
                                />
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <img
                                src={pugliaSviluppo}
                                alt="Puglia Sviluppo Logo"
                                className="max-w-32"
                            />
                        </div>
                    </div>
                    <div className="w-full xl:w-1/5">
                        <div className="">
                            <p className="text-body-s opacity-70">
                                {t('intervent_cofinanced')}
                            </p>
                        </div>
                    </div>
                </div>
                <hr className="bg-[#626271] mt-8" />
            </div>
            <div className="bg-[#434348] py-6 px-4 xl:px-12">
                <div className="w-full flex items-center justify-around flex-wrap">
                    <div className="w-full xl:w-4/5 xl:pe-12">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-8 mb-8">
                            <div>
                                <img
                                    src={cofinanziato}
                                    alt="Cofinanziato Logo"
                                />
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <div>
                                <img src={miur} alt="MIUR Logo" />
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <div>
                                <img
                                    src={regionePuglia}
                                    alt="Regione Puglia Logo"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="w-full xl:w-1/5">
                        <div className="">
                            <p className="text-body-s opacity-70">
                                {t('visioprint_cofinanced')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-supero-dark-grey py-4">
                <div className="w-full text-center">
                    <p className="text-body-m opacity-60">
                        © {new Date().getFullYear()} All rights reserved
                    </p>
                    <div className="flex justify-center gap-4 mt-1">
                        <a
                            href="https://www.iubenda.com/privacy-policy/23263641"
                            className="text-body-m opacity-60 hover:opacity-100 transition-opacity underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Privacy Policy
                        </a>
                        <span className="text-body-m opacity-60">|</span>
                        <a
                            href="https://www.iubenda.com/privacy-policy/23263641/cookie-policy"
                            className="text-body-m opacity-60 hover:opacity-100 transition-opacity underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Cookie Policy
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
