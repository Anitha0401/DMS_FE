import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { useTheme } from '../../contexts/ThemeContext';
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
    const { theme, setTheme, themeOptions } = useTheme();

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
        <main className="dashboard-main">
            <div className="dashboard-heading">
                <h1>Document Management Dashboard</h1>

                <div className="header-actions">
                    <Dropdown
                        value={theme}
                        options={themeOptions}
                        onChange={(event) => setTheme(event.value)}
                        optionLabel="label"
                        optionValue="value"
                        className="theme-selector"
                        placeholder="Select Theme"
                    />
                    <button
                        type="button"
                        className="refresh-btn"
                        onClick={() => window.location.reload()}
                    >
                        <i className="pi pi-refresh" />
                        Refresh
                    </button>
                </div>
            </div>

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
    );
};

export default Dashboard;