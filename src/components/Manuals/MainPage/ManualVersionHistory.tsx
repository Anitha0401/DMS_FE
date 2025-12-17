import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import dmsLifecycleService from "../../../services/DMSLifecycleService";
import '../ViewManuals/UserManualList.scss';

export interface ManualDetailsProps {
    closeForm: () => void;
}

export type ManualVersionHistoryData = {
    id: string;
    versionNumber: string;
    createdBy: string;
    createdDate: string;
    publishedBy?: string;
    publishedDate?: string;
    releasedBy?: string;
    releasedDate?: string;
};

const sampleData: ManualVersionHistoryData[] = [
    {
        id: "1",
        versionNumber: "1.0.0",
        createdBy: "Alice",
        createdDate: "2024-01-10T09:15:00Z",
        publishedBy: "Bob",
        publishedDate: "2024-01-15T10:00:00Z",
        releasedBy: "Carol",
        releasedDate: "2024-01-20T08:30:00Z",
    },
    {
        id: "2",
        versionNumber: "1.1.0",
        createdBy: "Dave",
        createdDate: "2024-03-02T14:40:00Z",
        publishedBy: "Eve",
        publishedDate: "2024-03-05T11:20:00Z",
        releasedBy: "Frank",
        releasedDate: "2024-03-10T16:00:00Z",
    },
    {
        id: "3",
        versionNumber: "2.0.0",
        createdBy: "Grace",
        createdDate: "2024-06-01T07:00:00Z",
    },
];

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
        return new Date(dateStr).toLocaleString();
    } catch {
        return dateStr;
    }
};

const ManualVersionHistory: React.FC<ManualDetailsProps> = ({ closeForm }) => {
    const [versionHistoryDetails, setVersionHistoryDetails] = useState<ManualVersionHistoryData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        setLoading(true);
        try {
            setVersionHistoryDetails(sampleData); // Using sample data for demonstration to be removed later
            // dmsLifecycleService.getApiCall(`DMS/GetManualVersionHistory`)
            //     .then((data: any) => {
            //         setVersionHistoryDetails(data);
            //     })
            //     .catch(() => {
            //         setVersionHistoryDetails([]);
            //     });
        } catch (err: any) {
            console.error(err.message || 'Error fetching manual version history data!!');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="manual-details">
            <DataTable
                value={versionHistoryDetails}
                paginator
                rows={10}
                loading={loading}
                sortField="createdDate"
                sortOrder={-1}
                emptyMessage={
                    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {loading ? 'Loading...' : 'No data found.'}
                    </span>
                }
                className="manual-list p-datatable-gridlines"
                style={{ width: '100%', minHeight: '100%', border: 'none !important' }}
            >
                <Column field="versionNumber" header="Version" sortable />
                <Column field="createdBy" header="Created By" sortable />
                <Column header="Created Date" body={(row: ManualVersionHistoryData) => formatDate(row.createdDate)} sortable />
                <Column field="publishedBy" header="Published By" />
                <Column header="Published Date" body={(row: ManualVersionHistoryData) => formatDate(row.publishedDate)} />
                <Column field="releasedBy" header="Released By" />
                <Column header="Released Date" body={(row: ManualVersionHistoryData) => formatDate(row.releasedDate)} />
            </DataTable>
        </div>
    );
};

export default ManualVersionHistory;