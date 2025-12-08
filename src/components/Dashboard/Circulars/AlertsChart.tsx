import React, { useState } from 'react';
import { Chart } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title,
    CategoryScale,
    LinearScale,
    BarElement
} from 'chart.js';
import { SelectButton } from 'primereact/selectbutton';
import './CircularsChart.scss';

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement);

const AlertsChart = () => {
    const [chartType, setChartType] = useState('doughnut');

    const chartTypeOptions = [
        { icon: 'pi pi-chart-doughnut', value: 'doughnut', label: 'Doughnut' },
        { icon: 'pi pi-chart-pie', value: 'doughnut', label: 'Pie' },
        { icon: 'pi pi-chart-pie', value: 'doughnut', label: 'Pie' },
        { icon: 'pi pi-chart-pie', value: 'pie', label: 'Pie' },
        { icon: 'pi pi-chart-bar', value: 'bar', label: 'Bar' }
    ];

    const itemTemplate = (option: any) => {
        return (
            <div className="chart-type-option" title={option.label}>
                <i className={option.icon}></i>
            </div>
        );
    };

    const data = {
        labels: ['Safety', 'Operational', 'Technical', 'Compliance'],
        datasets: [
            {
                label: 'Alerts Count',
                data: [12, 19, 3, 5],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
                text: 'Alerts Status',
            },
        },
    };

    return (
        <div className="circulars-chart-container">
            <div className="chart-header">
                <h4 style={{margin: 0}}>Alerts by Category</h4>
                <SelectButton 
                    value={chartType} 
                    options={chartTypeOptions} 
                    onChange={(e) => setChartType(e.value)} 
                    itemTemplate={(option) => <i className={option.icon}></i>}
                />
            </div>
            <Chart type={chartType as 'doughnut' | 'pie' | 'bar'} data={data} options={options} />
        </div>
    );
};

export default AlertsChart;
