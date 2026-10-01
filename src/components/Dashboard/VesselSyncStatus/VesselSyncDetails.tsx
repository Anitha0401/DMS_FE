import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { SelectButton } from 'primereact/selectbutton';
import dmsLifecycleService, { errorMessage } from '../../../services/DMSLifecycleService';
import { formatDate } from '../../utils/formatDate';

/**
 * Per-vessel sync details, opened from the Vessel Sync Status tab.
 *   Items sent:   manuals, circulars/alerts and other documents assigned to the vessel,
 *                 with how many of the required ranks have acknowledged them.
 *   Sync history: each sync run (needs the HQ sync add-on; until then it explains that).
 */
interface VesselSyncItem {
    itemType: string;
    itemID: number;
    number?: string;
    title?: string;
    version?: string;
    category?: string;
    issuedOn?: string;
    ranksRequired: number;
    ranksAcknowledged: number;
    lastReadOn?: string;
    status: string;
}

interface VesselSyncPackage {
    packageId: string;
    direction: string;
    fromVersion: number;
    toVersion: number;
    rowsCount: number;
    status: string;
    createdUtc: string;
    appliedUtc?: string;
    error?: string;
}

interface VesselSyncDetailsProps {
    visible: boolean;
    vesselId: number;
    vesselName: string;
    onHide: () => void;
}

const TYPE_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Manuals', value: 'Manual' },
    { label: 'Circulars', value: 'Circular' },
    { label: 'Alerts', value: 'Alert' },
    { label: 'Other documents', value: 'Other document' },
];

const typeIcon: Record<string, string> = {
    Manual: 'pi-book',
    Circular: 'pi-inbox',
    Alert: 'pi-bell',
    'Other document': 'pi-file',
};

const statusClass = (status: string) => {
    switch (status) {
        case 'Acknowledged': return 'vs-pill ok';
        case 'Partly acknowledged': return 'vs-pill part';
        case 'Pending': return 'vs-pill pending';
        default: return 'vs-pill neutral';
    }
};

const formatDateTime = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
};

