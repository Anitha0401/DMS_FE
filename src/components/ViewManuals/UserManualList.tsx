import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './UserManualList.scss';
import { Dialog } from 'primereact/dialog';
import ManualDetails from './ManualDetails';
import { setError } from '../../store/slices/appSlice';

export interface UserManualProps {
    userId: string;
    callMode: string; // "PendingMyApproval" | "PendingMyReview" | "PendingMyAcknowledgement" | "NewDocuments" | "Favourites" | "ManualInfo"
}

export interface userDetails {
    categoryName: string;
    manualCode: string;
    manualName: string;
    version: string;
    statusString: string;
    isApprovalRequired: boolean;
    canExport: boolean;
    createdBy: string;
    createdDate: string;
    releasedBy: string;
    releasedDate: string;
    publishedBy: string;
    publishedDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    comments: string;
    dm_ManualID: string;
    dm_ManualVersionID: string;
}

const UserManualList: React.FC<UserManualProps> = ({callMode, userId}) => {
    const [visibleManualDetailsDialog, setVisibleManualDetailsDialog] = useState<boolean>(false);
    const [dm_ManualVersionID, setDm_ManualVersionID] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState(true);
  
    const [usersManualData, setUsersManualData] = useState<userDetails[]>([]);
    
    useEffect(() => {
        try {
            dmsLifecycleService.apiCall(`DMS/GetUserManualListForCalledMode?userID=${userId}&calledMode=${callMode}`, 'get')
                .then((data: any) => {
                   setUsersManualData(data);
                   setIsLoading(false);
              })
                .catch(() => {
                    setUsersManualData([]);
                });
            } catch (err: any) {
                setError(err.message || 'Error fetching data');
            } 
    }, []);
    
    const callManualDetails = (dm_ManualVersionID: number) => {
      setDm_ManualVersionID(dm_ManualVersionID) 
      setVisibleManualDetailsDialog(true)
    };
    return (
        <div className="manual-details">
            <DataTable 
                value={usersManualData} 
                paginator
                rows={10}  
                scrollable
                emptyMessage={
                    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {isLoading ? 'Loading...' : 'No data found.'}
                    </span>
                }
                className="manual-list p-datatable-gridlines"
                style={{ width: '100%' }}>
                <Column field="viewManualLink" header="View Manual" body={(rowData) => (
                    <a href={rowData.viewManualLink} target="_blank" rel="noopener noreferrer"
                     onClick={(e) => {
                            e.preventDefault();
                            callManualDetails(rowData.dM_ManualVersionID);
                        }}>View</a>
                )} />
                <Column field="categoryName" header="Category" style={{width: '150px'}} />
                <Column field="manualCode" header="Manual Code" style={{width: '150px'}} />
                <Column field="manualName" header="Manual Name" style={{width: '500px'}} />
                <Column field="version" header="Version" style={{width: '150px'}} />
                <Column field="statusString" header="Status" style={{width: '150px'}} />
                <Column field="isApprovalRequired" header="Is Approval Required" style={{width: '150px'}} />
                <Column field="canExport" header="Can Export" style={{width: '150px'}} />
                <Column field="createdBy" header="Created By" style={{width: '150px'}} />
                <Column field="createdDate" header="Created Date" style={{width: '150px'}} />
                <Column field="releasedBy" header="Released By" style={{width: '150px'}} />
                <Column field="releasedDate" header="Released Date" style={{width: '150px'}} />
                <Column field="publishedBy" header="Published By" style={{width: '150px'}} />
                <Column field="publishedDate" header="Published Date" style={{width: '150px'}} />
                <Column field="lastModifiedBy" header="Last Modified By" style={{width: '150px'}} />
                <Column field="lastModifiedDate" header="Last Modified Date" style={{width: '150px'}} />
                <Column field="comments" header="Comments" style={{width: '150px'}} />
                <Column field="dM_ManualID" header="DM_ManualID" style={{width: '150px'}} />
                <Column field="dM_ManualVersionID" header="DM_ManualVersionID" style={{width: '150px'}} />
            </DataTable>

            {visibleManualDetailsDialog && (
                <Dialog
                    header={'Manual Details '}
                    visible={visibleManualDetailsDialog}
                    style={{ width: '1550px', minWidth: '90vh' }}
                    contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
                    headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue', height: '60px' }}
                    onHide={() => { if (!visibleManualDetailsDialog) return; setVisibleManualDetailsDialog(false); }}>
                    <ManualDetails 
                        closeForm={() => setVisibleManualDetailsDialog(false)}
                        dmManualVersionID={dm_ManualVersionID} />
                </Dialog>
            )}
        </div>
    );
}
export default UserManualList;
