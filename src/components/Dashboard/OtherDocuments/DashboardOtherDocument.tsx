import React, { useState } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import OtherDocumentList from './OtherDocumentList';
import DocumentVesselList, { Vessel } from './DocumentVesselList';
import './DashboardOtherDocument.scss';

export interface DashboardProps {
    userId: string;
}

const DashboardOtherDocuments: React.FC<DashboardProps> = ({ userId }) => {
    const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
    const [selectedVesselName, setSelectedVesselName] = useState('');

    const handleVesselSelection = (selectedVessels: Vessel[]) => {
        const selectedVessel = selectedVessels[0];
        setSelectedVesselId(selectedVessel?.vesselID ?? null);
        setSelectedVesselName(selectedVessel?.vslName ?? '');
    };

    return (
        <div className='dashboard-wrapper other-documents-dashboard'>
            <Splitter style={{ height: 'calc(100vh - 100px)' }}>
                <SplitterPanel size={25} minSize={15}>
                    <DocumentVesselList onSelectionChange={handleVesselSelection} />
                </SplitterPanel>
                <SplitterPanel size={75} minSize={50}>
                    {selectedVesselId ? (
                        <OtherDocumentList
                            vesselId={selectedVesselId}
                            vesselName={selectedVesselName}
                        />
                    ) : (
                        <div className="document-selection-empty-state">
                            <i className="pi pi-info-circle" />
                            <span>Select a vessel to load its documents.</span>
                        </div>
                    )}
                </SplitterPanel>
            </Splitter>
        </div>
    );
};

export default DashboardOtherDocuments;