const VesselSyncDetails: React.FC<VesselSyncDetailsProps> = ({ visible, vesselId, vesselName, onHide }) => {
    const [tab, setTab] = useState(0);
    const [items, setItems] = useState<VesselSyncItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsError, setItemsError] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [packages, setPackages] = useState<VesselSyncPackage[]>([]);
    const [syncInstalled, setSyncInstalled] = useState<boolean | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    useEffect(() => {
        if (!visible) return;
        setTab(0);
        setTypeFilter('all');
        setSearch('');

        setItemsLoading(true);
        setItemsError('');
        dmsLifecycleService.getApiCall(`Vessel/GetVesselSyncItems?vesselId=${vesselId}`)
            .then((data: VesselSyncItem[]) => setItems(data || []))
            .catch((err: unknown) => { setItems([]); setItemsError(errorMessage(err)); })
            .finally(() => setItemsLoading(false));

        setHistoryLoading(true);
        setHistoryError('');
        dmsLifecycleService.getApiCall(`Vessel/GetVesselSyncHistory?vesselId=${vesselId}`)
            .then((data: any) => {
                setSyncInstalled(Boolean(data?.syncInstalled));
                setPackages(data?.packages || []);
            })
            .catch((err: unknown) => { setPackages([]); setSyncInstalled(null); setHistoryError(errorMessage(err)); })
            .finally(() => setHistoryLoading(false));
    }, [visible, vesselId]);

    const counts = useMemo(() => {
        const c = { total: items.length, acknowledged: 0, pending: 0 };
        items.forEach((i) => {
            if (i.status === 'Acknowledged') c.acknowledged += 1;
            else if (i.status === 'Pending' || i.status === 'Partly acknowledged') c.pending += 1;
        });
        return c;
    }, [items]);

    const visibleItems = useMemo(() => {
        const term = search.trim().toLowerCase();
        return items.filter((i) =>
            (typeFilter === 'all' || i.itemType === typeFilter) &&
            (!term || `${i.number ?? ''} ${i.title ?? ''} ${i.category ?? ''}`.toLowerCase().includes(term)));
    }, [items, typeFilter, search]);

    const typeBody = (row: VesselSyncItem) => (
        <span className="vs-type"><i className={`pi ${typeIcon[row.itemType] || 'pi-file'}`} />{row.itemType}</span>
    );

    const titleBody = (row: VesselSyncItem) => (
        <div className="vs-title">
            <span className="vs-title-main">{row.title || '—'}</span>
            <span className="vs-title-sub">
                {[row.number, row.version && `v${row.version}`, row.category].filter(Boolean).join(' · ')}
            </span>
        </div>
    );

    const ackBody = (row: VesselSyncItem) => row.ranksRequired > 0
        ? <span>{row.ranksAcknowledged} of {row.ranksRequired} ranks</span>
        : <span className="vs-muted">Not required</span>;

    const historyBody = () => {
        if (historyLoading) return <div className="vs-empty"><i className="pi pi-spin pi-spinner" /> Loading…</div>;
        if (historyError) return <div className="vs-empty error"><i className="pi pi-exclamation-triangle" /> {historyError}</div>;
        if (syncInstalled === false) {
            return (
                <div className="vs-empty">
                    <i className="pi pi-info-circle" />
                    <div>
                        <strong>Sync history is not recorded yet.</strong>
                        <p>It appears here once the HQ sync add-on from the vessel package is installed
                            (it creates the <code>Sync_Package</code> table).</p>
                    </div>
                </div>
            );
        }
        return (
            <DataTable
                value={packages}
                dataKey="packageId"
                size="small"
                stripedRows
                paginator={packages.length > 10}
                rows={10}
                scrollable
                scrollHeight="flex"
                emptyMessage="No sync runs recorded for this vessel yet."
            >
                <Column header="Started" body={(r: VesselSyncPackage) => formatDateTime(r.createdUtc)} style={{ width: '22%' }} />
                <Column header="Direction" body={(r: VesselSyncPackage) => (
                    <span className="vs-type">
                        <i className={`pi ${r.direction === 'Down' ? 'pi-arrow-down' : 'pi-arrow-up'}`} />
                        {r.direction === 'Down' ? 'HQ to vessel' : 'Vessel to HQ'}
                    </span>
                )} style={{ width: '18%' }} />
                <Column field="rowsCount" header="Rows" style={{ width: '10%' }} />
                <Column header="Status" body={(r: VesselSyncPackage) => (
                    <span className={r.error ? 'vs-pill pending' : 'vs-pill ok'}>{r.error ? 'Failed' : r.status}</span>
                )} style={{ width: '14%' }} />
                <Column header="Applied" body={(r: VesselSyncPackage) => formatDateTime(r.appliedUtc)} style={{ width: '20%' }} />
                <Column field="error" header="Error" style={{ width: '16%' }} />
            </DataTable>
        );
    };

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="vs-dialog-title">
                    <i className="pi pi-sync" />
                    <span>{vesselName}</span>
                    <span className="vs-muted">sync details</span>
                </div>
            }
            style={{ width: 'min(1100px, 96vw)', height: 'min(760px, 92vh)' }}
            className="vs-dialog"
            modal
            draggable={false}
        >
            <TabView activeIndex={tab} onTabChange={(e) => setTab(e.index)} className="vs-tabs">
                <TabPanel header={`Items sent (${counts.total})`}>
                    <div className="vs-toolbar">
                        <SelectButton
                            value={typeFilter}
                            options={TYPE_FILTERS}
                            onChange={(e) => e.value && setTypeFilter(e.value)}
                            className="vs-type-filter"
                        />
                        <span className="vs-search">
                            <i className="pi pi-search" />
                            <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search number or title" />
                        </span>
                        <span className="vs-counts">
                            <span className="vs-pill ok">{counts.acknowledged} acknowledged</span>
                            <span className="vs-pill pending">{counts.pending} waiting</span>
                        </span>
                    </div>
                    {itemsError ? (
                        <div className="vs-empty error"><i className="pi pi-exclamation-triangle" /> {itemsError}</div>
                    ) : (
                        <DataTable
                            value={visibleItems}
                            dataKey="itemID"
                            loading={itemsLoading}
                            size="small"
                            stripedRows
                            paginator={visibleItems.length > 10}
                            rows={10}
                            scrollable
                            scrollHeight="flex"
                            sortField="issuedOn"
                            sortOrder={-1}
                            emptyMessage={itemsLoading ? 'Loading…' : 'Nothing has been sent to this vessel.'}
                        >
                            <Column header="Type" body={typeBody} field="itemType" sortable style={{ width: '16%' }} />
                            <Column header="Title" body={titleBody} field="title" sortable style={{ width: '38%' }} />
                            <Column header="Issued" field="issuedOn" sortable body={(r: VesselSyncItem) => formatDate(r.issuedOn ?? '', '')} style={{ width: '13%' }} />
                            <Column header="Acknowledged" body={ackBody} style={{ width: '14%' }} />
                            <Column header="Status" field="status" sortable body={(r: VesselSyncItem) => <span className={statusClass(r.status)}>{r.status}</span>} style={{ width: '19%' }} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="Sync history">
                    {historyBody()}
                </TabPanel>
            </TabView>
        </Dialog>
    );
};

export default VesselSyncDetails;
