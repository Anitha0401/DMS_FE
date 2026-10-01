import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import PageHeader from '../PageHeader';
import DashboardManual from './Manuals/DashboardManual';
import DashboardCirculars from './Circulars/DashboardCirculars';
import DashboardOtherDocuments from './OtherDocuments/DashboardOtherDocument';
import DashboardVesselSyncStatus from './VesselSyncStatus/DashboardVesselSyncStatus';
import './Dashboard.scss';

export interface DashboardProps {
    userId: string;
}

const tabMapping: Record<string, number> = {
    manuals: 0,
    circulars: 1,
    otherdocuments: 2,
    vesselsyncstatus: 3,
};

const tabNames = ['manuals', 'circulars', 'otherdocuments', 'vesselsyncstatus'];

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const location = useLocation();

    useEffect(() => {
        const requestedTab =
            location.state?.activeTab ||
            localStorage.getItem('lastDashboardTab') ||
            'manuals';

        setActiveIndex(tabMapping[requestedTab] ?? 0);
    }, [location.state]);

    const handleTabChange = (event: { index: number }) => {
        const nextIndex = event.index;
        setActiveIndex(nextIndex);
        localStorage.setItem(
            'lastDashboardTab',
            tabNames[nextIndex] ?? 'manuals'
        );
    };

    return (
        <>
        <PageHeader title="Dashboard" />
        <main className="dashboard-main">

            <TabView
                activeIndex={activeIndex}
                onTabChange={handleTabChange}
                className="dashboard-tabs"
            >
                <TabPanel
                    header={
                        <div className="tab-header">
                            <i className="pi pi-book" />
                            <span>Manuals</span>
                        </div>
                    }
                >
                    <DashboardManual userId={userId} />
                </TabPanel>

                <TabPanel
                    header={
                        <div className="tab-header">
                            <i className="pi pi-bell" />
                            <span>Circulars &amp; Alerts</span>
                        </div>
                    }
                >
                    <DashboardCirculars userId={userId} />
                </TabPanel>

                <TabPanel
                    header={
                        <div className="tab-header">
                            <i className="pi pi-folder-open" />
                            <span>Other Documents</span>
                        </div>
                    }
                >
                    <DashboardOtherDocuments userId={userId} />
                </TabPanel>

                <TabPanel
                    header={
                        <div className="tab-header">
                            <i className="pi pi-sync" />
                            <span>Vessel Sync Status</span>
                        </div>
                    }
                >
                    <DashboardVesselSyncStatus />
                </TabPanel>
            </TabView>
        </main>
        </>
    );
};

export default Dashboard;