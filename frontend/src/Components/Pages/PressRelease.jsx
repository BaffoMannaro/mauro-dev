import { Helmet } from 'react-helmet-async';
import Footer from '../Landing/Footer';
import { getDefaultOgImageUrl, siteUrl } from '../../utils/seo.js';
import { useLocation } from 'react-router-dom';
import {
    blogPostingJsonLd,
    breadcrumbListJsonLd,
    jsonLdString,
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd,
} from '../../utils/jsonld.js';
import { useTranslation } from 'react-i18next';

export default function PressRelease() {
    const location = useLocation();
    const { i18n } = useTranslation();
    const activeLang = i18n.resolvedLanguage;
    const jsonLdLang = activeLang === 'en' ? 'en' : 'it';
    const pageUrl = siteUrl(location.pathname);
    const ogImageUrl = getDefaultOgImageUrl();
    const pageTitle =
        activeLang === 'it'
            ? 'SUPERO | Comunicato Stampa Rebranding'
            : 'SUPERO | Rebranding Press Release';
    const pageDescription =
        activeLang === 'it'
            ? "G-nous Tech diventa SUPERO. Un ecosistema software-driven per l'automazione robotica e il controllo dei processi industriali."
            : 'G-nous Tech becomes SUPERO: a software-driven ecosystem for robotic automation and industrial process control.';
    return (
        <>
            <Helmet>
                <title>{pageTitle}</title>
                <link rel="canonical" href={pageUrl} />
                <meta name="description" content={pageDescription} />
                <meta property="og:site_name" content="SUPERO" />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:url" content={pageUrl} />
                <meta property="og:type" content="article" />
                <meta property="og:image" content={ogImageUrl} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={ogImageUrl} />
                <script type="application/ld+json">
                    {jsonLdString(organizationJsonLd({ url: siteUrl('/') }))}
                </script>
                <script type="application/ld+json">
                    {jsonLdString(websiteJsonLd({ url: siteUrl('/') }))}
                </script>
                <script type="application/ld+json">
                    {jsonLdString(
                        webPageJsonLd({
                            url: pageUrl,
                            name: pageTitle,
                            description: pageDescription,
                            lang: jsonLdLang,
                            image: ogImageUrl,
                        })
                    )}
                </script>
                <script type="application/ld+json">
                    {jsonLdString(
                        blogPostingJsonLd({
                            url: pageUrl,
                            headline: pageTitle,
                            description: pageDescription,
                            image: ogImageUrl,
                            lang: jsonLdLang,
                            siteUrl: siteUrl('/'),
                            publisherLogoUrl: siteUrl('/fav.png'),
                        })
                    )}
                </script>
                <script type="application/ld+json">
                    {jsonLdString(
                        breadcrumbListJsonLd({
                            lang: jsonLdLang,
                            items: [
                                { name: 'Home', url: siteUrl('/') },
                                { name: pageTitle, url: pageUrl },
                            ],
                        })
                    )}
                </script>
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
