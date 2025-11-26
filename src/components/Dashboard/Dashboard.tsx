import React, { useEffect, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import Dashboard_Manual from './Manuals/Dashboard_Manual';
import Dashboard_Circulars from './Circulars/Dashboard_Circulars';
import './Dashboard.scss';

export interface DashboardProps {
    userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
    const [activeIndex, setActiveIndex] = useState(0);
  
    return (
         <div className="dashboard-main" style={{border: "2px solid #6d6d6d"}}>
            <TabView 
                activeIndex={activeIndex} 
                onTabChange={(e) => setActiveIndex(e.index)}
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
            </TabView>
        </div>
    );
};

export default Dashboard;