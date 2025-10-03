import mirkaLogo from '../../assets/images/logos/mirka-logo.png';
import schunkLogo from '../../assets/images/logos/schunk-logo.png';
import urLogo from '../../assets/images/logos/ur-logo.png';
import zividLogo from '../../assets/images/logos/zivid-logo.png';

export default function PartnersSection() {
    return (
        <div className="bg-supero-dark-grey px-24 flex flex-col xl:flex-row items-center xl:justify-around py-12">
            <img src={urLogo} alt="ur" />
            <div className="h-[1px] w-[200px] xl:h-32 xl:w-[1px] bg-supero-mid-grey my-12 xl:py-0"></div>
            <div className="flex flex-col xl:flex-row items-center justify-around gap-16 ">
                <img src={zividLogo} alt="zivid" />
                <img src={schunkLogo} alt="schunk" />
                <img src={mirkaLogo} alt="mirka" />
            </div>
        </div>
    );
}
