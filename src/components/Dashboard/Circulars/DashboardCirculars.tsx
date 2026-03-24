import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import MetricCard from './MetricCardCicrular';
import NotificationList from './NotificationListCicrular';
import CircularsChart from './CircularsChart';
import RecentCircularsList from './RecentCircularsList';
import './RecentCircularsList.scss';

export interface DashboardProps {
    userId: string;
}

const DashboardCirculars: React.FC<DashboardProps> = ({ userId }) => {
    const [totalCirculars, setTotalCirculars] = useState(0);
    const [totalAlerts, setTotalAlerts] = useState(0);
    
    const navigate = useNavigate();
    const { theme, setTheme, themeOptions } = useTheme();

    const handleBrowseCirculars = () => {
        navigate('/main');
    };

    const setUserActionCounts = () => {
        dmsLifecycleService.getApiCall(`Circular/GetDashboardCircularCounts`)
            .then((data: any) => {
                console.log('Dashboard counts data:', data);
                if (data) {
                    setTotalCirculars(data.totalCirculars || 0);
                    setTotalAlerts(data.totalAlerts || 0);
                }
            })
            .catch(() => {
                setTotalCirculars(0);
                setTotalAlerts(0);
            });
    };

    const metricsData = [
        { 
            number: totalCirculars, 
            label: "Total Circulars", 
            subtext: "All accessible circulars",
            icon: "pi pi-envelope", 
            css: "primary", 
            color: "blue", 
            action: () => navigate('/circulars?cirmode=circulars') 
        },
        { 
            number: 0, 
            label: "View Circulars Report", 
            subtext: "Generate detailed reports",
            icon: "pi pi-chart-bar",
            css: "info", 
            color: "blue", 
            action: () => navigate('/circularreports?cirmode=circulars') 
        },
        { 
            number: totalAlerts, 
            label: "Total Alerts", 
            subtext: "All accessible alerts", 
            icon: "pi pi-bell", 
            css: "primary", 
            color: "blue", 
            action: () => navigate('/circulars?cirmode=alerts') 
        },
        { 
            number: 0, 
            label: "View Alerts Report", 
            subtext: "Generate detailed reports", 
            icon: "pi pi-chart-bar", 
            css: "info", 
            color: "blue", 
            action: () => navigate('/circularreports?cirmode=alerts') 
        },
    ];

    useEffect(() => {   
        setUserActionCounts();
    }, [userId]);
   
    return (
        <div className='dashboard-wrapper'>
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-content">
                        <div>
                             <h1 className="dashboard-title">
                                <i className="pi pi-megaphone"></i>
                                Circulars & Alerts Dashboard
                            </h1>
                        </div>
                        <div className="header-actions">
                            <Dropdown 
                                value={theme} 
                                options={themeOptions} 
                                onChange={(e) => setTheme(e.value)}
                                optionLabel="label"
                                optionValue="value"
                                className="theme-selector"
                                placeholder="Select Theme"
                            />
                            <button className="refresh-btn" onClick={setUserActionCounts}>
                                <i className="pi pi-refresh"></i>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-stats">
                    {metricsData.map((data, index) => (
                        <MetricCard key={index} {...data} />
                    ))}
                </div>

                <div className="dashboard-content-circulars">
                    <div className="dashboard-card">
                        <RecentCircularsList userId={userId} circularType="circulars" limit={5} />
                    </div>
                    <div className="dashboard-card">
                        <CircularsChart circularType="circulars" />
                    </div>
                    <div className="dashboard-card">
                        <RecentCircularsList userId={userId} circularType="alerts" limit={5} />
                    </div>
                    <div className="dashboard-card">
                        <CircularsChart circularType="alerts" />
                    </div>
                 </div>

                <div className="dashboard-stats">
                   <div className="dashboard-card notifications-card">
                       <NotificationList userId={userId}></NotificationList>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardCirculars;