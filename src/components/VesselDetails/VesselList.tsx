import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import { Vessel } from './VesselDetails';

interface VesselListProps {
    vessels: Vessel[];
    selectedVesselIdList?: number[];
    onSelectionChange?: (selected: number[]) => void;
    isViewMode?: boolean;
    }

const VesselList: React.FC<VesselListProps> = ({ vessels, selectedVesselIdList, onSelectionChange, isViewMode }) => {

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedVessels, setSelectedVessels] = useState<Vessel[]>([]);
    const [selectedVesselType, setSelectedVesselType] = useState<string | null>(null);
    const [vesselTypeOptions, setVesselTypeOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        dmsLifecycleService.apiCall('Vessel/GetVslType')
            .then(data => {
                const options = data.map((cat: any) => ({
                    label: cat,
                    value: cat
                }));
                setVesselTypeOptions(options);
            })
            .catch(() => setVesselTypeOptions([]));

    }, []);
    
    useEffect(() => {
        const selectedVesselsFromIds = vessels.filter(vessel =>
            selectedVesselIdList?.includes(vessel.vesselID)
        );

        setSelectedVessels(selectedVesselsFromIds);
	    setIsLoading(false);
    }, [vessels, selectedVesselIdList]);

    const filteredVessels = vessels.filter(vessel => {
        const vslType = vessel.vslType || '';
        
        const vslTypeMatch = selectedVesselType
            ? (vslType && vslType.toUpperCase() === selectedVesselType.toUpperCase())
            : true;
        
        return vslTypeMatch;
   });

    const handleSelectionChange = (e: any) => {
        if (isViewMode) return;
        setSelectedVessels(e.value);
        onSelectionChange && onSelectionChange(e.value);
    };

    return (
        <div className='vessel-details-container'>
            <div>
                <label className="headerLabel">Vessel List</label>
            </div>
            <div className="p-inputgroup mb-2">
                <InputText
                    placeholder="Search..."
                    style={{ height: '38px' }}
                />
                <button
                    type="button"
                    className="manual-action-btn"
                    title="Search"
                    style={{
                        marginLeft: '8px',
                        verticalAlign: 'middle'
                    }}
                    onClick={() => alert('Search clicked!')}
                >
                   <i className="pi pi-search" style={{ fontSize: '1.2rem' }}></i>
                </button>
            </div>
            <div className="p-inputgroup mb-2" style={{ alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold', width: '50px' }}>Type: </label>
                <Dropdown
                    value={selectedVesselType}
                    options={vesselTypeOptions}
                    onChange={e => setSelectedVesselType(e.value)}
                    placeholder="Select Vessel Type"
                    style={{ width: '10px', height: '40px', verticalAlign: 'middle' }}
                    showClear
                />
            </div>
            <div>
                <DataTable
                    value={filteredVessels}
                    loading={isLoading}
                    selection={selectedVessels}
                    onSelectionChange={isViewMode ? undefined : handleSelectionChange}
                    selectionMode="checkbox"
                    dataKey="vesselID"
                    scrollable scrollHeight="470px"
                    emptyMessage={isLoading ? 'Loading...' : 'No vessel found.'}
                    className="vessel-rank-list p-datatable-gridlines"
                    style={{ width: '100%' }}
                >
                    <Column
                        selectionMode="multiple"
                        bodyStyle={{ width: '50px', verticalAlign: 'center', textAlign: 'center' }}
                        body={isViewMode ? (rowData => <input type="checkbox" checked={selectedVessels.some(v => v.vesselID === rowData.vesselID)} disabled />) : undefined}
                    />
                    <Column field="vslName" header="Name" sortable bodyStyle={{ width: '400px' }} />
                    <Column field="vslType" header="Type" sortable bodyStyle={{ width: '100px' }} />
                    <Column field="vesselID" header="ID" sortable hidden={true} />
                </DataTable>
            </div>
        </div>
    );
};

export default VesselList;