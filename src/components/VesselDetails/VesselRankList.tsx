import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { VesselRank } from './VesselDetails';

interface VesselRankListProps {
    vslRank: VesselRank[];
    selectedVesselRankList?: string[];
    onSelectionChange?: (selected: number[]) => void;
    isViewMode?: boolean;
}

const VesselRankList: React.FC<VesselRankListProps> = ({ vslRank, selectedVesselRankList, onSelectionChange, isViewMode }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedVslRank, setSelectedVslRank] = useState<VesselRank[]>([]);
    const [selectedVslDept, setSelectedVslDept] = useState<string | null>(null);
    const [vesselDeptOptions, setVesselDeptOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        setVesselDeptOptions([
            { label: 'Deck', value: 'd' },
            { label: 'Engine', value: 'e' },
            { label: 'Electrical', value: 'l' }
        ]);

    }, []);


    useEffect(() => {
        const selectedVslRanks = vslRank.filter(vessel =>
            selectedVesselRankList?.includes(vessel.userRank)
        );
        setSelectedVslRank(selectedVslRanks)
	    setIsLoading(false);
    }, [vslRank, selectedVesselRankList]);


    const filteredVessels = vslRank.filter(vsl => {
        const dept = vsl.userDept || '';
        const deptMatch = selectedVslDept
            ? (dept && dept.toUpperCase() === selectedVslDept.toUpperCase())
            : true;
        
        return deptMatch;
   });

    const handleSelectionChange = (e: any) => {
        if (isViewMode) return;
        setSelectedVslRank(e.value);
        onSelectionChange && onSelectionChange(e.value);
    };

    return (
        <div className='vessel-details-container'>
            <div>
                 <label className="headerLabel">Vessel Staff List</label>
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
                <label style={{ fontWeight: 'bold', width: '50px' }}>Dept: </label>
                <Dropdown
                    value={selectedVslDept}
                    options={vesselDeptOptions}
                    onChange={e => setSelectedVslDept(e.value)}
                    placeholder="Select Dept"
                    style={{ width: '10px', height: '40px', verticalAlign: 'middle' }}
                    showClear
                />
            </div>
            <div>
                <DataTable
                    value={filteredVessels}
                    loading={isLoading}
                    selection={selectedVslRank}
                    onSelectionChange={isViewMode ? undefined : handleSelectionChange}
                    selectionMode="checkbox"
                    dataKey="userRank"
                    scrollable 
                    emptyMessage={isLoading ? 'Loading...' : 'No user found.'}
                    className="vessel-rank-list p-datatable-gridlines"
                >
                    <Column
                        selectionMode="multiple"
                        bodyStyle={{ width: '50px', verticalAlign: 'center', textAlign: 'center' }}
                        body={isViewMode ? (rowData => <input type="checkbox" checked={selectedVslRank.some(v => v.userRank === rowData.userRank)} disabled />) : undefined}
                    />
                    <Column field="userRank" header="Rank" sortable bodyStyle={{ width: '120px' }}  />
                    <Column field="userDeptDisplay" header="Dept" sortable bodyStyle={{ width: '120px' }}  />
                    <Column field="userDept" header="Dept" sortable hidden={true} />
                </DataTable>
            </div>
        </div>
    );
};

export default VesselRankList;