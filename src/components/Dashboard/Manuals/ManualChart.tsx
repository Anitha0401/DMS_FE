import { Chart } from 'primereact/chart';


interface ChartProps {
    newCnt : number ;
    toApprovalCnt: number;
    releasedCnt: number;
    toAckCnt: number;
    totalDocuments: number;
}

const ManualChart: React.FC<ChartProps> = ({ newCnt, toApprovalCnt, releasedCnt, toAckCnt, totalDocuments }) => {
    // Bar chart data
    const barChartData = {
        labels: ['New Documents', 'Pending Approval', 'Released', 'To Acknowledge'],
        datasets: [
            {
                label: 'Document Count',
                data: [newCnt, toApprovalCnt, releasedCnt, toAckCnt],
                backgroundColor: [
                    'rgba(0, 114, 188, 0.8)',
                    'rgba(23, 162, 184, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(40, 167, 69, 0.8)'
                ],
                borderColor: [
                    '#0072bc',
                    '#17a2b8',
                    '#ffc107',
                    '#28a745'
                ],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }
        ]
    };

    // Bar chart options
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#2c3e50',
                titleColor: '#ffffff',
                bodyColor: '#e0e0e0',
                footerColor: '#cccccc',
                borderColor: 'var(--border-color)',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed.y || 0;
                        const total = totalDocuments;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: Math.max(totalDocuments * 1.2, Math.max(newCnt, toApprovalCnt, releasedCnt, toAckCnt) * 1.3),
                grid: {
                    color: 'var(--border-color)',
                    drawBorder: false
                },
                ticks: {
                    color: 'var(--text-secondary)',
                    font: {
                        size: 12
                    },
                    stepSize: Math.ceil(totalDocuments / 10) || 1,
                    callback: function(value: any) {
                        return Number.isInteger(value) ? value : '';
                    }
                },
                title: {
                    display: true,
                    text: `Total Documents: ${totalDocuments}`,
                    color: 'var(--text-primary)',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'var(--text-primary)',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    maxRotation: 45,
                    minRotation: 0
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    };

    return (
         <div className="dashboard-card chart-card">
            <div className="card-header">
                <h3>Document Status Overview</h3>
            </div>
            <div className="chart-container">
                <Chart type="bar" data={barChartData} options={barChartOptions} />                
            </div>
        </div>
    );
}

export default ManualChart;