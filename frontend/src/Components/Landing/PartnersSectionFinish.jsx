import urLogo from '../../assets/images/partners/ur.svg';
import mirka from '../../assets/images/partners/mirka.svg';
import schunk from '../../assets/images/partners/schunk.svg';
import zivid from '../../assets/images/partners/zivid.svg';
import monguzzi from '../../assets/images/partners/monguzzi.svg';
import { useTranslation } from 'react-i18next';

export default function PartnersSectionFinish() {
    const { t } = useTranslation();
    return (
        <>
            <div className="bg-supero-dark-grey flex flex-col xl:flex-row xl:justify-evenly py-12">
                <div className="w-full xl:w-1/4 px-8 flex justify-center items-center relative ">
                    <div className="hidden xl:block absolute top-0 -right-12 w-[1px] h-full bg-supero-mid-grey"></div>
                    <div className="w-full flex justify-center items-center flex-col">
                        <p className="text-center text-white">{t('we_are')}</p>
                        <img src={urLogo} alt="ur" />
                    </div>
                </div>

                <div className="w-full xl:w-3/4 xl:max-w-[870px] flex flex-row items-center xl:flex-wrap px-0 overflow-x-scroll overflow-y-hidden">
                    <div className="w-full my-5">
                        <p className="text-white text-center ">
                            {t('proud_partners')}
                        </p>
                    </div>

                    <div className="w-full min-w-[180px] xl:w-1/4 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={zivid} alt="zivid" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/4 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={mirka} alt="mirka" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/4 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={schunk} alt="schunk" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/4 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img
                            src={monguzzi}
                            alt="monguzzi"
                            className="scale-[0.8]"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
