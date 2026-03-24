import React, { useState } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import OtherDocumentList from './OtherDocumentList';
import DocumentVesselList from './DocumentVesselList';
import './DashboardOtherDocument.scss';

export interface DashboardProps {
    userId: string;
}

const DashboardOtherDocuments: React.FC<DashboardProps> = ({ userId }) => {
    const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);

    const handleVesselSelection = (selectedIds: number[]) => {
        setSelectedVesselId(selectedIds.length > 0 ? selectedIds[0] : null);
    };

    return (
        <div className='dashboard-wrapper other-documents-dashboard'>
            <Splitter style={{ height: 'calc(100vh - 100px)' }}>
                <SplitterPanel size={25} minSize={15}>
                    <DocumentVesselList onSelectionChange={handleVesselSelection} />
                </SplitterPanel>
                <SplitterPanel size={75} minSize={50}>
                    <OtherDocumentList vesselId={selectedVesselId} />
                </SplitterPanel>
            </Splitter>
        </div>
    );
};

export default DashboardOtherDocuments;
