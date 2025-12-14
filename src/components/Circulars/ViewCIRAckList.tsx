import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Skeleton } from 'primereact/skeleton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './CircularsList.scss';

interface AckList {
    cIR_UserAckID: string;
    vsselID: string;
    vslName: string;
    acknowledgedBy: string;
    dateRead: string;
    status: 'Acknowledged' | 'Pending' | 'Overdue';
    comments?: string;
}

interface CircularsListProps {
    ciR_MasterID: number;
    ciR_Number: string;
    title?: string;
}

const ViewCIRAckList: React.FC<CircularsListProps> = ({ ciR_MasterID, ciR_Number, title }) => {
    const [ackList, setAckList] = useState<AckList[]>([]);
    const [filteredAckList, setFilteredAckList] = useState<AckList[]>([]);
    const [vesselFilter, setVesselFilter] = useState<string>('all');
    const [vesselOptions, setVesselOptions] = useState<{ label: string; value: string }[]>([{ label: 'All Vessels', value: 'all' }]);
    const [ackLoading, setAckLoading] = useState(false);
  
    useEffect(() => {
        fetchAckList(ciR_MasterID);
    }
    , [ciR_MasterID]);

    useEffect(() => {
        if (vesselFilter === 'all') {
            setFilteredAckList(ackList);
        } else {
            setFilteredAckList(ackList.filter(item => item.vslName === vesselFilter));
        }
    }, [vesselFilter, ackList]);

    const fetchAckList = async (circularId: number) => {
        setAckLoading(true);
        
        setTimeout(async () => {
            const ackList: AckList[] = await dmsLifecycleService.getApiCall(`Circular/GetVesselAckList/${circularId}`);
            setAckList(ackList);
            setFilteredAckList(ackList);
            
            // Extract unique vessels for filter dropdown
            const vessels = Array.from(new Set(ackList.map(item => item.vslName)));
            const vesselOpts = [{ label: 'All Vessels', value: 'all' }, ...vessels.map(v => ({ label: v, value: v }))];
            setVesselOptions(vesselOpts);
            setVesselFilter('all');
            
            setAckLoading(false);
        }, 500);
    };
    
    const getAckStatusColor = (status: string) => {
        switch (status) {
            case 'Acknowledged': return 'success';
            case 'Pending': return 'warning';
            case 'Overdue': return 'danger';
            default: return 'info';
        }
    };

    const ackStatusBodyTemplate = (rowData: AckList) => {
        return <Tag value={rowData.status} severity={getAckStatusColor(rowData.status)} />;
    };

     return (
      <div className="ack-list-section">
        <div className="selected-circular-info">
            <div className="circular-header">
                <div className="circular-details">
                    <h3>{ciR_Number}</h3>
                    <p>{title}</p>
                </div>
                <div className="filter-group">
                    <label htmlFor="vessel-filter">Vessel:</label>
                    <Dropdown
                        id="vessel-filter"
                        value={vesselFilter}
                        options={vesselOptions}
                        onChange={(e) => setVesselFilter(e.value)}
                        placeholder="Select Vessel"
                        style={{ width: '250px' }}
                    />
                </div>
            </div>
        </div>

        <div className="ack-table-container">
            {ackLoading ? (
                <div className="skeleton-table">
                    <Skeleton width="100%" height="300px" />
                </div>
            ) : (
                <DataTable 
                    value={filteredAckList} 
                    className="ack-table"
                    scrollable 
                    scrollHeight="flex"
                    stripedRows
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 20, 50]}
                    emptyMessage="No acknowledgment records found"
                >
                    <Column field="vslName" header="Vessel Name" sortable />
                    <Column field="acknowledgedBy" header="Acknowledged By" sortable />
                    <Column field="dateRead" header="Date" sortable />
                    <Column field="status" header="Status" body={ackStatusBodyTemplate} sortable />
                    <Column field="remarks" header="Remarks" />
                </DataTable>
            )}
        </div>
      </div>
     );
}

export default ViewCIRAckList;