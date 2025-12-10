import React, { useState, useEffect, useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title,
    CategoryScale,
    LinearScale,
    BarElement,
    Plugin
} from 'chart.js';
import { SelectButton } from 'primereact/selectbutton';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './CircularsChart.scss';

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement);

interface CircularsChartProps {
    circularType: string;
}

const CircularsChart: React.FC<CircularsChartProps> = ({ circularType }) => {
    const [chartType, setChartType] = useState('doughnut');
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const chartTypeOptions = useMemo(() => [
        { icon: 'pi pi-chart-pie', value: 'doughnut', label: 'Doughnut' },
        { icon: 'pi pi-circle', value: 'pie', label: 'Pie' },
        { icon: 'pi pi-chart-bar', value: 'bar', label: 'Bar' }
    ], []);

    useEffect(() => {
        fetchChartData();
    }, [circularType]);

    const fetchChartData = async () => {
        setLoading(true);
        try {
            const data = await dmsLifecycleService.getApiCall(`Circular/GetCIR_CategoryChartData?circularType=${circularType}`);
            
            if (data && Array.isArray(data) && data.length > 0) {
                const labels = data.map((item: any) => item.category || '');
                const values = data.map((item: any) => item.total || 0);
                
                setChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Circulars Count',
                            data: values,
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(255, 206, 86, 0.6)',
                                'rgba(255, 99, 132, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(153, 102, 255, 0.6)',
                                'rgba(255, 159, 64, 0.6)'
                            ],
                            borderColor: [
                                'rgba(75, 192, 192, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 1,
                        },
                    ],
                });
            } else if (data && typeof data === 'object' && data.category && data.total) {
                // Handle object response with category and total arrays
                setChartData({
                    labels: data.category || [],
                    datasets: [
                        {
                            label: 'Circulars Count',
                            data: data.total || [],
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(255, 206, 86, 0.6)',
                                'rgba(255, 99, 132, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(153, 102, 255, 0.6)',
                                'rgba(255, 159, 64, 0.6)'
                            ],
                            borderColor: [
                                'rgba(75, 192, 192, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 1,
                        },
                    ],
                });
            } else {
                console.warn('Unexpected data format:', data);
                setChartData(null);
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
            setChartData(null);
        } finally {
            setLoading(false);
        }
    };

    const getChartTitle = () => {
        const type = circularType?.toLowerCase() || 'circulars';
        switch (type) {
            case 'circulars':
                return 'Circulars by Category';
            case 'alerts':
                return 'Alerts by Category';
        }
    };

    const itemTemplate = (option: any) => {
        return (
            <div className="chart-type-option" title={option.label}>
                <i className={option.icon}></i>
            </div>
        );
    };

    const totalCount = useMemo(() => {
        if (chartData && chartData.datasets && chartData.datasets[0] && chartData.datasets[0].data) {
            return chartData.datasets[0].data.reduce((sum: number, val: number) => sum + val, 0);
        }
        return 0;
    }, [chartData]);

    const centerTextPlugin: Plugin = useMemo(() => ({
        id: 'centerText',
        afterDatasetsDraw(chart: any) {
            const ctx = chart.ctx;
            
            if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
                const { width, height } = chart;
                const chartArea = chart.chartArea;
                const centerX = (chartArea.left + chartArea.right) / 2;
                const centerY = (chartArea.top + chartArea.bottom) / 2;
                
                // Draw center total
                ctx.restore();
                const fontSize = (height / 150).toFixed(2);
                ctx.font = `bold ${fontSize}em sans-serif`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                
                const text = totalCount.toString();
                ctx.fillText(text, centerX, centerY);
                
                // Draw values on each slice
                const data = chart.data.datasets[0].data;
                const meta = chart.getDatasetMeta(0);
                
                ctx.font = `bold 12px sans-serif`;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                
                meta.data.forEach((element: any, index: number) => {
                    const { x, y } = element.tooltipPosition();
                    const value = data[index];
                    
                    if (value) {
                        ctx.fillText(value.toString(), x, y);
                    }
                });
                
                ctx.save();
            } else if (chart.config.type === 'bar') {
                // Draw values on top of each bar
                const data = chart.data.datasets[0].data;
                const meta = chart.getDatasetMeta(0);
                
                ctx.font = `bold 12px sans-serif`;
                ctx.fillStyle = 'rgba(117, 114, 114, 0.8)';
                ctx.textBaseline = 'bottom';
                ctx.textAlign = 'center';
                
                meta.data.forEach((element: any, index: number) => {
                    const value = data[index];
                    
                    if (value) {
                        const x = element.x;
                        const y = element.y;
                        ctx.fillText(value.toString(), x, y - 5);
                    }
                });
                
                ctx.save();
            }
        }
    }), [totalCount]);

    const options = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: {
                display: chartType !== 'bar',
                position: 'top' as const,
            },
            title: {
                display: false,
                text: 'Status',
            },
        },
        scales: chartType === 'bar' ? {
            y: {
                max: Math.ceil(totalCount * 1.1),
            },
            x: {
                grid: {
                    display: false
                }
            }
        } : undefined,
    }), [chartType, totalCount]);

    return (
        <div className="circulars-chart-container">
            <div className="chart-header">
                <h4 style={{margin: 0}}>{getChartTitle()}</h4>
                <SelectButton 
                    value={chartType} 
                    options={chartTypeOptions} 
                    onChange={(e) => setChartType(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    itemTemplate={(option) => <i className={option.icon} title={option.label}></i>}
                />
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                </div>
            ) : chartData ? (
                <Chart type={chartType as 'doughnut' | 'pie' | 'bar'} data={chartData} options={options} plugins={[centerTextPlugin]} />
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>No data available</div>
            )}
        </div>
    );
};

export default CircularsChart;