import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import calcBg from '../../assets/images/calcolatore-bg.png';
import lineDot from '../../assets/images/line-dot.svg';
import useROIStore from '../../Stores/roiStore';

const CONVERSION_FACTOR = 4;
const ROBOT_CELL_COST = 80_000;
const LICENSE_COST = 35_000;
const SAAS_FEE = 15_000;
const MAINTENANCE_ANNUAL = 3_000;
const ADDITIONAL_OP_COSTS = 4_000;
const SAVINGS_FACTOR = 0.8;
const LICENSE_AMORT_YEARS = 5;
const LICENSE_MAINT_YEARS = 2;

function calculateROI(operators, costPerOperator, cells, model) {
    const operatorsReduced = operators - operators / CONVERSION_FACTOR;
    const grossSavings = operatorsReduced * costPerOperator * SAVINGS_FACTOR;
    const softwareCostAnnual =
        model === 'license'
            ? cells * (LICENSE_COST / LICENSE_AMORT_YEARS + (MAINTENANCE_ANNUAL * LICENSE_MAINT_YEARS) / LICENSE_AMORT_YEARS)
            : cells * SAAS_FEE;
    const additionalOpCostsTotal = cells * ADDITIONAL_OP_COSTS;
    const netAnnualSavings = grossSavings - softwareCostAnnual - additionalOpCostsTotal;
    const initialInvestment =
        model === 'license'
            ? cells * (ROBOT_CELL_COST + LICENSE_COST)
            : cells * ROBOT_CELL_COST;
    const paybackMonths =
        netAnnualSavings > 0 ? (initialInvestment / netAnnualSavings) * 12 : null;

    return { operatorsReduced, grossSavings, softwareCostAnnual, additionalOpCostsTotal, netAnnualSavings, initialInvestment, paybackMonths };
}

function formatNum(value) {
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Plain string version — used for the backend message payload
function formatEur(value) {
    return `€ ${formatNum(value)}`;
}

// JSX version — € at half size, before the number
function EurValue({ amount }) {
    return (
        <>
            <span style={{ fontSize: '0.5em', lineHeight: 1, marginRight: '0.1em', verticalAlign: 'middle' }}>€</span>
            {formatNum(amount)}
        </>
    );
}

function formatPayback(months, t) {
    if (months === null) return '—';
    if (months < 1) return `< 1 ${t('roi_months')}`;
    const m = Math.round(months);
    if (m < 12) return `${m} ${t('roi_months')}`;
    return `${(months / 12).toFixed(1)} ${t('roi_years')}`;
}

function ROISlider({ label, value, min, max, step, onChange, formatValue }) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="mb-8">
            <p className="text-supero-mid-grey text-[14px] xl:text-[17px] leading-[155%] tracking-wider mb-2">{label}</p>
            <p className="text-white font-bold text-[34px] xl:text-[43px] leading-tight mb-4">
                {formatValue(value)}
            </p>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="roi-slider w-full"
                style={{ '--pct': `${pct}%` }}
            />
        </div>
    );
}

function InfoTooltip({ text }) {
    return (
        <span className="relative group/tip inline-block align-super ml-1">
            <span className="inline-flex items-center justify-center w-[15px] h-[15px] rounded-full border border-supero-mid-grey text-supero-mid-grey text-[9px] font-bold cursor-default leading-none select-none">
                i
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1f] border border-[#626271] text-white text-[13px] leading-snug w-[240px] opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-left">
                {text}
            </span>
        </span>
    );
}

function ResultRow({ label, value, accent = false, large = false, tooltip }) {
    return (
        <div className="mb-6">
            <p className={`${large ? 'text-[38px] xl:text-[38px] text-center font-bold' : 'text-[38px] xl:text-[38px] text-center font-semibold'}${accent ? ' text-supero-green' : ' text-white'}`}>
                {value}
            </p>
            <p className="text-supero-mid-grey text-[14px] xl:text-[17px] leading-[155%] text-center tracking-wider mt-1">
                {label}
                {tooltip && <InfoTooltip text={tooltip} />}
            </p>
        </div>
    );
}

function ArrowIcon() {
    return (
        <div className="relative w-6 h-6 overflow-hidden transform rotate-90">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="absolute transition-all duration-300 transform group-hover:translate-x-6 group-hover:-translate-y-6 group-hover:opacity-0">
                <path d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z" fill="currentColor" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="absolute transition-all duration-300 transform -translate-x-6 translate-y-6 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
                <path d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z" fill="currentColor" />
            </svg>
        </div>
    );
}

