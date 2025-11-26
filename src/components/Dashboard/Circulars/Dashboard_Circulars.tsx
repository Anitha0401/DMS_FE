import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import MetricCard from './MetricCard_Cicrular';
import ActionItem from './ActionItem_Cicrular';
import NotificationList from './NotificationList_Cicrular';

export interface DashboardProps {
    userId: string;
}

const Dashboard_Circulars: React.FC<DashboardProps> = ({ userId }) => {
    const [newCircularsCnt, setNewCircularsCnt] = useState(0);
    const [newAlertsCnt, setNewAlertsCnt] = useState(0);
    const [toAckCircularsCnt, setToAckCircularsCnt] = useState(0); 
    const [toAckAlertsCnt, setToAckAlertsCnt] = useState(0); 
    const [totalCirculars, setTotalCirculars] = useState(0);
    const [totalAlerts, setTotalAlerts] = useState(0);
    
    const navigate = useNavigate();
    const { theme, setTheme, themeOptions } = useTheme();

    const handleBrowseCirculars = () => {
        navigate('/main');
    };

    const setUserActionCounts = () => {
        dmsLifecycleService.getApiCall(`DMS/GetDashboardManualCounts?userId=${userId}`)
            .then((data: any) => {
                if (data) {
                    setTotalCirculars(data.totalCirculars || 0);
                    setTotalAlerts(data.totalAlerts || 0);
                    setNewCircularsCnt(data.newCircularsCnt || 0);
                    setNewAlertsCnt(data.newAlertsCnt || 0);
                    setToAckCircularsCnt(data.toAckCircularsCnt || 0);
                    setToAckAlertsCnt(data.toAckAlertsCnt || 0);
                }
            })
            .catch(() => {
                setTotalCirculars(0);
                setTotalAlerts(0);
                setNewCircularsCnt(0);
                setNewAlertsCnt(0);
                setToAckCircularsCnt(0);
                setToAckAlertsCnt(0);
            });
    };

    const metricsData = [
        { number: totalCirculars, label: "Total Circulars", subtext: "All accessible circulars", icon: "pi pi-envelope", css: "primary", color: "blue" },
        { number: newCircularsCnt, label: "New Circulars", subtext: "Circulars under preparation", icon: "pi pi-send", css: "info", color: "blue" },
        { number: totalAlerts, label: "Total Alerts", subtext: "All accessible alerts", icon: "pi pi-bell", css: "primary", color: "blue" },
        { number: newAlertsCnt, label: "New Alerts", subtext: "Alerts under preparation", icon: "pi pi-exclamation-circle", css: "info", color: "blue" },
    ];

    const actionData = [
        { count: toAckCircularsCnt, text: "Pending Approvals", subtext: "documents need approval", icon: "pi pi-check-circle", css: "approval" },
        { count: toAckAlertsCnt, text: "Under Review", subtext: "documents under review", icon: "pi pi-eye", css: "review"},
        { count: toAckAlertsCnt, text: "To Acknowledge", subtext: "documents need acknowledgment", icon: "pi pi-verified", css: "acknowledge"},
    ];

     const quickActions = [
        {
            label: 'Browse Circulars',
            icon: 'pi pi-inbox',
            color: 'primary',
            subText: 'View all circulars',
            action: () => navigate('/circulars')
        },
       {
            label: 'Browse Alerts',
            icon: 'pi pi-bell',
            color: 'primary',
            subText: 'View all alerts',
            action: () => navigate('/alerts')
        },
        {
            label: 'Reports',
            icon: 'pi pi-chart-bar',
            color: 'success',
            subText: 'Generate reports',
            action: () => navigate('/circularreports')
        }
    ];

    useEffect(() => {   
        setUserActionCounts();
    }, [userId]);
   
    return (
        <div className='dashboard-wrapper'>
            <div className="dashboard-container">
                {/* Header */}
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

                {/* Key Metrics Cards */}
                <div className="dashboard-stats">
                    {metricsData.map((data, index) => (
                        <MetricCard key={index} {...data} />
                    ))}
                </div>

                <div className="dashboard-content">
                    <div className="dashboard-card action-card">
                        <div className="card-header">
                            <h3>Circulars Action Required</h3>
                        </div>
                        <div className="action-items">
                            {actionData.map((data, index) => (
                                <ActionItem key={index} {...data} />
                            ))}
                           
                        </div>
                    </div>

                    <div className="dashboard-card action-card">
                        <div className="card-header">
                            <h3>Alerts Action Required</h3>
                        </div>
                        <div className="action-items">
                            {actionData.map((data, index) => (
                                <ActionItem key={index} {...data} />
                            ))}
                           
                        </div>
                    </div>
                 </div>

                {/* Quick Actions */}
                <div className="dashboard-stats">
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>
                         <div className="quick-actions-grid">
                            {quickActions.map((action, index) => (
                                <div 
                                    key={index}
                                    className={`quick-action-card quick-action-${action.color}`}
                                    onClick={action.action}
                                >
                                   <div className="action-icon-wrapper">
                                        <i className={action.icon}></i>
                                    </div>
                                    <h3>{action.label}</h3>
                                    <div className="action-desc">{action.subText}</div>
                                </div>
                            ))}
                        </div>
                      
                    </div>  

                    {/* Notifications */}
                   <div className="dashboard-card notifications-card">
                       <NotificationList userId={userId}></NotificationList>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard_Circulars;