import React, { useEffect, useState } from 'react';
import './Dashboard.scss';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export interface ManualDetailsProps {
    userId: string;
}

const Dashboard: React.FC<ManualDetailsProps> = ({ userId }) => {
    const [approvalCnt, setApprovalCnt] = useState(0); 
    const [reviewCnt, setReviewCnt] = useState(0);
    const [ackCnt, setAckCnt] = useState(0);
    const [newCnt, setNewCnt] = useState(0);
    const [favouriteCnt, setFavouriteCnt] = useState(0);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const navigate = useNavigate();
    
    const { theme, setTheme, themeOptions } = useTheme();

    const handleBrowseManuals = () => {
        navigate('/main'); // or whatever your main page route is
    };

    const setUserActionCounts = () => {
        dmsLifecycleService.apiCall(`DMS/GetUserManualCounts?userId=${userId}`, 'get')
            .then((data: any) => {
                if (data) {
                    setApprovalCnt(data.approvalCnt || 0);
                    setReviewCnt(data.reviewCnt || 0);
                    setAckCnt(data.ackCnt || 0);
                    setNewCnt(data.newCnt || 0);
                    setFavouriteCnt(data.favouriteCnt || 0);
                    setTotalDocuments((data.approvalCnt || 0) + (data.reviewCnt || 0) + (data.ackCnt || 0) + (data.newCnt || 0));
                }
            })
            .catch(() => {
                setApprovalCnt(0);
                setReviewCnt(0);
                setAckCnt(0);
                setNewCnt(0);
                setFavouriteCnt(0);
            });
    };

    useEffect(() => {   
        setUserActionCounts();
    }, [userId]);

    // Chart data
    const chartData = {
        labels: ['New Documents', 'Under Review', 'Pending Approval', 'Acknowledged'],
        datasets: [
            {
                data: [newCnt, reviewCnt, approvalCnt, ackCnt],
                backgroundColor: [
                    '#0072bc',
                    '#17a2b8',
                    '#ffc107',
                    '#28a745'
                ],
                borderWidth: 0
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        }
    };

    const getProgressBarClass = (count: number) => {
        if (count === 0) return 'p-progressbar-success';
        if (count <= 5) return 'p-progressbar-info';
        if (count <= 15) return 'p-progressbar-warning';
        return 'p-progressbar-danger';
    };

   // ...existing code...

return (
    <div className='wrapper'>
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>Document Management Dashboard</h1>
                        <p className="subtitle">Welcome back! Document Management Overview</p>
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
                <div className="stat-card primary">
                    <div className="stat-content">
                        <div className="stat-icon">
                            <i className="pi pi-file"></i>
                        </div>
                        <div className="stat-details">
                            <div className="stat-number">{totalDocuments}</div>
                            <div className="stat-label">Total Documents</div>
                        </div>
                    </div>
                    <div className="stat-footer">
                        <span className="stat-description">All accessible documents</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-content">
                        <div className="stat-icon">
                            <i className="pi pi-star-fill"></i>
                        </div>
                        <div className="stat-details">
                            <div className="stat-number">{favouriteCnt}</div>
                            <div className="stat-label">My Favorites</div>
                        </div>
                    </div>
                    <div className="stat-footer">
                        <span className="stat-description">Bookmarked documents</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content">
                {/* Document Status Chart */}
                <div className="dashboard-card chart-card">
                    <div className="card-header">
                        <h3>Document Status Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <Chart type="doughnut" data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Action Items */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Action Required</h3>
                    </div>
                    <div className="action-items">
                        <div className={`action-item ${approvalCnt > 0 ? 'has-action' : ''}`}>
                            <div className="action-icon approval">
                                <i className="pi pi-check-circle"></i>
                            </div>
                            <div className="action-content">
                                <div className="action-title">Pending Approvals</div>
                                <div className="action-count">{approvalCnt} documents need approval</div>
                            </div>
                            {approvalCnt > 0 && <div className="action-badge">{approvalCnt}</div>}
                        </div>

                        <div className={`action-item ${reviewCnt > 0 ? 'has-action' : ''}`}>
                            <div className="action-icon review">
                                <i className="pi pi-eye"></i>
                            </div>
                            <div className="action-content">
                                <div className="action-title">Under Review</div>
                                <div className="action-count">{reviewCnt} documents under review</div>
                            </div>
                            {reviewCnt > 0 && <div className="action-badge">{reviewCnt}</div>}
                        </div>

                        <div className={`action-item ${ackCnt > 0 ? 'has-action' : ''}`}>
                            <div className="action-icon acknowledge">
                                <i className="pi pi-thumbs-up"></i>
                            </div>
                            <div className="action-content">
                                <div className="action-title">Acknowledgment Required</div>
                                <div className="action-count">{ackCnt} documents need acknowledgment</div>
                            </div>
                            {ackCnt > 0 && <div className="action-badge">{ackCnt}</div>}
                        </div>

                        <div className={`action-item ${newCnt > 0 ? 'has-new' : ''}`}>
                            <div className="action-icon new">
                                <i className="pi pi-plus-circle"></i>
                            </div>
                            <div className="action-content">
                                <div className="action-title">New Documents</div>
                                <div className="action-count">{newCnt} new documents available</div>
                            </div>
                            {newCnt > 0 && <div className="action-badge new-badge">{newCnt}</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-stats">
              <div className="dashboard-card">
                  <div className="card-header">
                      <h3>Quick Actions</h3>
                  </div>
                  <div className="quick-actions">
                      <div className="action-grid">
                          <div className="action-btn" onClick={handleBrowseManuals}>
                              <i className="pi pi-file-o"></i>
                              <div className="action-label">Browse Manuals</div>
                              <div className="action-desc">View all documents</div>
                          </div>
                          <div className="action-btn" onClick={() => window.location.href = '/search'}>
                              <i className="pi pi-search"></i>
                              <div className="action-label">Search</div>
                              <div className="action-desc">Find documents</div>
                          </div>
                      </div>
                  </div>
              </div>
               <div className="dashboard-card">
                   <div className="card-header">
                      <h3>Notification</h3>
                  </div>
                  <div className="quick-actions">
                      <div className="action-grid">
                         <div className="action-label">New manual "Test Manual" added</div>
                      </div>
                  </div>
                </div>
            </div>
        </div>
    </div>
);
};
export default Dashboard;