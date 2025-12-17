import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import dmsLifecycleService from "../../services/DMSLifecycleService";

export interface CircularsLogProps {
    selectedCIR_MasterID: number;
}

export type CircularsLogData = {
    Logdate?: string;
    UserId?: string | number;
    UserName?: string;
    UserRole?: string;
    Activity?: string;
    Remarks?: string;
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
        return new Date(dateStr).toLocaleString();
    } catch {
        return dateStr;
    }
};

const CircularsLogDetails: React.FC<CircularsLogProps> = ({ selectedCIR_MasterID }) => {
    const [logDetails, setLogDetails] = useState<CircularsLogData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        setLoading(true);
        try {
            dmsLifecycleService.getApiCall(`circular/GetCircularLogs?ciR_MasterID=${selectedCIR_MasterID}`)
                .then((data: any) => {
                    setLogDetails(data);
                })
                .catch(() => {
                    setLogDetails([]);
                });
        } catch (err: any) {
            console.error(err.message || 'Error fetching circular log data!!');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="manual-details">
            <DataTable
                value={logDetails}
                paginator
                rows={10}
                loading={loading}
                sortField="Logdate"
                sortOrder={-1}
                emptyMessage={
                    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {loading ? 'Loading...' : 'No data found.'}
                    </span>
                }
                className="manual-list p-datatable-gridlines"
                style={{ width: '100%', minHeight: '100%', border: 'none !important' }}
            >
                <Column field="Logdate" header="Log Date" body={(row: CircularsLogData) => formatDate(row.Logdate)} sortable />
                <Column field="UserId" header="User ID" sortable />
                <Column field="UserName" header="User Name" />
                <Column field="UserRole" header="User Role" />
                <Column field="Activity" header="Activity" />
                <Column field="Remarks" header="Remarks" />
            </DataTable>
        </div>
    );
};

export default CircularsLogDetails;