export default function ROICalculator() {
    const { t } = useTranslation();
    const setROIData = useROIStore((s) => s.setROIData);

    const [isOpen, setIsOpen] = useState(false);
    const [operators, setOperators] = useState(7);
    const [costPerOperator, setCostPerOperator] = useState(150_000);
    const [cells, setCells] = useState(1);
    const [model, setModel] = useState('license');

    const results = useMemo(
        () => calculateROI(operators, costPerOperator, cells, model),
        [operators, costPerOperator, cells, model]
    );

    const handleGetStarted = () => {
        setROIData({ operators, costPerOperator, cells, model, ...results });
        document.getElementById('landing-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section
            id="roi-calculator"
            className="w-full relative overflow-hidden"
            style={{
                backgroundImage: `url(${calcBg})`,
                backgroundSize: 'contain',
                backgroundAttachment: 'fixed',
                backgroundPosition: 'top',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#434348',
            }}
        >

            {/* Banner */}
            <div className="relative z-10 flex items-center px-6 xl:px-16 py-16 min-h-[240px] xl:min-h-[300px]">
                <div className="max-w-[600px]">
                    <h2 className="title mb-8" style={{ fontSize: 'clamp(60px, 8vw, 96px)' }}>
                        {t('roi_banner_pre')}{' '}
                        <span className="text-supero-green font-black font-stretch-125 tracking-tight">ROI</span>
                        <br />
                        {t('roi_banner_post')}
                    </h2>
                    <button
                        onClick={() => setIsOpen((v) => !v)}
                        className="group relative overflow-hidden bg-supero-green hover:bg-transparent border border-supero-green text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[19px] tracking-wider min-w-[280px] justify-between"
                    >
                        <span className="relative z-10">
                            {isOpen ? t('roi_close_calculator') : t('roi_start_calculator')}
                        </span>
                        <ArrowIcon />
                    </button>
                </div>
            </div>

            {/* Calculator panel */}
            <div className={`relative z-10 overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-wrap px-6 xl:px-16 pb-16 justify-center">

                    {/* LEFT — inputs */}
                    <div className="flex-1 min-w-[280px] max-w-[550px] h-fit bg-[#2E2E33] px-10 py-10 rounded-lg">
                        <ROISlider
                            label={t('roi_operators_label')}
                            value={operators} min={1} max={50} step={1}
                            onChange={setOperators}
                            formatValue={(v) => v}
                        />
                        <ROISlider
                            label={t('roi_cost_label')}
                            value={costPerOperator} min={20_000} max={300_000} step={5_000}
                            onChange={setCostPerOperator}
                            formatValue={(v) => <EurValue amount={v} />}
                        />
                        <ROISlider
                            label={t('roi_cells_label')}
                            value={cells} min={1} max={10} step={1}
                            onChange={setCells}
                            formatValue={(v) => v}
                        />
                    </div>

                    {/* CENTER — decorative connector */}
                    <div className="hidden xl:flex items-center justify-center self-stretch">
                        <img src={lineDot} alt="" className="h-full object-contain mb-20" />
                    </div>

                    {/* RIGHT — two inner cards */}
                    <div className="flex-1 min-w-[280px] max-w-[550px] flex flex-col gap-6">

                        {/* Card 1 — software plan */}
                        <div className="flex-1 bg-[#2e2e33] px-10 py-10 rounded-lg">
                            <p className="text-supero-mid-grey text-[14px] xl:text-[17px] leading-[155%] tracking-wider mb-3">
                                {t('roi_software_plan')}
                            </p>
                            <div className="flex bg-[#626271] w-full justify-center">
                                <button
                                    onClick={() => setModel('license')}
                                    className={`w-full px-6 py-2 text-[17px] xl:text-[19px] leading-[155%] font-bold tracking-wider transition-all duration-200 ${model === 'license' ? 'bg-supero-green text-[#2E2E33]' : 'bg-transparent text-supero-mid-grey hover:text-white'}`}
                                >
                                    {t('roi_model_license')}
                                </button>
                                <button
                                    onClick={() => setModel('saas')}
                                    className={`w-full px-6 py-2 text-body-m font-bold tracking-wider transition-all duration-200 ${model === 'saas' ? 'bg-supero-green text-[#2E2E33]' : 'bg-transparent text-supero-mid-grey hover:text-white'}`}
                                >
                                    SaaS
                                </button>
                            </div>
                        </div>

                        {/* Card 2 — outputs + payback + CTA */}
                        <div className="flex-1 bg-[#2e2e33] px-10 py-10 rounded-lg flex flex-col">
                            <div className="grid grid-cols-1 gap-x-12">
                                <ResultRow
                                    label={t('roi_result_operators_reduced')}
                                    value={results.operatorsReduced.toFixed(1)}
                                    large
                                    tooltip={t('roi_operators_tooltip')}
                                />
                                <ResultRow
                                    label={t('roi_result_gross_savings')}
                                    value={<EurValue amount={results.grossSavings} />}
                                    accent large
                                />
                            </div>

                            <div className="border-t border-[#626271] pt-6 mt-2 mb-8">
                                <p className="text-supero-mid-grey text-[14px] xl:text-[17px] leading-[155%] text-center tracking-wider mb-2">
                                    {t('roi_result_payback')}
                                    <InfoTooltip text={model === 'license' ? t('roi_payback_tooltip_license') : t('roi_payback_tooltip_saas')} />
                                </p>
                                <p className="text-white font-bold text-[38px] xl:text-[48px] leading-tight text-center">
                                    {formatPayback(results.paybackMonths, t)}
                                </p>
                            </div>

                            <button
                                onClick={handleGetStarted}
                                className="mt-auto w-full group relative overflow-hidden bg-supero-green hover:bg-transparent border border-supero-green text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[19px] tracking-wider justify-between"
                            >
                                <span className="relative z-10 uppercase">{t('roi_get_started')}</span>
                                <ArrowIcon />
                            </button>

                            <p className="text-supero-mid-grey text-[14px] xl:text-[17px] leading-[155%] mt-4 opacity-70">
                                {t('roi_disclaimer')}
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
