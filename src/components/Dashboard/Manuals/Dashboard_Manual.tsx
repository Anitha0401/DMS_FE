import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import MetricCard from './MetricCard';
import ManualChart from './ManualChart';
import ActionItem from './ActionItem';
import NotificationList from './NotificationList';

export interface DashboardProps {
    userId: string;
}

const Dashboard_Manual: React.FC<DashboardProps> = ({ userId }) => {
    const [newCnt, setNewCnt] = useState(0);
    const [toApprovalCnt, setToApprovalCnt] = useState(0); 
    const [toAckCnt, setToAckCnt] = useState(0); 
    const [releasedCnt, setReleasedCnt] = useState(0); 
    const [userToApproveCnt, setUserToApproveCnt] = useState(0);
    const [userToReviewCnt, setUserToReviewCnt] = useState(0);
    const [userToAckCnt, setUserToAckCnt] = useState(0);
    const [favouriteCnt, setFavouriteCnt] = useState(0);
    const [totalDocuments, setTotalDocuments] = useState(0);
    
    const navigate = useNavigate();
    const { theme, setTheme, themeOptions } = useTheme();

    const handleBrowseManuals = () => {
        navigate('/main');
    };

    const setUserActionCounts = () => {
        dmsLifecycleService.getApiCall(`DMS/GetDashboardManualCounts?userId=${userId}`)
            .then((data: any) => {
                if (data) {
                    setNewCnt(data.newCnt || 0);
                    setToApprovalCnt(data.toApprovalCnt || 0);
                    setReleasedCnt(data.releasedCnt || 0);
                    setToAckCnt(data.toAckCnt || 0);
                    setUserToApproveCnt(data.userToApproveCnt || 0);
                    setUserToReviewCnt(data.userToReviewCnt || 0);
                    setUserToAckCnt(data.userToAckCnt || 0);
                    setFavouriteCnt(data.favouriteCnt || 0);
                    // Fix: Include toAckCnt in total calculation
                    setTotalDocuments((data.newCnt || 0) + (data.toApprovalCnt || 0) + (data.releasedCnt || 0) + (data.toAckCnt || 0));
                }
            })
            .catch(() => {
                setNewCnt(0);
                setToApprovalCnt(0);
                setReleasedCnt(0);
                setToAckCnt(0);
                setUserToApproveCnt(0);
                setUserToReviewCnt(0);
                setUserToAckCnt(0);
                setFavouriteCnt(0);
                setTotalDocuments(0);
            });
    };

    const metricsData = [
        { number: totalDocuments, label: "Total Documents", subtext: "All accessible documents", icon: "pi pi-file", css: "primary", color: "blue" },
        { number: newCnt, label: "New Documents", subtext: "Documents under preparation", icon: "pi pi-plus-circle", css: "info", color: "blue" },
        { number: favouriteCnt, label: "My Favorites", subtext: "Bookmarked documents", icon: "pi pi-star-fill", css: "success", color: "green" },
        { number: (userToApproveCnt + userToReviewCnt + userToAckCnt), label: "Action Required", subtext: "Pending actions", icon: "pi pi-exclamation-triangle", css: "warning", color: "red", isAction: true },
    ];

    const actionData = [
        { count: userToApproveCnt, text: "Pending Approvals", subtext: "documents need approval", icon: "pi pi-check-circle", css: "approval" },
        { count: userToReviewCnt, text: "Under Review", subtext: "documents under review", icon: "pi pi-eye", css: "review"},
        { count: userToAckCnt, text: "Acknowledgment Required", subtext: "documents need acknowledgment", icon: "pi pi-thumbs-up", css: "acknowledge"}
    ];

     const quickActions = [
        {
            label: 'Browse Manuals',
            icon: 'pi pi-file-o',
            color: 'primary',
            subText: 'View all manuals',
            action: () => navigate('/manuals')
        },
        {
            label: 'Search Manuals',
            icon: 'pi pi-search',
            color: 'primary',
            subText: 'Search manuals',
            action: () => navigate('/search')
        },
        {
            label: 'Reports',
            icon: 'pi pi-chart-bar',
            color: 'success',
            subText: 'Generate reports',
            action: () => navigate('/reports')
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
                                <i className="pi pi-th-large"></i>
                                Document Management Dashboard
                            </h1>
                            <p className="dashboard-subtitle">
                                Welcome back! Document Management Overview
                            </p>
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
                    <div className="charts-section">
                       <ManualChart 
                            newCnt={newCnt} 
                            toApprovalCnt={toApprovalCnt} 
                            releasedCnt={releasedCnt} 
                            toAckCnt={toAckCnt} 
                            totalDocuments={totalDocuments} 
                        />
                    </div>

                    <div className="dashboard-card action-card">
                        <div className="card-header">
                            <h3>Action Required</h3>
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

export default Dashboard_Manual;