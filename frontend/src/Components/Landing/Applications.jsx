import { useTranslation } from 'react-i18next';
import car from '../../assets/finish/car.svg';
import marine from '../../assets/finish/marine.svg';
import space from '../../assets/finish/space.svg';
import manufacture from '../../assets/finish/manufacture.svg';

export default function Applications() {
    const { t } = useTranslation();

    return (
        <section className=" bg-supero-dark-grey px-4 xl:px-12 pt-24 xl:text-center">
            <p className="text-supero-mid-grey uppercase text-body-l mb-6 xl:mb-12">
                {t('areas_of_application')}
            </p>

            <h3 className="title mb-12">
                Technology <br /> that works efficiently, <br />
                <span className="text-supero-green">anywhere.</span>{' '}
            </h3>

            <div className="flex flex-wrap ">
                <div className="w-full lg:w-1/2 xl:w-1/4 flex flex-col items-center mb-12">
                    <div className="h-48 mb-12">
                        {' '}
                        <img src={car} alt="Car" className="w-full h-48" />
                    </div>
                    <p className="text-white text-body-m font-medium uppercase border border-white px-4 py-2">
                        Automotive
                    </p>
                </div>

                <div className="w-full lg:w-1/2 xl:w-1/4 flex flex-col items-center mb-12">
                    <div className="h-48 mb-12">
                        {' '}
                        <img
                            src={marine}
                            alt="Marine"
                            className="w-full h-48"
                        />
                    </div>
                    <p className="text-white text-body-m font-medium uppercase border border-white px-4 py-2">
                        Marine
                    </p>
                </div>

                <div className="w-full lg:w-1/2 xl:w-1/4 flex flex-col items-center mb-12">
                    <div className="h-48 mb-12">
                        {' '}
                        <img src={space} alt="Space" className="w-full h-48" />
                    </div>
                    <p className="text-white text-body-m font-medium uppercase border border-white px-4 py-2">
                        Aerospace
                    </p>
                </div>

                <div className="w-full lg:w-1/2 xl:w-1/4 flex flex-col items-center mb-12">
                    <div className="h-48 mb-12">
                        {' '}
                        <img
                            src={manufacture}
                            alt="Manufacture"
                            className="w-full h-48"
                        />
                    </div>
                    <p className="text-white text-body-m font-medium uppercase border border-white px-4 py-2">
                        Additive <br />
                        Manufacturing
                    </p>
                </div>
            </div>
        </section>
    );
}
