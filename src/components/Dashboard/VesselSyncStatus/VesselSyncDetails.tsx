import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { SelectButton } from 'primereact/selectbutton';
import { Button } from 'primereact/button';
import dmsLifecycleService, { errorMessage } from '../../../services/DMSLifecycleService';
import { formatDate } from '../../utils/formatDate';

/**
 * Per-vessel sync details, opened from the Vessel Sync Status tab.
 *   Items sent:   manuals and circulars/alerts assigned to the vessel, how far they are acknowledged,
 *                 and whether the vessel already has them (On board) or they are waiting (Queued).
 *   Sync history: the vessel's sync key (generate / replace) and a forced resync, then every sync call.
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
    /** On board | Queued | null when vessel sync is not set up */
    delivery?: string | null;
}

interface VesselSyncLogEntry {
    syncLogID: number;
    /** Down = office to vessel, Up = vessel to office */
    direction: string;
    startedUtc: string;
    finishedUtc?: string | null;
    itemsCount: number;
    status: string;
    error?: string | null;
}

interface VesselSyncHistory {
    syncInstalled: boolean;
    hasKey: boolean;
    keyCreatedUtc?: string | null;
    keyCreatedBy?: string | null;
    keyLastUsedUtc?: string | null;
    entries: VesselSyncLogEntry[];
}

interface VesselSyncDetailsProps {
    visible: boolean;
    vesselId: number;
    vesselName: string;
    onHide: () => void;
    /** Called after the key was generated or a resync requested, so the monitor can refresh. */
    onChanged?: () => void;
}

const TYPE_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Manuals', value: 'Manual' },
    { label: 'Circulars', value: 'Circular' },
    { label: 'Alerts', value: 'Alert' },
];

const typeIcon: Record<string, string> = {
    Manual: 'pi-book',
    Circular: 'pi-inbox',
    Alert: 'pi-bell',
};

const statusClass = (status: string) => {
    switch (status) {
        case 'Acknowledged': return 'vs-pill ok';
        case 'Partly acknowledged': return 'vs-pill part';
        case 'Pending': return 'vs-pill pending';
        default: return 'vs-pill neutral';
    }
};

