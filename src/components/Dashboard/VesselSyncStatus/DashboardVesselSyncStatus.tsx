import React, { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import VesselSyncDetails from './VesselSyncDetails';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './DashboardVesselSyncStatus.scss';

interface VesselSyncRecord {
    vesselID: number;
    vslCode?: string;
    vslName: string;
    vslType?: string;
    syncStatus: string;
    lastSyncAt?: string | null;
}

const toStatusLabel = (value: unknown): string => {
    if (typeof value === 'boolean') {
        return value ? 'Synced' : 'Pending';
    }

    if (typeof value === 'number') {
        return value > 0 ? 'Synced' : 'Pending';
    }

    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized) return 'Unknown';

    if (['synced', 'success', 'successful', 'updated', 'online', 'ok', 'active'].includes(normalized)) {
        return 'Synced';
    }

    if (['pending', 'inprogress', 'in progress', 'syncing', 'processing', 'queued'].includes(normalized)) {
        return 'Pending';
    }

    if (['failed', 'error', 'timeout', 'offline', 'stopped', 'blocked'].includes(normalized)) {
        return 'Failed';
    }

    return normalized
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const getStatusClassName = (status: string) => {
    const normalized = status.toLowerCase();

    if (normalized === 'synced') return 'status-synced';
    if (normalized === 'pending') return 'status-pending';
    if (normalized === 'failed') return 'status-failed';
    return 'status-unknown';
};

const normalizeLastSync = (value: unknown): string | null => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const text = String(value).trim();
    if (!text) {
        return null;
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
        return text;
    }

    return date.toLocaleString();
};

const mapSyncStatus = (source: any): string => {
    if (!source) {
        return 'Unknown';
    }

    if (typeof source === 'object') {
        return toStatusLabel(
            source.syncStatus ??
            source.status ??
            source.syncState ??
            source.state ??
            source.isSynced ??
            source.synced ??
            source.sync ??
            source.lastSyncStatus
        );
    }

    return toStatusLabel(source);
};

const extractLastSync = (source: any): string | null => {
    if (!source || typeof source !== 'object') {
        return null;
    }

    return normalizeLastSync(
        source.lastSyncAt ??
        source.lastSync ??
        source.syncDate ??
        source.lastSyncedAt ??
        source.syncedAt ??
        source.updatedAt ??
        source.lastUpdated
    );
};

const normalizeStatusCollection = (payload: any): Record<string, any> => {
    if (!payload) {
        return {};
    }

    if (Array.isArray(payload)) {
        return payload.reduce((acc: Record<string, any>, entry: any) => {
            if (!entry || typeof entry !== 'object') {
                return acc;
            }

            const vesselKey = entry.vesselID ?? entry.vesselId ?? entry.vslID ?? entry.vesselid;
            const vesselName = entry.vslName ?? entry.vesselName ?? entry.name ?? entry.vessel ?? entry.vesselCode;

            if (vesselKey !== undefined && vesselKey !== null) {
                acc[String(vesselKey)] = entry;
            }

            if (vesselName) {
                acc[String(vesselName).toLowerCase()] = entry;
            }

            return acc;
        }, {});
    }

    if (Array.isArray(payload.items)) {
        return normalizeStatusCollection(payload.items);
    }

    if (Array.isArray(payload.vesselSyncStatusList)) {
        return normalizeStatusCollection(payload.vesselSyncStatusList);
    }

    if (Array.isArray(payload.data)) {
        return normalizeStatusCollection(payload.data);
    }

    if (typeof payload === 'object') {
        return payload;
    }

    return {};
};

