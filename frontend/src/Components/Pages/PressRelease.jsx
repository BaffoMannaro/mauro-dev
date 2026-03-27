import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../Landing/Footer';
import { siteUrl } from '../../utils/seo';
import { useLocation } from 'react-router-dom';

export default function PressRelease() {
    const location = useLocation();
    return (
        <>
            <Helmet>
                <title>Supero | Comunicato Stampa Rebranding</title>
                <link
                    rel="canonical"
                    href={siteUrl(location.pathname)}
                />
                <meta
                    name="description"
                    content="G-nous Tech diventa SUPERO. Un ecosistema software-driven per l'automazione robotica collaborativa e il controllo dei processi industriali."
                />
                <meta
                    property="og:title"
                    content="Supero | Comunicato Stampa Rebranding"
                />
                <meta
                    property="og:description"
                    content="G-nous Tech diventa SUPERO. Un ecosistema software-driven per l'automazione robotica collaborativa e il controllo dei processi industriali."
                />
                <meta
                    property="og:url"
                    content={siteUrl(location.pathname)}
                />
                <meta property="og:type" content="article" />
            </Helmet>
            <div className="min-h-screen pt-24 bg-supero-dark-grey flex flex-col items-center justify-center bg-typ">
                <div className="max-w-[800px] mt-8 px-8 ">
                    <h1 className="title-xs font-extrabold text-white font-stretch-125 tracking-tight">
                        Comunicato stampa <br />{' '}
                        <span className="mt-8 inline-block">
                            G-nous tech to <strong>Supero</strong>
                        </span>
                    </h1>

                    <p className="mt-8 text-body-l text-white font-p">
                        Negli ultimi anni abbiamo dedicato ogni progetto alla
                        ricerca e allo sviluppo di sistemi intelligenti per la
                        robotica collaborativa e il controllo dei processi.
                    </p>
                    <p className="mt-8 text-body-l text-white">
                        Oggi quel lavoro prende forma in un ecosistema
                        software-driven capace di rendere l’automazione più
                        accessibile, fluida e misurabile.
                    </p>

                    <p className="mt-8 text-body-l text-white font-black">
                        Born from G-nous Tech R&D, built to deliver results.
                    </p>

                    <p className="mt-8 text-body-l text-white">
                        Con <strong>SUPERO</strong>, logica, controllo e
                        intelligenza software operano in sinergia per far
                        scorrere ogni fase produttiva, dal design alla
                        validazione, in modo efficiente, sicuro e integrato.
                    </p>

                    <p className="mt-8 text-body-l text-white">
                        <strong>SUPERO</strong> è il risultato di un percorso di
                        ricerca e di un impegno condiviso verso l’innovazione.{' '}
                        <br />
                        Un passo avanti che consolida la nostra visione: mettere
                        la tecnologia al servizio dell’efficienza e del lavoro
                        quotidiano delle imprese.
                    </p>
                </div>
            </div>

            <Footer />
        </>
    );
}
