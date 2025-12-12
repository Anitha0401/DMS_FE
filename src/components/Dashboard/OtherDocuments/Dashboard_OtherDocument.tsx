import React, { useState } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import OtherDocumentList from './OtherDocumentList';
import DocumentVesselList from './DocumentVesselList';
import './Dashboard_OtherDocument.scss';

export interface DashboardProps {
    userId: string;
}

const Dashboard_OtherDocuments: React.FC<DashboardProps> = ({ userId }) => {
    const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);

    const handleVesselSelection = (selectedIds: number[]) => {
        setSelectedVesselId(selectedIds.length > 0 ? selectedIds[0] : null);
    };

    return (
        <div className='dashboard-wrapper other-documents-dashboard'>
            <Splitter style={{ height: 'calc(100vh - 100px)' }}>
                <SplitterPanel size={40} minSize={20}>
                    <DocumentVesselList onSelectionChange={handleVesselSelection} />
                </SplitterPanel>
                <SplitterPanel size={60} minSize={50}>
                    <OtherDocumentList vesselId={selectedVesselId} />
                </SplitterPanel>
            </Splitter>
        </div>
    );
};

export default Dashboard_OtherDocuments;
