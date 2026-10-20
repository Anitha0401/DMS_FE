import React from 'react';
import PageHeader from '../PageHeader';
import DashboardVesselSyncStatus from './VesselSyncStatus/DashboardVesselSyncStatus';
import './Dashboard.scss';

/** Vessel sync status as its own page (header link). It used to be a Dashboard tab. */
const VesselSyncPage: React.FC = () => (
    <>
        <PageHeader title="Vessel sync status" />
        <main className="dashboard-main">
            <DashboardVesselSyncStatus />
        </main>
    </>
);

export default VesselSyncPage;
