import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dmsLifecycleService from '../../../services/DMSLifecycleService';

export interface CircularsProps {
    userId: string;
}

const Dashboard_Circulars: React.FC<CircularsProps> = ({ userId }) => {
    const [circulars, setCirculars] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchCirculars = () => {
        setLoading(true);
        dmsLifecycleService.getApiCall(`DMS/GetUserCirculars?userId=${userId}`)
            .then((data: any) => {
                if (data && Array.isArray(data)) {
                    setCirculars(data);
                }
            })
            .catch((error) => {
                console.error('Failed to fetch circulars:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCirculars();
    }, [userId]);

    return (
        <div className="circulars-container">
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>
                        <i className="pi pi-envelope"></i> Recent Circulars
                    </h3>
                    <button className="refresh-btn" onClick={fetchCirculars}>
                        <i className="pi pi-refresh"></i>
                        Refresh
                    </button>
                </div>
                <div className="circulars-list">
                    {loading ? (
                        <div className="loading-state">
                            <i className="pi pi-spin pi-spinner"></i>
                            <span>Loading circulars...</span>
                        </div>
                    ) : circulars.length === 0 ? (
                        <div className="empty-state">
                            <i className="pi pi-inbox"></i>
                            <span>No circulars available</span>
                        </div>
                    ) : (
                        circulars.map((circular) => (
                            <div 
                                key={circular.id} 
                                className="circular-item"
                                onClick={() => navigate(`/circular/${circular.id}`)}
                            >
                                <div className="circular-icon">
                                    <i className="pi pi-envelope"></i>
                                </div>
                                <div className="circular-content">
                                    <div className="circular-title">{circular.title}</div>
                                    <div className="circular-description">{circular.description}</div>
                                    <div className="circular-meta">
                                        <span className="circular-date">
                                            <i className="pi pi-calendar"></i>
                                            {new Date(circular.date).toLocaleDateString()}
                                        </span>
                                        <span className="circular-category">
                                            <i className="pi pi-tag"></i>
                                            {circular.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard_Circulars;