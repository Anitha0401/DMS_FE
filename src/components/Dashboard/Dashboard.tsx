import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import DashboardManual from './Manuals/DashboardManual';
import DashboardCirculars from './Circulars/DashboardCirculars';
import DashboardOtherDocuments from './OtherDocuments/DashboardOtherDocument';
import './Dashboard.scss';

export interface DashboardProps {
    userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const location = useLocation();

    // Map tab names to indices
    const tabMapping: { [key: string]: number } = {
        'manuals': 0,
        'circulars': 1,
        'otherdocuments': 2
    };

    useEffect(() => {
        // Get last opened tab from localStorage or location state
        const lastTab = location.state?.activeTab || localStorage.getItem('lastDashboardTab') || 'manuals';
        console.log('Last opened tab:', lastTab);
        // Set active index based on the tab name
        const index = tabMapping[lastTab] ?? 0; // Default to manuals (index 0)
        setActiveIndex(index);
    }, [location.state]);

    const handleTabChange = (e: any) => {
        setActiveIndex(e.index);
        
        // Save the tab name to localStorage
        const tabName = e.index === 0 ? 'manuals' : 'circulars';
        console.log('tabName:', tabName);
        localStorage.setItem('lastDashboardTab', tabName);
    };

    return (
         <div className="dashboard-main" style={{border: "2px solid #6d6d6d"}}>
            <TabView 
                activeIndex={activeIndex} 
                onTabChange={handleTabChange}
                className="dashboard-tabs"
            >
                <TabPanel 
                     header={
                        <div className="tab-header">
                            <i className="pi pi-book"></i>
                            <span>Manuals</span>
                        </div>
                    }
                >
                    <DashboardManual userId={userId} />
                </TabPanel>
                <TabPanel 
                   header={
                        <div className="tab-header">
                            <i className="pi pi-envelope"></i>
                            <span>Circulars & Alerts</span>
                        </div>
                    }
                >
                <DashboardCirculars userId={userId} />
                </TabPanel>
                <TabPanel 
                   header={
                        <div className="tab-header">
                            <i className="pi pi-envelope"></i>
                            <span>Other Documents</span>
                        </div>
                    }
                >
                <DashboardOtherDocuments userId={userId} />
                </TabPanel>
            </TabView>
        </div>
    );
};

export default Dashboard;