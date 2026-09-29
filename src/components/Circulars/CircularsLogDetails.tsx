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

const normalizeLogResponse = (response: any): CircularsLogData[] => {
    const records = Array.isArray(response)
        ? response
        : response?.data ?? response?.items ?? response?.results ?? response?.$values ?? [];

    if (!Array.isArray(records)) return [];

    return records.map((item: any) => ({
        Logdate: item.Logdate ?? item.LogDate ?? item.logdate ?? item.logDate,
        UserId: item.UserId ?? item.UserID ?? item.userId ?? item.userID,
        UserName: item.UserName ?? item.username ?? item.userName,
        UserRole: item.UserRole ?? item.userRole,
        Activity: item.Activity ?? item.activity,
        Remarks: item.Remarks ?? item.remarks ?? item.Remark ?? item.remark
    }));
};

const CircularsLogDetails: React.FC<CircularsLogProps> = ({ selectedCIR_MasterID }) => {
    const [logDetails, setLogDetails] = useState<CircularsLogData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        dmsLifecycleService.getApiCall(`circular/GetCircularLogs?ciR_MasterID=${selectedCIR_MasterID}`)
            .then((data: any) => {
                if (mounted) setLogDetails(normalizeLogResponse(data));
            })
            .catch(() => {
                if (mounted) setLogDetails([]);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [selectedCIR_MasterID]);

    return (
        <div className="manual-details circular-log-page">
            <DataTable
                value={logDetails}
                paginator
                rows={10}
                loading={loading}
                sortField="Logdate"
                sortOrder={-1}
                className="manual-list circular-log-table"
                style={{ width: '100%' }}
                tableStyle={{ minWidth: '900px' }}
                emptyMessage={
                    <span className="circular-log-empty">
                        No data found.
                    </span>
                }
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