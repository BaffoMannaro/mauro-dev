import urLogo from '../../assets/images/logos/ur-logo.png';
import caracol from '../../assets/images/partners/caracol.png';
import esa from '../../assets/images/partners/esa.png';
import fincons from '../../assets/images/partners/fincons.png';
import keyence from '../../assets/images/partners/keyence.png';
import layerloop from '../../assets/images/partners/layerloop.png';
import mirka from '../../assets/images/partners/mirka.png';
import schunk from '../../assets/images/partners/schunk.png';
import politecnico from '../../assets/images/partners/politecnico.png';
import rina from '../../assets/images/partners/rina.png';
import robotiq from '../../assets/images/partners/robotiq.png';
import uniba from '../../assets/images/partners/uniba.png';
import ur from '../../assets/images/partners/ur.png';
import wenglor from '../../assets/images/partners/wenglor.png';
import zivid from '../../assets/images/partners/zivid.png';
import { useTranslation } from 'react-i18next';

export default function PartnersSection() {
    const { t } = useTranslation();
    return (
        <>
            <div className="bg-supero-dark-grey flex flex-col xl:flex-row xl:justify-around py-12">
                <div className="w-full xl:w-1/4 px-8 flex justify-center items-center relative ">
                    <div className="hidden xl:block absolute top-0 -right-12 w-[1px] h-full bg-supero-mid-grey"></div>
                    <div className="w-full flex justify-center items-center flex-col">
                        <p className="text-center text-white">{t('we_are')}</p>
                        <img src={urLogo} alt="ur" />
                    </div>
                </div>

                <div className="block xl:hidden w-full my-12">
                    <p className="text-white text-center">Proud partners of</p>
                </div>
                <div className="w-full xl:w-3/4 xl:max-w-[870px] flex flex-row items-center xl:flex-wrap px-8 overflow-x-scroll overflow-y-hidden">
                    <div className="hidden xl:block w-full my-12">
                        <p className="text-white text-center">
                            {t('proud_partners')}
                        </p>
                    </div>
                    {/*  <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={esa} alt="esa" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={ur} alt="ur" />
                    </div>*/}
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={zivid} alt="zivid" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={mirka} alt="mirka" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={schunk} alt="schunk" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={robotiq} alt="robotiq" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={wenglor} alt="wenglor" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={keyence} alt="keyence" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={fincons} alt="fincons" />
                    </div>

                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={layerloop} alt="layerloop" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={caracol} alt="caracol" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={rina} alt="rina" />
                    </div>

                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={politecnico} alt="politecnico" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center hover:bg-[#424247] me-8 xl:me-0">
                        <img src={uniba} alt="uniba" />
                    </div>
                </div>
            </div>
        </>
    );
}
