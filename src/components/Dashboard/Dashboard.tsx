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
                header="Circulars & Alerts" 
                leftIcon="pi pi-envelope"
            >
               <Dashboard_Circulars userId={userId} />
            </TabPanel>
            <TabPanel 
                header="Quick Actions" 
                leftIcon="pi pi-bolt"
            ></TabPanel>
        </TabView>
        </div>
    );
};

export default Dashboard;