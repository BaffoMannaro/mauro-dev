import React, { useEffect, useState } from 'react';

export default function Commitments() {
    const allData = [
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 1724,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 245,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '40',
                            ip_program: 'CRP',
                        },
                        {
                            name: null,
                            value: '42',
                            ip_program: 'FIM',
                        },
                        {
                            name: null,
                            value: '45',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '70',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '89',
                            ip_program: 'EHL',
                        },
                        {
                            name: null,
                            value: '102',
                            ip_program: 'CRR',
                        },
                        {
                            name: null,
                            value: '127',
                            ip_program: 'ALB',
                        },
                        {
                            name: null,
                            value: '154',
                            ip_program: 'DOC',
                        },
                        {
                            name: null,
                            value: '267',
                            ip_program: 'AJC',
                        },
                        {
                            name: null,
                            value: '543',
                            ip_program: 'MBZ',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 1730,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '1730',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 19,
                    subData: [
                        {
                            name: null,
                            value: '19',
                            value2: '18.7085400000000000',
                        },
                    ],
                },
            ],
            period_code: '2015-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 750,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 25,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '16',
                            ip_program: 'DOC',
                        },
                        {
                            name: null,
                            value: '16',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '23',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '24',
                            ip_program: 'CRL',
                        },
                        {
                            name: null,
                            value: '26',
                            ip_program: 'FIM',
                        },
                        {
                            name: null,
                            value: '60',
                            ip_program: 'CRJ',
                        },
                        {
                            name: null,
                            value: '70',
                            ip_program: 'EHS',
                        },
                        {
                            name: null,
                            value: '121',
                            ip_program: 'FZS',
                        },
                        {
                            name: null,
                            value: '146',
                            ip_program: 'ALB',
                        },
                        {
                            name: null,
                            value: '224',
                            ip_program: 'ALA',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 211,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '211',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 42,
                    subData: [
                        {
                            name: null,
                            value: '42',
                            value2: '42.0508616000000000',
                        },
                    ],
                },
            ],
            period_code: '2016-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 890,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 120,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '15',
                            ip_program: 'EHH',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'ALB',
                        },
                        {
                            name: null,
                            value: '23',
                            ip_program: 'EHL',
                        },
                        {
                            name: null,
                            value: '23',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '31',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '39',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '53',
                            ip_program: 'DOC',
                        },
                        {
                            name: null,
                            value: '54',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '494',
                            ip_program: 'AJC',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 592,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '592',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 41,
                    subData: [
                        {
                            name: null,
                            value: '41',
                            value2: '41.2838197000000000',
                        },
                    ],
                },
            ],
            period_code: '2016-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 366,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 61,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '8',
                            ip_program: 'AJC',
                        },
                        {
                            name: null,
                            value: '23',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '25',
                            ip_program: 'CRQ',
                        },
                        {
                            name: null,
                            value: '25',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '28',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '30',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '31',
                            ip_program: 'EHH',
                        },
                        {
                            name: null,
                            value: '33',
                            ip_program: 'AIU',
                        },
                        {
                            name: null,
                            value: '33',
                            ip_program: 'DOC',
                        },
                        {
                            name: null,
                            value: '69',
                            ip_program: 'FIM',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 52,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '52',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 191,
                    subData: [
                        {
                            name: null,
                            value: '191',
                            value2: '190.8726618500000000',
                        },
                    ],
                },
            ],
            period_code: '2016-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 799,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 138,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'AVD-P120C',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '24',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '28',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '29',
                            ip_program: 'DOC',
                        },
                        {
                            name: null,
                            value: '30',
                            ip_program: 'EHH',
                        },
                        {
                            name: null,
                            value: '34',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '83',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '109',
                            ip_program: 'CRR',
                        },
                        {
                            name: null,
                            value: '285',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 242,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '242',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 79,
                    subData: [
                        {
                            name: null,
                            value: '79',
                            value2: '79.1376446600000000',
                        },
                    ],
                },
            ],
            period_code: '2016-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 386,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 67,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '9',
                            ip_program: 'CRQ',
                        },
                        {
                            name: null,
                            value: '9',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '10',
                            ip_program: 'AJB',
                        },
                        {
                            name: null,
                            value: '14',
                            ip_program: 'EHL',
                        },
                        {
                            name: null,
                            value: '14',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '20',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '30',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '33',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '39',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '142',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 75,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '75',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 24,
                    subData: [
                        {
                            name: null,
                            value: '24',
                            value2: '23.5685178100000000',
                        },
                    ],
                },
            ],
            period_code: '2017-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 427,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 81,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '10',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '11',
                            ip_program: 'IAP3',
                        },
                        {
                            name: null,
                            value: '12',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'CRQ',
                        },
                        {
                            name: null,
                            value: '20',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '24',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '28',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '60',
                            ip_program: 'AVD-VEGA',
                        },
                        {
                            name: null,
                            value: '66',
                            ip_program: 'CRT',
                        },
                        {
                            name: null,
                            value: '103',
                            ip_program: 'MBZ',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 442,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '442',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 201,
                    subData: [
                        {
                            name: null,
                            value: '201',
                            value2: '201.4240091600000000',
                        },
                    ],
                },
            ],
            period_code: '2017-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 567,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 55,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '12',
                            ip_program: 'DOC',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'FIF',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'DPM',
                        },
                        {
                            name: null,
                            value: '30',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '34',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '38',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '56',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '274',
                            ip_program: 'CSG2017',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 282,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '282',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 109,
                    subData: [
                        {
                            name: null,
                            value: '109',
                            value2: '108.7819300900000000',
                        },
                    ],
                },
            ],
            period_code: '2017-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 961,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 277,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '37',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '41',
                            ip_program: 'IRIS',
                        },
                        {
                            name: null,
                            value: '41',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '55',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '59',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '62',
                            ip_program: 'AVD-VEGA',
                        },
                        {
                            name: null,
                            value: '81',
                            ip_program: 'CRL',
                        },
                        {
                            name: null,
                            value: '89',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '95',
                            ip_program: 'CRU',
                        },
                        {
                            name: null,
                            value: '124',
                            ip_program: 'AJB',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 329,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '329',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 49,
                    subData: [
                        {
                            name: null,
                            value: '49',
                            value2: '48.7556827100000000',
                        },
                    ],
                },
            ],
            period_code: '2017-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 313,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 65,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '10',
                            ip_program: 'AJC',
                        },
                        {
                            name: null,
                            value: '11',
                            ip_program: 'AJB',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'FIF',
                        },
                        {
                            name: null,
                            value: '14',
                            ip_program: 'KAC',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '42',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '44',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '58',
                            ip_program: 'ALA',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 387,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '387',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 28,
                    subData: [
                        {
                            name: null,
                            value: '28',
                            value2: '27.7262792300000000',
                        },
                    ],
                },
            ],
            period_code: '2018-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 567,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 82,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '16',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '19',
                            ip_program: 'FIF',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '36',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '37',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '38',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '70',
                            ip_program: 'EHS',
                        },
                        {
                            name: null,
                            value: '73',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '87',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '89',
                            ip_program: 'MBZ',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 131,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '131',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 30,
                    subData: [
                        {
                            name: null,
                            value: '30',
                            value2: '30.4871557300000000',
                        },
                    ],
                },
            ],
            period_code: '2018-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 715,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 71,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'EHL',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'AJB',
                        },
                        {
                            name: null,
                            value: '19',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '20',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '29',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '29',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '45',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '54',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '131',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '282',
                            ip_program: 'MBZ',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 364,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '364',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 34,
                    subData: [
                        {
                            name: null,
                            value: '34',
                            value2: '34.4809503800000000',
                        },
                    ],
                },
            ],
            period_code: '2018-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 812,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 84,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'CRL',
                        },
                        {
                            name: null,
                            value: '29',
                            ip_program: 'EHL',
                        },
                        {
                            name: null,
                            value: '41',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '45',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '45',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '51',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '72',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '97',
                            ip_program: 'CRU',
                        },
                        {
                            name: null,
                            value: '102',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '232',
                            ip_program: 'ALA',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 515,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '515',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 81,
                    subData: [
                        {
                            name: null,
                            value: '81',
                            value2: '81.1945370600000000',
                        },
                    ],
                },
            ],
            period_code: '2018-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 233,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 49,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '8',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '11',
                            ip_program: 'FIF',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'IAP3',
                        },
                        {
                            name: null,
                            value: '13',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '24',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '25',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '46',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 57,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '57',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 39,
                    subData: [
                        {
                            name: null,
                            value: '39',
                            value2: '39.1513351100000000',
                        },
                    ],
                },
            ],
            period_code: '2019-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 576,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 64,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '8',
                            ip_program: 'AJB',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'CRL',
                        },
                        {
                            name: null,
                            value: '22',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '22',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '31',
                            ip_program: 'CRS',
                        },
                        {
                            name: null,
                            value: '69',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '78',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '229',
                            ip_program: 'MBZ',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 189,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '189',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 36,
                    subData: [
                        {
                            name: null,
                            value: '36',
                            value2: '36.2703580200000000',
                        },
                    ],
                },
            ],
            period_code: '2019-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 388,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 57,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '7',
                            ip_program: 'AJB',
                        },
                        {
                            name: null,
                            value: '9',
                            ip_program: 'IAP3',
                        },
                        {
                            name: null,
                            value: '22',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '29',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '32',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '39',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '44',
                            ip_program: 'CCOMP',
                        },
                        {
                            name: null,
                            value: '45',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '48',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '57',
                            ip_program: 'CRS',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 153,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '153',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 21,
                    subData: [
                        {
                            name: null,
                            value: '21',
                            value2: '21.2785726000000000',
                        },
                    ],
                },
            ],
            period_code: '2019-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 1070,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 186,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '39',
                            ip_program: 'CSG2017',
                        },
                        {
                            name: null,
                            value: '39',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '48',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '62',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '75',
                            ip_program: 'EW9',
                        },
                        {
                            name: null,
                            value: '91',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '93',
                            ip_program: '',
                        },
                        {
                            name: null,
                            value: '99',
                            ip_program: 'CRU',
                        },
                        {
                            name: null,
                            value: '159',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '179',
                            ip_program: 'MBZ',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 197,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '197',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 140,
                    subData: [
                        {
                            name: null,
                            value: '140',
                            value2: '139.5024220800000000',
                        },
                    ],
                },
            ],
            period_code: '2019-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 537,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 55,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'ALB_DEBIT',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'ALB_CREDIT_GR',
                        },
                        {
                            name: null,
                            value: '22',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '23',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: null,
                            value: '24',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '32',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '35',
                            ip_program: 'GOVSAT8B',
                        },
                        {
                            name: null,
                            value: '45',
                            ip_program: 'CMU',
                        },
                        {
                            name: null,
                            value: '53',
                            ip_program: 'CSG2024',
                        },
                        {
                            name: null,
                            value: '207',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 18,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '18',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 23,
                    subData: [
                        {
                            name: null,
                            value: '23',
                            value2: '23.0160921700000000',
                        },
                    ],
                },
            ],
            period_code: '2020-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 801,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 92,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '10',
                            ip_program: 'S2P',
                        },
                        {
                            name: null,
                            value: '15',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '19',
                            ip_program: 'A4_BASS',
                        },
                        {
                            name: null,
                            value: '29',
                            ip_program: 'A4_PP',
                        },
                        {
                            name: null,
                            value: '30',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '42',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '44',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '51',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: null,
                            value: '207',
                            ip_program: 'A6TP',
                        },
                        {
                            name: null,
                            value: '264',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 144,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '144',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 208,
                    subData: [
                        {
                            name: null,
                            value: '208',
                            value2: '208.1575315800000000',
                        },
                    ],
                },
            ],
            period_code: '2020-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 1043,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 141,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '16',
                            ip_program: 'A4_BASS',
                        },
                        {
                            name: null,
                            value: '19',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '20',
                            ip_program: 'CSG2024',
                        },
                        {
                            name: null,
                            value: '27',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '39',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '40',
                            ip_program: 'CRV',
                        },
                        {
                            name: null,
                            value: '58',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: null,
                            value: '152',
                            ip_program: 'S2P',
                        },
                        {
                            name: null,
                            value: '162',
                            ip_program: 'CSC-4',
                        },
                        {
                            name: null,
                            value: '370',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 211,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '211',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 103,
                    subData: [
                        {
                            name: null,
                            value: '103',
                            value2: '103.2236861700000000',
                        },
                    ],
                },
            ],
            period_code: '2020-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 2043,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 523,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '55',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: null,
                            value: '63',
                            ip_program: 'S2P',
                        },
                        {
                            name: null,
                            value: '77',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '84',
                            ip_program: 'AJB',
                        },
                        {
                            name: null,
                            value: '97',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '125',
                            ip_program: 'CRV',
                        },
                        {
                            name: null,
                            value: '179',
                            ip_program: 'DOJ',
                        },
                        {
                            name: null,
                            value: '184',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '276',
                            ip_program: 'CSG2024',
                        },
                        {
                            name: null,
                            value: '380',
                            ip_program: 'CSC-4',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 276,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '276',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 49,
                    subData: [
                        {
                            name: null,
                            value: '49',
                            value2: '48.7400988400000000',
                        },
                    ],
                },
            ],
            period_code: '2020-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 403,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 123,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'FIF',
                        },
                        {
                            name: null,
                            value: '17',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'A4_BASS',
                        },
                        {
                            name: null,
                            value: '20',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '20',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '31',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '33',
                            ip_program: 'AWS',
                        },
                        {
                            name: null,
                            value: '34',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '70',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 224,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '224',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 23,
                    subData: [
                        {
                            name: null,
                            value: '23',
                            value2: '22.9621550100000000',
                        },
                    ],
                },
            ],
            period_code: '2021-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 850,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 149,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '28',
                            ip_program: 'A4_BASS',
                        },
                        {
                            name: null,
                            value: '30',
                            ip_program: 'PFFD',
                        },
                        {
                            name: null,
                            value: '31',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '36',
                            ip_program: 'A4_5G',
                        },
                        {
                            name: null,
                            value: '41',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '54',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '59',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '105',
                            ip_program: 'VEGACIE',
                        },
                        {
                            name: null,
                            value: '110',
                            ip_program: 'FLPP-PROM',
                        },
                        {
                            name: null,
                            value: '207',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 190,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '190',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 73,
                    subData: [
                        {
                            name: null,
                            value: '73',
                            value2: '73.4388760400000000',
                        },
                    ],
                },
            ],
            period_code: '2021-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 611,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 172,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '23',
                            ip_program: 'A4_OCS',
                        },
                        {
                            name: null,
                            value: '24',
                            ip_program: 'A6TP',
                        },
                        {
                            name: null,
                            value: '32',
                            ip_program: 'A6CIE',
                        },
                        {
                            name: null,
                            value: '38',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '38',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '43',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '44',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '46',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: null,
                            value: '68',
                            ip_program: 'AJC',
                        },
                        {
                            name: null,
                            value: '82',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 285,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '285',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 88,
                    subData: [
                        {
                            name: null,
                            value: '88',
                            value2: '87.8349896600000000',
                        },
                    ],
                },
            ],
            period_code: '2021-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 1168,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 292,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '45',
                            ip_program: 'VEGACIE',
                        },
                        {
                            name: null,
                            value: '46',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '53',
                            ip_program: 'CRW',
                        },
                        {
                            name: null,
                            value: '73',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '79',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '86',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: null,
                            value: '88',
                            ip_program: 'A6TP',
                        },
                        {
                            name: null,
                            value: '106',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '139',
                            ip_program: 'ALA',
                        },
                        {
                            name: null,
                            value: '160',
                            ip_program: 'CRV',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 942,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '942',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 113,
                    subData: [
                        {
                            name: null,
                            value: '113',
                            value2: '113.0892681800000000',
                        },
                    ],
                },
            ],
            period_code: '2021-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 705,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 107,
                            ip_program: 'Others',
                        },
                        {
                            name: null,
                            value: '14',
                            ip_program: 'CRW',
                        },
                        {
                            name: null,
                            value: '15',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'CSC-4',
                        },
                        {
                            name: null,
                            value: '18',
                            ip_program: 'FJB',
                        },
                        {
                            name: null,
                            value: '21',
                            ip_program: 'BAC',
                        },
                        {
                            name: null,
                            value: '27',
                            ip_program: 'QKD',
                        },
                        {
                            name: null,
                            value: '32',
                            ip_program: 'E3P',
                        },
                        {
                            name: null,
                            value: '54',
                            ip_program: 'CSG2024',
                        },
                        {
                            name: null,
                            value: '193',
                            ip_program: 'MBZ',
                        },
                        {
                            name: null,
                            value: '205',
                            ip_program: 'ALA',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 106,
                    subData: [
                        {
                            name: 'Others',
                            value: 0,
                        },
                        {
                            name: null,
                            value: '106',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 20,
                    subData: [
                        {
                            name: null,
                            value: '20',
                            value2: '19.5899897500000000',
                        },
                    ],
                },
            ],
            period_code: '2022-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 667,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 141,
                            ip_program: 'Others',
                        },
                        {
                            name: 'MetOp-SG',
                            value: '20',
                            ip_program: 'AJC',
                        },
                        {
                            name: 'Space for 5G',
                            value: '23',
                            ip_program: 'A4_5G',
                        },
                        {
                            name: 'CC Period 1',
                            value: '27',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: 'Science',
                            value: '30',
                            ip_program: 'MBZ',
                        },
                        {
                            name: '4S',
                            value: '34',
                            ip_program: 'A4_4S',
                        },
                        {
                            name: 'A6 CIE',
                            value: '44',
                            ip_program: 'A6CIE',
                        },
                        {
                            name: 'E3P',
                            value: '54',
                            ip_program: 'E3P',
                        },
                        {
                            name: 'Future EO',
                            value: '55',
                            ip_program: 'ALA',
                        },
                        {
                            name: 'Basic Act.',
                            value: '69',
                            ip_program: 'BAC',
                        },
                        {
                            name: 'CSC-4',
                            value: '171',
                            ip_program: 'CSC-4',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 426,
                    subData: [
                        {
                            name: 'Others',
                            value: 13,
                        },
                        {
                            name: 'ESA assistance agrmt to Italy',
                            value: '11',
                        },
                        {
                            name: 'P2 - TEC 3rd Party Projects',
                            value: '15',
                        },
                        {
                            name: 'Galileo',
                            value: '27',
                        },
                        {
                            name: 'Copernicus',
                            value: '360',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 34,
                    subData: [
                        {
                            name: 'Corporate',
                            value: '3',
                            value2: '3.2702266200000000',
                        },
                        {
                            name: 'Information Technology',
                            value: '4',
                            value2: '3.5477510700000000',
                        },
                        {
                            name: 'Facilities',
                            value: '13',
                            value2: '13.2562491700000000',
                        },
                        {
                            name: 'Manpower',
                            value: '14',
                            value2: '13.8376242900000000',
                        },
                    ],
                },
            ],
            period_code: '2022-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 589,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 193,
                            ip_program: 'Others',
                        },
                        {
                            name: 'FLPP 3',
                            value: '23',
                            ip_program: 'CRL',
                        },
                        {
                            name: 'FLPP ADV TECH',
                            value: '25',
                            ip_program: 'FLPP-AVTECH',
                        },
                        {
                            name: 'AVD-A6',
                            value: '28',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: 'AVD-P120C',
                            value: '30',
                            ip_program: 'AVD-P120C',
                        },
                        {
                            name: 'Future EO',
                            value: '33',
                            ip_program: 'ALA',
                        },
                        {
                            name: 'E3P',
                            value: '39',
                            ip_program: 'E3P',
                        },
                        {
                            name: 'CSC-4',
                            value: '43',
                            ip_program: 'CSC-4',
                        },
                        {
                            name: 'Science',
                            value: '50',
                            ip_program: 'MBZ',
                        },
                        {
                            name: 'Basic Act.',
                            value: '51',
                            ip_program: 'BAC',
                        },
                        {
                            name: '4S',
                            value: '74',
                            ip_program: 'A4_4S',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 237,
                    subData: [
                        {
                            name: 'Others',
                            value: 27,
                        },
                        {
                            name: 'H2020',
                            value: '31',
                        },
                        {
                            name: 'Third Parties - Earth Observation',
                            value: '34',
                        },
                        {
                            name: 'Copernicus',
                            value: '56',
                        },
                        {
                            name: 'Galileo',
                            value: '89',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 152,
                    subData: [
                        {
                            name: 'Corporate',
                            value: '5',
                            value2: '4.9341081500000000',
                        },
                        {
                            name: 'Information Technology',
                            value: '7',
                            value2: '7.1868022500000000',
                        },
                        {
                            name: 'Facilities',
                            value: '19',
                            value2: '18.9951984200000000',
                        },
                        {
                            name: 'Manpower',
                            value: '120',
                            value2: '120.4578167900000000',
                        },
                    ],
                },
            ],
            period_code: '2022-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 1936,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 319,
                            ip_program: 'Others',
                        },
                        {
                            name: 'P120C-ADAPT',
                            value: '33',
                            ip_program: 'P120C-ADAPT',
                        },
                        {
                            name: 'GSTP 6 DM&F',
                            value: '43',
                            ip_program: 'FJB',
                        },
                        {
                            name: 'Basic Act.',
                            value: '53',
                            ip_program: 'BAC',
                        },
                        {
                            name: 'CC Period 1',
                            value: '56',
                            ip_program: 'A4_CC',
                        },
                        {
                            name: 'A6 - Product Adapta...',
                            value: '58',
                            ip_program: 'A6-ADAPT',
                        },
                        {
                            name: 'Future EO',
                            value: '70',
                            ip_program: 'ALA',
                        },
                        {
                            name: 'LEAP 20 - end - A5 ...',
                            value: '145',
                            ip_program: 'CRV',
                        },
                        {
                            name: 'Science',
                            value: '240',
                            ip_program: 'MBZ',
                        },
                        {
                            name: 'CSC-4',
                            value: '393',
                            ip_program: 'CSC-4',
                        },
                        {
                            name: 'E3P',
                            value: '528',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 1519,
                    subData: [
                        {
                            name: 'Others',
                            value: 24,
                        },
                        {
                            name: 'Third Parties - Earth Observation',
                            value: '51',
                        },
                        {
                            name: 'ESA assistance agrmt to Italy',
                            value: '68',
                        },
                        {
                            name: 'Galileo',
                            value: '113',
                        },
                        {
                            name: 'Copernicus',
                            value: '1263',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 208,
                    subData: [
                        {
                            name: 'Information Technology',
                            value: '18',
                            value2: '17.6982797000000000',
                        },
                        {
                            name: 'Corporate',
                            value: '25',
                            value2: '24.5901567400000000',
                        },
                        {
                            name: 'Facilities',
                            value: '52',
                            value2: '51.6892980500000000',
                        },
                        {
                            name: 'Manpower',
                            value: '114',
                            value2: '113.5728817400000000',
                        },
                    ],
                },
            ],
            period_code: '2022-Q4',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 714,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 87,
                            ip_program: 'Others',
                        },
                        {
                            name: 'GSTP 6 DM&F',
                            value: '22',
                            ip_program: 'FJB',
                        },
                        {
                            name: 'ARTES CC - Period 2',
                            value: '22',
                            ip_program: 'A4_CC2',
                        },
                        {
                            name: 'S2P',
                            value: '23',
                            ip_program: 'S2P',
                        },
                        {
                            name: 'Future EO',
                            value: '25',
                            ip_program: 'ALA',
                        },
                        {
                            name: 'Basic Act.',
                            value: '26',
                            ip_program: 'BAC',
                        },
                        {
                            name: 'Product Adaptations...',
                            value: '30',
                            ip_program: 'PA-P120C',
                        },
                        {
                            name: 'PRODEX',
                            value: '38',
                            ip_program: 'FIF',
                        },
                        {
                            name: 'Science',
                            value: '62',
                            ip_program: 'MBZ',
                        },
                        {
                            name: 'VEGA CIE',
                            value: '102',
                            ip_program: 'VEGACIE',
                        },
                        {
                            name: 'E3P',
                            value: '277',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 759,
                    subData: [
                        {
                            name: 'Others',
                            value: 23,
                        },
                        {
                            name: 'National Programmes',
                            value: '13',
                        },
                        {
                            name: 'Galileo',
                            value: '57',
                        },
                        {
                            name: 'Copernicus',
                            value: '73',
                        },
                        {
                            name: 'ESA assistance agrmt to Italy',
                            value: '593',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 118,
                    subData: [
                        {
                            name: 'General Budget / Basic Activities',
                            value: '0',
                            value2: '0.27540320000000000000',
                        },
                        {
                            name: 'Corporate',
                            value: '12',
                            value2: '11.9154286500000000',
                        },
                        {
                            name: 'Facilities',
                            value: '13',
                            value2: '13.4375596000000000',
                        },
                        {
                            name: 'Information Technology',
                            value: '17',
                            value2: '17.3650476500000000',
                        },
                        {
                            name: 'Manpower',
                            value: '75',
                            value2: '74.5658117600000000',
                        },
                    ],
                },
            ],
            period_code: '2023-Q1',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 804,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 69,
                            ip_program: 'Others',
                        },
                        {
                            name: 'ARTES CC - Period 2',
                            value: '14',
                            ip_program: 'A4_CC2',
                        },
                        {
                            name: 'CSC-4',
                            value: '16',
                            ip_program: 'CSC-4',
                        },
                        {
                            name: 'PRODEX',
                            value: '23',
                            ip_program: 'FIF',
                        },
                        {
                            name: 'Product Adaptations...',
                            value: '24',
                            ip_program: 'PA-A6',
                        },
                        {
                            name: 'GSTP 6 DM&F',
                            value: '28',
                            ip_program: 'FJB',
                        },
                        {
                            name: 'Basic Act.',
                            value: '40',
                            ip_program: 'BAC',
                        },
                        {
                            name: 'Science',
                            value: '50',
                            ip_program: 'MBZ',
                        },
                        {
                            name: 'Future EO',
                            value: '56',
                            ip_program: 'ALA',
                        },
                        {
                            name: 'E3P',
                            value: '122',
                            ip_program: 'E3P',
                        },
                        {
                            name: 'CSG 2023-27',
                            value: '364',
                            ip_program: 'CSG2023',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 635,
                    subData: [
                        {
                            name: 'Others',
                            value: 51,
                        },
                        {
                            name: 'National Programmes',
                            value: '27',
                        },
                        {
                            name: 'Third Parties - Human Spaceflight',
                            value: '37',
                        },
                        {
                            name: 'ESA assistance agrmt to Italy',
                            value: '144',
                        },
                        {
                            name: 'Galileo',
                            value: '376',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 85,
                    subData: [
                        {
                            name: 'General Budget / Basic Activities',
                            value: '0',
                            value2: '0.000000000000000000000000',
                        },
                        {
                            name: 'Corporate',
                            value: '4',
                            value2: '4.0920119100000000',
                        },
                        {
                            name: 'Manpower',
                            value: '22',
                            value2: '21.8980060600000000',
                        },
                        {
                            name: 'Facilities',
                            value: '26',
                            value2: '26.1861755600000000',
                        },
                        {
                            name: 'Information Technology',
                            value: '32',
                            value2: '32.3692175800000000',
                        },
                    ],
                },
            ],
            period_code: '2023-Q2',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 812,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 180,
                            ip_program: 'Others',
                        },
                        {
                            name: 'SPACE RIDER',
                            value: '28',
                            ip_program: 'DOJ',
                        },
                        {
                            name: 'AVD-A6',
                            value: '29',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: 'ARTES CC - Period 2',
                            value: '33',
                            ip_program: 'A4_CC2',
                        },
                        {
                            name: 'CSC-4',
                            value: '35',
                            ip_program: 'CSC-4',
                        },
                        {
                            name: 'Product Adaptations...',
                            value: '35',
                            ip_program: 'PA-A6',
                        },
                        {
                            name: 'Product Adaptations...',
                            value: '40',
                            ip_program: 'PA-P120C',
                        },
                        {
                            name: 'Basic Act.',
                            value: '55',
                            ip_program: 'BAC',
                        },
                        {
                            name: 'Future EO',
                            value: '56',
                            ip_program: 'ALA',
                        },
                        {
                            name: 'S2P',
                            value: '110',
                            ip_program: 'S2P',
                        },
                        {
                            name: 'E3P',
                            value: '210',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 558,
                    subData: [
                        {
                            name: 'Others',
                            value: 20,
                        },
                        {
                            name: 'National Programmes',
                            value: '13',
                        },
                        {
                            name: 'ESA assistance agrmt to Italy',
                            value: '17',
                        },
                        {
                            name: '',
                            value: '53',
                        },
                        {
                            name: 'Galileo',
                            value: '455',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 33,
                    subData: [
                        {
                            name: 'General Budget / Basic Activities',
                            value: '0',
                            value2: '0.01750000000000000000',
                        },
                        {
                            name: '',
                            value: '0',
                            value2: '0.15995732000000000000',
                        },
                        {
                            name: 'Manpower',
                            value: '1',
                            value2: '0.55604805000000000000',
                        },
                        {
                            name: 'Corporate',
                            value: '5',
                            value2: '4.9045367000000000',
                        },
                        {
                            name: 'Information Technology',
                            value: '7',
                            value2: '6.7471999100000000',
                        },
                        {
                            name: 'Facilities',
                            value: '21',
                            value2: '21.0514969300000000',
                        },
                    ],
                },
            ],
            period_code: '2023-Q3',
        },
        {
            chart_data: [
                {
                    data: 'ESA Programmes',
                    value: 1317,
                    subData: [
                        {
                            name: 'Other Programmes',
                            value: 481,
                            ip_program: 'Others',
                        },
                        {
                            name: 'LEAP 23-25 A6 Expl ...',
                            value: '54',
                            ip_program: 'CRY',
                        },
                        {
                            name: 'Basic Act.',
                            value: '57',
                            ip_program: 'BAC',
                        },
                        {
                            name: 'A6TP Step 3',
                            value: '62',
                            ip_program: 'A6TP3',
                        },
                        {
                            name: 'S2P',
                            value: '69',
                            ip_program: 'S2P',
                        },
                        {
                            name: 'AVD-A6',
                            value: '72',
                            ip_program: 'AVD-A6',
                        },
                        {
                            name: 'TRUTHS',
                            value: '77',
                            ip_program: 'TRUTHS',
                        },
                        {
                            name: 'Product Adaptations...',
                            value: '91',
                            ip_program: 'PA-P120C',
                        },
                        {
                            name: 'Future EO',
                            value: '106',
                            ip_program: 'ALA',
                        },
                        {
                            name: 'Product Adaptations...',
                            value: '107',
                            ip_program: 'PA-A6',
                        },
                        {
                            name: 'E3P',
                            value: '142',
                            ip_program: 'E3P',
                        },
                    ],
                },
                {
                    data: 'Third Party',
                    value: 353,
                    subData: [
                        {
                            name: 'Others',
                            value: 53,
                        },
                        {
                            name: 'ESA assistance agrmt to Italy',
                            value: '51',
                        },
                        {
                            name: 'Galileo',
                            value: '71',
                        },
                        {
                            name: 'Copernicus',
                            value: '89',
                        },
                        {
                            name: 'EGNOS',
                            value: '90',
                        },
                    ],
                },
                {
                    data: 'Indirect',
                    value: 89,
                    subData: [
                        {
                            name: 'General Budget / Basic Activities',
                            value: '0',
                            value2: '0.17049700000000000000',
                        },
                        {
                            name: 'Corporate',
                            value: '7',
                            value2: '6.9438355900000000',
                        },
                        {
                            name: 'Information Technology',
                            value: '18',
                            value2: '17.7826092500000000',
                        },
                        {
                            name: 'Manpower',
                            value: '29',
                            value2: '29.2150300000000000',
                        },
                        {
                            name: 'Facilities',
                            value: '34',
                            value2: '34.4176413300000000',
                        },
                    ],
                },
            ],
            period_code: '2023-Q4',
        },
    ];

    console.log(allData, 'da');
    console.log(
        allData.sort((a, b) => a.period_code.localeCompare(b.period_code))
    );

    // index
    const [choosenQuarter, setChoosenQuarter] = useState(allData.length - 1);

    const [data, setData] = useState(allData.at(-1).chart_data);

    useEffect(() => {
        setData(allData[choosenQuarter].chart_data);
    }, [choosenQuarter]);

    return (
        <div>
            <div>
                <h1 className="mb-12">Commitments</h1>
            </div>
            <div>
                <input
                    type="range"
                    min={0}
                    max={allData.length - 1}
                    defaultValue={allData.length - 1}
                    onChange={(e) => setChoosenQuarter(e.target.value)}
                />
            </div>
            {allData[choosenQuarter].period_code}
            <pre>{JSON.stringify(data, null, 4)}</pre>
        </div>
    );
}
