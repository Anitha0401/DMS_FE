import React, { useEffect, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Badge } from 'primereact/badge';
import { Skeleton } from 'primereact/skeleton';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Dropdown } from 'primereact/dropdown';
import Dashboard_Manual from './Manuals/Dashboard_Manual';
import Dashboard_Circulars from './Circulars/Dashboard_Circulars';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './Dashboard.scss';

export interface DashboardProps {
    userId: string;
}

interface DashboardStats {
    totalManuals: number;
    totalCirculars: number;
    pendingApprovals: number;
    recentActivity: number;
    favoriteCount: number;
}

const Dashboard1: React.FC<DashboardProps> = ({ userId }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [stats, setStats] = useState<DashboardStats>({
        totalManuals: 0,
        totalCirculars: 0,
        pendingApprovals: 0,
        recentActivity: 0,
        favoriteCount: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { theme, setTheme, themeOptions } = useTheme();

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const data = await dmsLifecycleService.getApiCall(`DMS/GetDashboardStats?userId=${userId}`);
            if (data) {
                setStats({
                    totalManuals: data.totalManuals || 0,
                    totalCirculars: data.totalCirculars || 0,
                    pendingApprovals: data.pendingApprovals || 0,
                    recentActivity: data.recentActivity || 0,
                    favoriteCount: data.favoriteCount || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, [userId]);

    const quickActions = [
        {
            label: 'Browse Manuals',
            icon: 'pi pi-book',
            color: 'primary',
            action: () => navigate('/manuals')
        },
        {
            label: 'View Circulars',
            icon: 'pi pi-envelope',
            color: 'info',
            action: () => navigate('/circulars')
        },
        {
            label: 'My Approvals',
            icon: 'pi pi-check-circle',
            color: 'warning',
            badge: stats.pendingApprovals,
            action: () => navigate('/approvals')
        },
        {
            label: 'Favorites',
            icon: 'pi pi-star-fill',
            color: 'success',
            badge: stats.favoriteCount,
            action: () => navigate('/favorites')
        },
        {
            label: 'Search Documents',
            icon: 'pi pi-search',
            color: 'primary',
            action: () => navigate('/search')
        },
        {
            label: 'Upload Document',
            icon: 'pi pi-upload',
            color: 'info',
            action: () => navigate('/upload')
        },
        {
            label: 'Reports',
            icon: 'pi pi-chart-bar',
            color: 'success',
            action: () => navigate('/reports')
        },
        {
            label: 'Settings',
            icon: 'pi pi-cog',
            color: 'secondary',
            action: () => navigate('/settings')
        }
    ];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                {/* Dashboard Header */}
                <div className="dashboard-header">
                    <div className="header-content">
                        <div className="header-left">
                            <h1 className="dashboard-title">
                                <i className="pi pi-th-large"></i>
                                Document Management Dashboard
                            </h1>
                            <p className="dashboard-subtitle">
                                Welcome back! Here's your document overview
                            </p>
                        </div>
                        <div className="header-right">
                            <Dropdown 
                                value={theme} 
                                options={themeOptions} 
                                onChange={(e) => setTheme(e.value)}
                                optionLabel="label"
                                optionValue="value"
                                className="theme-dropdown"
                                placeholder="Theme"
                            />
                            <button 
                                className="refresh-btn" 
                                onClick={fetchDashboardStats}
                                disabled={loading}
                            >
                                <i className={`pi pi-refresh ${loading ? 'pi-spin' : ''}`}></i>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Overview */}
                <div className="dashboard-stats-grid">
                    {loading ? (
                        <>
                            <Skeleton width="100%" height="120px" borderRadius="12px" />
                            <Skeleton width="100%" height="120px" borderRadius="12px" />
                            <Skeleton width="100%" height="120px" borderRadius="12px" />
                            <Skeleton width="100%" height="120px" borderRadius="12px" />
                        </>
                    ) : (
                        <>
                            <div className="stat-card stat-card-primary">
                                <div className="stat-icon">
                                    <i className="pi pi-book"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.totalManuals}</h3>
                                    <p>Total Manuals</p>
                                </div>
                                <div className="stat-trend">
                                    <i className="pi pi-arrow-up"></i>
                                    <span>Active</span>
                                </div>
                            </div>

                            <div className="stat-card stat-card-info">
                                <div className="stat-icon">
                                    <i className="pi pi-envelope"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.totalCirculars}</h3>
                                    <p>Circulars & Alerts</p>
                                </div>
                                <div className="stat-trend">
                                    <i className="pi pi-arrow-up"></i>
                                    <span>Active</span>
                                </div>
                            </div>

                            <div className="stat-card stat-card-warning">
                                <div className="stat-icon">
                                    <i className="pi pi-clock"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.pendingApprovals}</h3>
                                    <p>Pending Approvals</p>
                                </div>
                                {stats.pendingApprovals > 0 && (
                                    <div className="stat-badge">
                                        <Badge value={stats.pendingApprovals} severity="warning" />
                                    </div>
                                )}
                            </div>

                            <div className="stat-card stat-card-success">
                                <div className="stat-icon">
                                    <i className="pi pi-star-fill"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.favoriteCount}</h3>
                                    <p>My Favorites</p>
                                </div>
                                <div className="stat-trend">
                                    <i className="pi pi-heart"></i>
                                    <span>Saved</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Main Tab View */}
                <div className="dashboard-main">
                    <TabView 
                        activeIndex={activeIndex} 
                        onTabChange={(e) => setActiveIndex(e.index)}
                        className="dashboard-tabs"
                    >
                        <TabPanel 
                            header="Manuals" 
                            leftIcon="pi pi-book"
                        >
                            <Dashboard_Manual userId={userId} />
                        </TabPanel>

                        <TabPanel 
                            header={
                                <span className="tab-header-with-badge">
                                    Circulars & Alerts
                                    {stats.totalCirculars > 0 && (
                                        <Badge value={stats.totalCirculars} severity="info" />
                                    )}
                                </span>
                            }
                            leftIcon="pi pi-envelope"
                        >
                            <Dashboard_Circulars userId={userId} />
                        </TabPanel>

                        <TabPanel 
                            header="Quick Actions" 
                            leftIcon="pi pi-bolt"
                        >
                            <div className="quick-actions-container">
                                <div className="quick-actions-header">
                                    <h2>
                                        <i className="pi pi-bolt"></i>
                                        Quick Actions
                                    </h2>
                                    <p>Frequently used actions for faster navigation</p>
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
                                                {action.badge && action.badge > 0 && (
                                                    <Badge 
                                                        value={action.badge} 
                                                        severity="danger" 
                                                        className="action-badge"
                                                    />
                                                )}
                                            </div>
                                            <h3>{action.label}</h3>
                                            <div className="action-arrow">
                                                <i className="pi pi-arrow-right"></i>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel 
                            header="Analytics" 
                            leftIcon="pi pi-chart-line"
                        >
                            <div className="analytics-container">
                                <div className="analytics-header">
                                    <h2>
                                        <i className="pi pi-chart-line"></i>
                                        Document Analytics
                                    </h2>
                                    <p>Insights and statistics about your documents</p>
                                </div>
                                
                                <div className="analytics-placeholder">
                                    <i className="pi pi-chart-bar"></i>
                                    <h3>Analytics Coming Soon</h3>
                                    <p>Advanced analytics and reporting features will be available here</p>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel 
                            header={
                                <span className="tab-header-with-badge">
                                    Activity
                                    {stats.recentActivity > 0 && (
                                        <Badge value={stats.recentActivity} severity="success" />
                                    )}
                                </span>
                            }
                            leftIcon="pi pi-history"
                        >
                            <div className="activity-container">
                                <div className="activity-header">
                                    <h2>
                                        <i className="pi pi-history"></i>
                                        Recent Activity
                                    </h2>
                                    <p>Track your recent document interactions</p>
                                </div>
                                
                                <div className="activity-placeholder">
                                    <i className="pi pi-clock"></i>
                                    <h3>Activity Timeline Coming Soon</h3>
                                    <p>View your recent document activities and updates</p>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
        </div>
    );
};

export default Dashboard1;