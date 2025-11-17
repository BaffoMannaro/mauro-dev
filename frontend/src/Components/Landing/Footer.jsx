import footerLogo from '../../assets/images/logo-footer.png';

import eu from '../../assets/images/logos/eu.png';
import italiadomani from '../../assets/images/logos/italiadomani.png';
import miur from '../../assets/images/logos/miur.png';
import fair from '../../assets/images/logos/fair.png';

import coesione from '../../assets/images/logos/coesione.png';
import regionePuglia from '../../assets/images/logos/regionePuglia.png';
import repubblica from '../../assets/images/logos/repubblica.png';
import pugliaSviluppo from '../../assets/images/logos/pugliaSviluppo.png';
import cofinanziato from '../../assets/images/logos/cofinanziato.png';

export default function Footer() {
    return (
        <footer className="bg-supero-dark-grey py-12">
            <img
                src={footerLogo}
                alt="Supero Logo"
                className="mx-auto block relative bottom-[-1px]"
            />

            <div className="bg-[#434348] py-12 px-4 xl:px-12">
                <div className="w-full flex justify-around flex-wrap">
                    <div className="w-full xl:w-4/5 xl:pe-12">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-8 mb-8">
                            <div>
                                <img src={eu} alt="European Union Logo" />
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
                                <img src={miur} alt="MIUR Logo" />
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
                                Bando a Cascata “Future Artificial Intelligence
                                Research‑FAIR” finanziato nell’ambito
                                dell’Avviso n. 341 del 15.03.2022 Piano
                                Nazionale di Ripresa e Resilienza (PNRR),
                                Missione 4 Componente 2 “Dalla Ricerca
                                all’Impresa” Linea di Investimento 1.3 ”
                                Finanziato dall’Unione Europea –
                                NextGenerationEU
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#434348] py-12 px-4 xl:px-12">
                <div className="w-full flex items-center justify-around flex-wrap">
                    <div className="w-full xl:w-4/5 xl:pe-12">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-8 mb-8">
                            <div>
                                <div>
                                    <img src={coesione} alt="Coesione Logo" />
                                </div>
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <div>
                                <img
                                    src={cofinanziato}
                                    alt="Cofinanziato Logo"
                                />
                            </div>
                            <div className="hidden xl:block w-[1px] h-20 bg-[#626271]"></div>
                            <div>
                                <img src={repubblica} alt="Repubblica Logo" />
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
                            />
                        </div>
                    </div>
                    <div className="w-full xl:w-1/5">
                        <div className="">
                            <p className="text-body-s opacity-70">
                                Intervento cofinanziato dall’U.E. a valere sul
                                PR Puglia FESR-FSE+ 2021-2027 FONDO TECNONIDI
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
