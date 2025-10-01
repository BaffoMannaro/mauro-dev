/* eslint-disable react/prop-types */
import { useLayoutEffect, useRef } from 'react';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

export default function TestChart(props) {
    const series1Ref = useRef(null);

    const xAxisRef = useRef(null);

    const chartRef = useRef(null);

    const colorTheme = {
        light: [
            am5.color(0xf6f6f6),
            am5.color(0xe7e7e7),
            am5.color(0xd1d1d1),
            am5.color(0xb0b0b0),
            am5.color(0x888888),
        ],
        dark: [
            am5.color(0xf0f6ff),
            am5.color(0xe0ecfe),
            am5.color(0xbad9fd),
            am5.color(0x7cbbfd),
            am5.color(0x3798f9),
        ],
    };

    const themeChart = colorTheme[props.theme];

    const colorLabel = {
        light: 'black',
        dark: 'white',
    };

    const themeLabel = colorLabel[props.theme];
    // This code will only run one time
    useLayoutEffect(() => {
        let root = am5.Root.new(props.id);

        let myTheme = am5themes_Animated.new(root);

        myTheme.rule('AxisLabel').setAll({
            fill: themeLabel,
            fontSize: '.8em',
        });

        myTheme.rule('Label').setAll({
            fill: themeLabel,
            fontSize: '.8em',
        });

        root.setThemes([myTheme, am5themes_Animated.new(root)]);

        let chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: true,
                panY: true,
                wheelX: 'panX',
                wheelY: 'zoomX',
                pinchZoomX: true,
                paddingLeft: 0,
                paddingRight: 1,
            })
        );

        // Add cursor
        // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
        let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
        cursor.lineY.set('visible', false);

        chart.get('colors').set('colors', themeChart);

        let xRenderer = am5xy.AxisRendererX.new(root, {
            minGridDistance: 30,
            minorGridEnabled: true,
        });

        xRenderer.labels.template.setAll({
            rotation: -90,
            centerY: am5.p50,
            centerX: am5.p100,
            paddingRight: 15,
        });

        xRenderer.grid.template.setAll({
            location: 1,
        });

        let xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                maxDeviation: 0.3,
                categoryField: 'label',
                renderer: xRenderer,
                tooltip: am5.Tooltip.new(root, {}),
            })
        );

        let yRenderer = am5xy.AxisRendererY.new(root, {
            strokeOpacity: 0.1,
        });

        let yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                maxDeviation: 0.3,
                renderer: yRenderer,
            })
        );

        let series1 = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: 'Series 1',
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: 'value',
                sequencedInterpolation: true,
                categoryXField: 'label',
                tooltip: am5.Tooltip.new(root, {
                    labelText: '{valueY}',
                }),
            })
        );

        series1.columns.template.setAll({
            cornerRadiusTL: 5,
            cornerRadiusTR: 5,
            strokeOpacity: 1,
            stroke: 'black',
        });
        series1.columns.template.adapters.add('fill', function (fill, target) {
            return chart
                .get('colors')
                .getIndex(series1.columns.indexOf(target));
        });

        chartRef.current = chart;

        xAxisRef.current = xAxis;
        series1Ref.current = series1;

        chart.appear(500, 500);

        return () => {
            root.dispose();
        };
    }, [themeChart, themeLabel, props.id]);

    // This code will only run when props.data changes
    useLayoutEffect(() => {
        xAxisRef.current.data.setAll(props.data);
        series1Ref.current.data.setAll(props.data);
        chartRef.current.appear(2000, 500);
    }, [props]);

    return <div id={props.id} style={{ width: '100%', height: '400px' }}></div>;
}