/** Times from the sync tables are UTC; show them in the user's time. */
const formatDateTime = (value?: string | null) => {
    if (!value) return '';
    const d = new Date(value.endsWith('Z') || value.includes('+') ? value : `${value}Z`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
};

const duration = (from: string, to?: string | null) => {
    if (!to) return '';
    const ms = new Date(`${to}`.endsWith('Z') ? to : `${to}Z`).getTime() - new Date(`${from}`.endsWith('Z') ? from : `${from}Z`).getTime();
    if (Number.isNaN(ms) || ms < 0) return '';
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
};

const VesselSyncDetails: React.FC<VesselSyncDetailsProps> = ({ visible, vesselId, vesselName, onHide, onChanged }) => {
    const [tab, setTab] = useState(0);
    const [items, setItems] = useState<VesselSyncItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsError, setItemsError] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [history, setHistory] = useState<VesselSyncHistory | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    // Sync key and resync
    const [newKey, setNewKey] = useState('');
    const [copied, setCopied] = useState(false);
    const [confirming, setConfirming] = useState<'key' | 'resync' | null>(null);
    const [setupBusy, setSetupBusy] = useState(false);
    const [setupMessage, setSetupMessage] = useState('');
    const [setupError, setSetupError] = useState('');

    const loadItems = useCallback(() => {
        setItemsLoading(true);
        setItemsError('');
        dmsLifecycleService.getApiCall(`Vessel/GetVesselSyncItems?vesselId=${vesselId}`)
            .then((data: VesselSyncItem[]) => setItems(data || []))
            .catch((err: unknown) => { setItems([]); setItemsError(errorMessage(err)); })
            .finally(() => setItemsLoading(false));
    }, [vesselId]);

    const loadHistory = useCallback(() => {
        setHistoryLoading(true);
        setHistoryError('');
        dmsLifecycleService.getApiCall(`Vessel/GetVesselSyncHistory?vesselId=${vesselId}`)
            .then((data: VesselSyncHistory) => setHistory({ ...data, entries: data?.entries || [] }))
            .catch((err: unknown) => { setHistory(null); setHistoryError(errorMessage(err)); })
            .finally(() => setHistoryLoading(false));
    }, [vesselId]);

    useEffect(() => {
        if (!visible) return;
        setTab(0);
        setTypeFilter('all');
        setSearch('');
        setNewKey('');
        setCopied(false);
        setConfirming(null);
        setSetupMessage('');
        setSetupError('');
        loadItems();
        loadHistory();
    }, [visible, loadItems, loadHistory]);

    const counts = useMemo(() => {
        const c = { total: items.length, acknowledged: 0, pending: 0, queued: 0 };
        items.forEach((i) => {
            if (i.status === 'Acknowledged') c.acknowledged += 1;
            else if (i.status === 'Pending' || i.status === 'Partly acknowledged') c.pending += 1;
            if (i.delivery === 'Queued') c.queued += 1;
        });
        return c;
    }, [items]);

    const visibleItems = useMemo(() => {
        const term = search.trim().toLowerCase();
        return items.filter((i) =>
            (typeFilter === 'all' || i.itemType === typeFilter) &&
            (!term || `${i.number ?? ''} ${i.title ?? ''} ${i.category ?? ''}`.toLowerCase().includes(term)));
    }, [items, typeFilter, search]);

    const hasDelivery = items.some((i) => i.delivery);

    // ---- Sync key and resync ----

    const generateKey = async () => {
        setSetupBusy(true);
        setSetupError('');
        setSetupMessage('');
        try {
            const result = await dmsLifecycleService.postApiCall(`Vessel/GenerateSyncKey?vesselId=${vesselId}`);
            setNewKey(result?.key || '');
            setCopied(false);
            setConfirming(null);
            loadHistory();
            onChanged?.();
        } catch (err) {
            setSetupError(errorMessage(err));
        } finally {
            setSetupBusy(false);
        }
    };

    const requestResync = async () => {
        setSetupBusy(true);
        setSetupError('');
        setSetupMessage('');
        try {
            await dmsLifecycleService.postApiCall(`Vessel/RequestResync?vesselId=${vesselId}`);
            setConfirming(null);
            setSetupMessage('Everything will be sent again on the vessel’s next sync.');
            loadItems();
            onChanged?.();
        } catch (err) {
            setSetupError(errorMessage(err));
        } finally {
            setSetupBusy(false);
        }
    };

    const copyKey = async () => {
        try {
            await navigator.clipboard.writeText(newKey);
            setCopied(true);
        } catch {
            setCopied(false); // the key is selectable, so it can still be copied by hand
        }
    };

    // ---- Cells ----

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

    const deliveryBody = (row: VesselSyncItem) => !row.delivery
        ? <span className="vs-muted">—</span>
        : <span className={row.delivery === 'Queued' ? 'vs-pill part' : 'vs-pill neutral'}>{row.delivery}</span>;

    const setupBody = () => {
        if (!history?.syncInstalled) return null;
        return (
            <div className="vs-setup">
                <div className="vs-setup-row">
                    <div className="vs-setup-text">
                        <strong>Sync key</strong>
                        {history.hasKey ? (
                            <span>
                                Generated {formatDateTime(history.keyCreatedUtc)}
                                {history.keyCreatedBy ? ` by ${history.keyCreatedBy}` : ''} ·{' '}
                                {history.keyLastUsedUtc ? `last used ${formatDateTime(history.keyLastUsedUtc)}` : 'not used by the vessel yet'}
                            </span>
                        ) : (
                            <span>No key yet: the vessel cannot sync until one is generated and set on board.</span>
                        )}
                    </div>
                    <div className="vs-setup-actions">
                        <Button
                            type="button"
                            label={history.hasKey ? 'Replace key' : 'Generate sync key'}
                            icon="pi pi-lock"
                            className={history.hasKey ? 'p-button-outlined' : ''}
                            disabled={setupBusy}
                            onClick={() => (history.hasKey ? setConfirming('key') : generateKey())}
                        />
                        <Button
                            type="button"
                            label="Force resync"
                            icon="pi pi-replay"
                            className="p-button-outlined"
                            disabled={setupBusy}
                            onClick={() => setConfirming('resync')}
                        />
                    </div>
                </div>

                {confirming === 'key' && (
                    <div className="vs-confirm">
                        <span>The vessel stops syncing until the new key is put in its settings. Replace the key?</span>
                        <Button type="button" label="Replace" className="p-button-danger" onClick={generateKey} loading={setupBusy} />
                        <Button type="button" label="Cancel" className="p-button-text" onClick={() => setConfirming(null)} disabled={setupBusy} />
                    </div>
                )}
                {confirming === 'resync' && (
                    <div className="vs-confirm">
                        <span>Send every manual and circular to {vesselName} again on its next sync? Over a slow link this can take a while.</span>
                        <Button type="button" label="Resync" onClick={requestResync} loading={setupBusy} />
                        <Button type="button" label="Cancel" className="p-button-text" onClick={() => setConfirming(null)} disabled={setupBusy} />
                    </div>
                )}

                {newKey && (
                    <div className="vs-key">
                        <strong>Copy this key now: it is not shown again.</strong>
                        <div className="vs-key-value">
                            <code>{newKey}</code>
                            <Button
                                type="button"
                                icon={copied ? 'pi pi-check' : 'pi pi-copy'}
                                label={copied ? 'Copied' : 'Copy'}
                                className="p-button-sm p-button-outlined"
                                onClick={copyKey}
                            />
                        </div>
                        <span>
                            On the vessel server, set it in <code>appsettings.json</code> as <code>"Sync": {'{'} "VesselId": {vesselId}, "VesselKey": "…" {'}'}</code> and restart the DMS vessel service.
                        </span>
                    </div>
                )}
                {setupMessage && <span className="vs-muted">{setupMessage}</span>}
                {setupError && <span className="vs-setup-error"><i className="pi pi-exclamation-triangle" /> {setupError}</span>}
            </div>
        );
    };

    const historyBody = () => {
        if (historyLoading && !history) return <div className="vs-empty"><i className="pi pi-spin pi-spinner" /> Loading…</div>;
        if (historyError) return <div className="vs-empty error"><i className="pi pi-exclamation-triangle" /> {historyError}</div>;
        if (history && !history.syncInstalled) {
            return (
                <div className="vs-empty">
                    <i className="pi pi-info-circle" />
                    <div>
                        <strong>Vessel sync is not set up yet.</strong>
                        <p>Run <code>Database/005_VesselSync.sql</code> on the office database. Sync keys and the history
                            of each sync then appear here.</p>
                    </div>
                </div>
            );
        }
        const entries = history?.entries ?? [];
        return (
            <>
                {setupBody()}
                <DataTable
                    value={entries}
                    dataKey="syncLogID"
                    size="small"
                    stripedRows
                    loading={historyLoading}
                    paginator={entries.length > 10}
                    rows={10}
                    scrollable
                    scrollHeight="flex"
                    emptyMessage="No sync calls recorded for this vessel yet."
                >
                    <Column header="Started" body={(r: VesselSyncLogEntry) => formatDateTime(r.startedUtc)} style={{ width: '22%' }} />
                    <Column header="Direction" body={(r: VesselSyncLogEntry) => (
                        <span className="vs-type">
                            <i className={`pi ${r.direction === 'Down' ? 'pi-arrow-down' : 'pi-arrow-up'}`} />
                            {r.direction === 'Down' ? 'Office to vessel' : 'Vessel to office'}
                        </span>
                    )} style={{ width: '18%' }} />
                    <Column header="Items" field="itemsCount" style={{ width: '9%' }} />
                    <Column header="Status" body={(r: VesselSyncLogEntry) => (
                        <span className={r.status === 'OK' ? 'vs-pill ok' : 'vs-pill pending'}>{r.status === 'OK' ? 'OK' : 'Failed'}</span>
                    )} style={{ width: '11%' }} />
                    <Column header="Took" body={(r: VesselSyncLogEntry) => duration(r.startedUtc, r.finishedUtc)} style={{ width: '10%' }} />
                    <Column header="Error" body={(r: VesselSyncLogEntry) => <span className="vs-muted">{r.error}</span>} style={{ width: '30%' }} />
                </DataTable>
            </>
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
                            {hasDelivery && <span className="vs-pill part">{counts.queued} queued</span>}
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
                            <Column header="Type" body={typeBody} field="itemType" sortable style={{ width: '14%' }} />
                            <Column header="Title" body={titleBody} field="title" sortable style={{ width: hasDelivery ? '34%' : '40%' }} />
                            <Column header="Issued" field="issuedOn" sortable body={(r: VesselSyncItem) => formatDate(r.issuedOn ?? '', '')} style={{ width: '12%' }} />
                            {hasDelivery && <Column header="On vessel" field="delivery" sortable body={deliveryBody} style={{ width: '11%' }} />}
                            <Column header="Acknowledged" body={ackBody} style={{ width: '13%' }} />
                            <Column header="Status" field="status" sortable body={(r: VesselSyncItem) => <span className={statusClass(r.status)}>{r.status}</span>} style={{ width: '16%' }} />
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
