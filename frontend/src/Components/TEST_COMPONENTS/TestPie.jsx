import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import { useLayoutEffect } from 'react';
import { useRef } from 'react';

export default function TestPie(props) {
    const chartRef = useRef(null);
    const series1Ref = useRef(null);

    useLayoutEffect(() => {
        let root = am5.Root.new(props.id);
        root.setThemes([am5themes_Animated.new(root)]);

        let chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                endAngle: 270,
            })
        );

        let series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: 'value',
                categoryField: 'label',
                endAngle: 270,
            })
        );

        chartRef.current = chart;
        series1Ref.current = series;

        chart.appear();

        return () => {
            root.dispose();
        };
    }, [props.id]);

    useLayoutEffect(() => {
        series1Ref.current.data.setAll(props.data);
    }, [props]);

    return <div id={props.id} style={{ width: '100%', height: '400px' }}></div>;
}

// Create series
// https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/#Series

/* series.states.create('hidden', {
    endAngle: -90,
});



series.appear(1000, 100); */
