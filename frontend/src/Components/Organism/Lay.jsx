import { Responsive, WidthProvider } from 'react-grid-layout';
import LinePlot from '../TEST_COMPONENTS/LinePlot';
import BarPlot from '../TEST_COMPONENTS/BarPlot';

const ResponsiveGridLayout = WidthProvider(Responsive);

const layout = [
    { i: 'box-1', x: 0, y: 0, w: 6, h: 1 },
    { i: 'box-2', x: 6, y: 0, w: 6, h: 1 },
    { i: 'box-3', x: 0, y: 0, w: 6, h: 1 },
    { i: 'box-4', x: 6, y: 0, w: 6, h: 1 },
    { i: 'box-5', x: 0, y: 0, w: 6, h: 1 },
    { i: 'box-6', x: 6, y: 0, w: 6, h: 1 },
];

const getLayouts = () => {
    const savedLayouts = localStorage.getItem('grid-layout');
    return savedLayouts ? JSON.parse(savedLayouts) : { lg: layout };
};

export default function Lay() {
    const handleLayoutChange = (layout, layouts) => {
        localStorage.setItem('grid-layout', JSON.stringify(layouts));
    };

    return (
        <div>
            <ResponsiveGridLayout
                draggableHandle=".drag-handle"
                layouts={getLayouts()}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 6, sm: 6, xs: 1, xxs: 1 }}
                rowHeight={300}
                width={1000}
                onLayoutChange={handleLayoutChange}
            >
                <div
                    className="shadow-lg rounded-md border border-slate-300 p-1 relative"
                    key="box-1"
                >
                    <div className="drag-handle absolute top-1 right-1 cursor-pointer z-10">
                        <i className="fal fa-arrows-alt"></i>
                    </div>
                    <p className="whitespace-nowrap overflow-hidden text-ellipsis w-11/12">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Eius, doloremque. Lorem ipsum dolor sit amet consectetur
                        adipisicing elit.
                    </p>
                    <LinePlot />
                </div>
                <div
                    className="shadow-lg rounded-md border border-slate-300 p-1 relative"
                    key="box-2"
                >
                    <div className="drag-handle absolute top-1 right-1 cursor-pointer z-10">
                        <i className="fal fa-arrows-alt"></i>
                    </div>

                    <p className="whitespace-nowrap overflow-hidden text-ellipsis w-11/12">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Eius, doloremque. Lorem ipsum dolor sit amet consectetur
                        adipisicing elit.
                    </p>
                    <BarPlot />
                </div>
                <div
                    className="shadow-lg rounded-md border border-slate-300 p-1 relative"
                    key="box-3"
                >
                    <div className="drag-handle absolute top-1 right-1 cursor-pointer z-10">
                        <i className="fal fa-arrows-alt"></i>
                    </div>

                    <div>box 3</div>
                </div>
                <div
                    className="shadow-lg rounded-md border border-slate-300 p-1 relative"
                    key="box-4"
                >
                    <div className="drag-handle absolute top-1 right-1 cursor-pointer z-10">
                        <i className="fal fa-arrows-alt"></i>
                    </div>

                    <div>box 4</div>
                </div>
                <div
                    className="shadow-lg rounded-md border border-slate-300 p-1 relative"
                    key="box-5"
                >
                    <div className="drag-handle absolute top-1 right-1 cursor-pointer z-10">
                        <i className="fal fa-arrows-alt"></i>
                    </div>

                    <div>box 5</div>
                </div>
                <div
                    className="shadow-lg rounded-md border border-slate-300 p-1 relative"
                    key="box-6"
                >
                    <div className="drag-handle absolute top-1 right-1 cursor-pointer z-10">
                        <i className="fal fa-arrows-alt"></i>
                    </div>

                    <div>box 6</div>
                </div>
            </ResponsiveGridLayout>
        </div>
    );
}
