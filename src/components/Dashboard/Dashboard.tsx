import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import Dashboard_Manual from './Manuals/Dashboard_Manual';
import Dashboard_Circulars from './Circulars/Dashboard_Circulars';
import './Dashboard.scss';
import Dashboard_OtherDocuments from './OtherDocuments/Dashboard_OtherDocument';

export interface DashboardProps {
    userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const location = useLocation();

    // Map tab names to indices
    const tabMapping: { [key: string]: number } = {
        'manuals': 0,
        'circulars': 1
    };

    useEffect(() => {
        // Get last opened tab from localStorage or location state
        const lastTab = location.state?.activeTab || localStorage.getItem('lastDashboardTab') || 'circulars';
        console.log('Last opened tab:', lastTab);
        // Set active index based on the tab name
        const index = tabMapping[lastTab] ?? 1; // Default to circulars (index 1)
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
                    <Dashboard_Manual userId={userId} />
                </TabPanel>
                <TabPanel 
                   header={
                        <div className="tab-header">
                            <i className="pi pi-envelope"></i>
                            <span>Circulars & Alerts</span>
                        </div>
                    }
                >
                <Dashboard_Circulars userId={userId} />
                </TabPanel>
                <TabPanel 
                   header={
                        <div className="tab-header">
                            <i className="pi pi-envelope"></i>
                            <span>Other Documents</span>
                        </div>
                    }
                >
                <Dashboard_OtherDocuments userId={userId} />
                </TabPanel>
            </TabView>
        </div>
    );
};

export default Dashboard;