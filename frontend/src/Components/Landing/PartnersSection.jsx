import urLogo from '../../assets/images/logos/ur-logo-certified.svg';
import caracol from '../../assets/images/partners/caracol.svg';

import fincons from '../../assets/images/partners/fincons.svg';
import keyence from '../../assets/images/partners/keyence.svg';
import layerloop from '../../assets/images/partners/layerloop.svg';
import mirka from '../../assets/images/partners/mirka.svg';
import schunk from '../../assets/images/partners/schunk.svg';
import politecnico from '../../assets/images/partners/politecnico.svg';
import rina from '../../assets/images/partners/rina.svg';
import monguzzi from '../../assets/images/partners/monguzzi.svg';
import uniba from '../../assets/images/partners/uniba.svg';

import wenglor from '../../assets/images/partners/wenglor.svg';
import zivid from '../../assets/images/partners/zivid.svg';
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
                    {/*  <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={esa} alt="esa" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={ur} alt="ur" />
                    </div>*/}
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={zivid} alt="zivid" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={mirka} alt="mirka" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={schunk} alt="schunk" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img
                            src={monguzzi}
                            alt="monguzzi"
                            className="scale-[0.8]"
                        />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={wenglor} alt="wenglor" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={keyence} alt="keyence" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={fincons} alt="fincons" />
                    </div>

                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={layerloop} alt="layerloop" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={caracol} alt="caracol" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={rina} alt="rina" />
                    </div>

                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={politecnico} alt="politecnico" />
                    </div>
                    <div className="w-full min-w-[180px] xl:w-1/3 max-w-[280px] 2xl:max-w-[440px] h-[122px] 2xl:h-[140px] flex justify-center items-center me-8 xl:me-0">
                        <img src={uniba} alt="uniba" />
                    </div>
                </div>
            </div>
        </>
    );
}
