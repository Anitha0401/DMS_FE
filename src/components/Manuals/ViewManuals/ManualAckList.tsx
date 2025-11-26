import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './ManualAckList.scss';

export interface ackProps {
    dm_ManualID: number;
    closeForm: () => void;
}

export interface ackDetails {
    vslCode: string;
    vslName: string;
    userID: string;
    userName: string;
    userRank: string;
    version: string;
    dateRead: Date;
    comments: string;
    dm_ManualID: number;
    dm_ManualVersionID: number;
    vesselID: string;
}

const ManualAckList: React.FC<ackProps> = ({dm_ManualID, closeForm}) => {
    const [ackManualData, setAckManualData] = useState<ackDetails[]>([]);

    useEffect(() => {
        dmsLifecycleService.getApiCall(`DMS/GetManualUserAckList/${dm_ManualID}`)
                .then((data: any) => {
                    setAckManualData(data);
                })
                .catch(() => {
                    setAckManualData([]);
                });
    }, [dm_ManualID]);
    
    return (
        <div className="manual-details">
            <DataTable
                value={ackManualData}
                paginator
                rows={10}  
                 emptyMessage={
                    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                       'No data found.'
                    </span>
                }
                className="manual-list p-datatable-gridlines"
                style={{ width: '100%' }}>
                <Column field="vslCode" header="Vessel Code" style={{width: '150px'}} />
                <Column field="vslName" header="Vessel Name" style={{width: '150px'}} />
                <Column field="userID" header="User ID" style={{width: '150px'}} />
                <Column field="userName" header="User Name" style={{width: '150px'}} />
                <Column field="userRank" header="User Rank" style={{width: '150px'}} />
                <Column field="version" header="Version" style={{width: '150px'}} />
                <Column field="dateRead" header="Date Read" style={{width: '150px'}} />
                <Column field="comments" header="Comments" style={{width: '150px'}} />
                <Column field="vesselID" header="Vessel ID" style={{width: '150px'}} />
            </DataTable>
            </div>
    );
}
export default ManualAckList;