const DashboardVesselSyncStatus: React.FC = () => {
    const [vessels, setVessels] = useState<VesselSyncRecord[]>([]);
    const [loading, setLoading] = useState(true);
    // Vessel whose sync details are open (button in each row).
    const [detailsVessel, setDetailsVessel] = useState<VesselSyncRecord | null>(null);

    useEffect(() => {
        const fetchSyncStatus = async () => {
            try {
                const vesselResponse = await dmsLifecycleService.getApiCall('Vessel/GetVessels');
                const vesselList = Array.isArray(vesselResponse)
                    ? vesselResponse
                    : Array.isArray(vesselResponse?.vesselList)
                        ? vesselResponse.vesselList
                        : [];

                let statusMap: Record<string, any> = {};
                const endpointCandidates = [
                    'Vessel/GetVesselSyncStatusList',
                    'Vessel/GetVesselSyncStatus',
                    'Vessel/GetSyncStatus',
                    'Vessel/GetAllVesselSyncStatus',
                    'DMS/GetVesselSyncStatus'
                ];

                for (const endpoint of endpointCandidates) {
                    try {
                        const response = await dmsLifecycleService.getApiCall(endpoint);
                        const mapped = normalizeStatusCollection(response);
                        if (Object.keys(mapped).length > 0) {
                            statusMap = mapped;
                            break;
                        }
                    } catch {
                        // Ignore failed endpoint probes and continue to the next one.
                    }
                }

                const mergedVessels = vesselList.map((vessel: any) => {
                    const vesselKey = vessel.vesselID ?? vessel.vesselId ?? vessel.vslID ?? vessel.vesselid;
                    const vesselName = vessel.vslName ?? vessel.vesselName ?? vessel.name;
                    const statusInfo =
                        (vesselKey !== undefined && vesselKey !== null && statusMap[String(vesselKey)]) ||
                        (vesselName && statusMap[String(vesselName).toLowerCase()]) ||
                        null;

                    return {
                        vesselID: Number(vesselKey ?? 0),
                        vslCode: vessel.vslCode ?? vessel.code,
                        vslName: vesselName ?? 'Unknown vessel',
                        vslType: vessel.vslType ?? vessel.type ?? 'N/A',
                        syncStatus: mapSyncStatus(statusInfo ?? vessel),
                        lastSyncAt: extractLastSync(statusInfo ?? vessel)
                    };
                });

                setVessels(mergedVessels);
            } catch {
                setVessels([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSyncStatus();
    }, []);

    const summary = useMemo(() => {
        const counts = { Synced: 0, Pending: 0, Failed: 0, Unknown: 0 };

        vessels.forEach((vessel) => {
            const status = vessel.syncStatus || 'Unknown';
            if (Object.prototype.hasOwnProperty.call(counts, status)) {
                counts[status as keyof typeof counts] += 1;
            } else {
                counts.Unknown += 1;
            }
        });

        return counts;
    }, [vessels]);

    const statusBody = (row: VesselSyncRecord) => (
        <span className={`sync-status-badge ${getStatusClassName(row.syncStatus)}`}>
            {row.syncStatus}
        </span>
    );

    const lastSyncBody = (row: VesselSyncRecord) => (
        <span className="sync-date-text">{row.lastSyncAt || 'No sync recorded'}</span>
    );

    const actionsBody = (row: VesselSyncRecord) => (
        <Button
            type="button"
            label="View synced"
            icon="pi pi-list"
            className="p-button-sm p-button-outlined vs-view-btn"
            onClick={() => setDetailsVessel(row)}
            aria-label={`View what has been synced to ${row.vslName}`}
        />
    );

    return (
        <div className="vessel-sync-dashboard">
            <div className="vessel-sync-header">
                <div>
                    <h2>Vessel Sync Status</h2>
                    <p>All vessels</p>
                </div>

                <div className="sync-summary">
                    <span>Synced: {summary.Synced}</span>
                    <span>Pending: {summary.Pending}</span>
                    <span>Failed: {summary.Failed}</span>
                    <span>Unknown: {summary.Unknown}</span>
                </div>
            </div>

            <DataTable
                value={vessels}
                loading={loading}
                dataKey="vesselID"
                stripedRows
                paginator
                rows={10}
                sortMode="multiple"
                emptyMessage={loading ? 'Loading vessel sync status...' : 'No vessel sync data available.'}
            >
                <Column field="vslCode" header="Code" sortable />
                <Column field="vslName" header="Vessel Name" sortable />
                <Column field="vslType" header="Type" sortable />
                <Column field="syncStatus" header="Sync Status" body={statusBody} sortable />
                <Column field="lastSyncAt" header="Last Sync" body={lastSyncBody} sortable />
                <Column header="" body={actionsBody} style={{ width: '150px', textAlign: 'right' }} />
            </DataTable>

            <VesselSyncDetails
                visible={!!detailsVessel}
                vesselId={detailsVessel?.vesselID ?? 0}
                vesselName={detailsVessel?.vslName ?? ''}
                onHide={() => setDetailsVessel(null)}
            />
        </div>
    );
};

export default DashboardVesselSyncStatus;
