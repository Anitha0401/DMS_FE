import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import PageHeader from '../PageHeader';
import featureApi, { formatSize, openApiFile, SuggestionDetail, SuggestionListItem, VesselOption } from '../../services/featureApi';
import { errorMessage } from '../../services/DMSLifecycleService';
import notify from '../../services/notify';
import { formatDate, formatDateTime } from '../utils/formatDate';
import './Features.scss';

const STATUS_LABEL: Record<string, string> = {
    Submitted: 'Submitted',
    UnderReview: 'Under review',
    NeedsInfo: 'Needs information',
    Accepted: 'Accepted',
    Rejected: 'Rejected',
    Implemented: 'Implemented',
    Closed: 'Closed',
};

/** The moves the office may make from each status (same as SuggestionService.Moves). */
const MOVES: Record<string, string[]> = {
    Submitted: ['UnderReview', 'NeedsInfo', 'Accepted', 'Rejected'],
    UnderReview: ['NeedsInfo', 'Accepted', 'Rejected'],
    NeedsInfo: ['UnderReview', 'Accepted', 'Rejected'],
    Accepted: ['Implemented', 'Rejected', 'Closed'],
    Rejected: ['UnderReview', 'Closed'],
    Implemented: ['Closed'],
    Closed: ['UnderReview'],
};

const ITEM_TYPES = [
    { label: 'General', value: null },
    { label: 'Manual', value: 'Manual' },
    { label: 'Circular', value: 'Circular' },
    { label: 'Alert', value: 'Alert' },
    { label: 'Document', value: 'Document' },
];

export const StatusTag: React.FC<{ status: string }> = ({ status }) => (
    <span className={`feature-tag ${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>
);

/** Feature 4: suggestions from the vessels and the office, and the office's decisions on them. */
const SuggestionsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [rows, setRows] = useState<SuggestionListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string | null>('Open');
    const [vesselId, setVesselId] = useState<number | null>(null);
    const [vessels, setVessels] = useState<VesselOption[]>([]);
    const [detail, setDetail] = useState<SuggestionDetail | null>(null);
    const [showNew, setShowNew] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await featureApi.suggestions.list(status, vesselId));
        } catch (err) {
            notify.error(errorMessage(err), 'Could not load suggestions');
        } finally {
            setLoading(false);
        }
    }, [status, vesselId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { featureApi.vessels().then(setVessels).catch(() => setVessels([])); }, []);

    const openDetail = useCallback(async (id: number) => {
        try {
            setDetail(await featureApi.suggestions.get(id));
        } catch (err) {
            notify.error(errorMessage(err), 'Could not open the suggestion');
        }
    }, []);

    // Deep link from the inbox or search: /suggestions?id=123
    const linkedId = searchParams.get('id');
    useEffect(() => {
        if (linkedId) openDetail(Number(linkedId));
    }, [linkedId, openDetail]);

    const closeDetail = () => {
        setDetail(null);
        if (linkedId) setSearchParams({});
    };

    return (
        <div className="feature-page">
            <PageHeader
                title="Suggestions"
                actions={<Button label="New suggestion" icon="pi pi-plus" onClick={() => setShowNew(true)} />}
            />
            <main className="feature-main">
                <div className="feature-toolbar">
                    <Dropdown
                        value={status}
                        options={[{ label: 'Open', value: 'Open' }, { label: 'All', value: null },
                            ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ label, value }))]}
                        onChange={(e) => setStatus(e.value)}
                    />
                    <Dropdown
                        value={vesselId}
                        options={[{ vesselID: null, vslName: 'All vessels and office' }, { vesselID: -2, vslName: 'Office' }, ...vessels]}
                        optionLabel="vslName"
                        optionValue="vesselID"
                        onChange={(e) => setVesselId(e.value)}
                        filter
                    />
                    <span className="spacer" />
                    <Button icon="pi pi-refresh" text aria-label="Refresh" onClick={load} />
                </div>
                <div className="feature-card">
                    <DataTable
                        value={rows}
                        loading={loading}
                        paginator
                        rows={20}
                        stripedRows
                        sortField="submittedOn"
                        sortOrder={-1}
                        emptyMessage="No suggestions."
                        selectionMode="single"
                        onRowClick={(e) => openDetail((e.data as SuggestionListItem).suG_MasterID)}
                        rowHover
                    >
                        <Column field="suggestionNo" header="No." sortable style={{ width: 150 }} />
                        <Column field="title" header="Title" sortable />
                        <Column field="vesselName" header="From" sortable body={(r: SuggestionListItem) => r.vesselName || 'Office'} />
                        <Column field="submittedByName" header="By" sortable body={(r: SuggestionListItem) => `${r.submittedByName ?? r.submittedBy}${r.submittedRank ? ` (${r.submittedRank})` : ''}`} />
                        <Column field="itemTitle" header="About" body={(r: SuggestionListItem) => r.itemTitle || (r.itemType ?? 'General')} />
                        <Column field="priority" header="Priority" sortable style={{ width: 100 }} />
                        <Column field="status" header="Status" sortable body={(r: SuggestionListItem) => <StatusTag status={r.status} />} style={{ width: 150 }} />
                        <Column field="submittedOn" header="Submitted" sortable body={(r: SuggestionListItem) => formatDate(r.submittedOn)} style={{ width: 130 }} />
                    </DataTable>
                </div>
            </main>

            {detail && (
                <SuggestionDialog
                    detail={detail}
                    onHide={closeDetail}
                    onChanged={async () => { await openDetail(detail.suG_MasterID); load(); }}
                />
            )}
            {showNew && <NewSuggestionDialog onHide={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />}
        </div>
    );
};

const SuggestionDialog: React.FC<{ detail: SuggestionDetail; onHide: () => void; onChanged: () => void }> = ({ detail, onHide, onChanged }) => {
    const [nextStatus, setNextStatus] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [implType, setImplType] = useState<string | null>(null);
    const [implId, setImplId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    const save = async () => {
        setBusy(true);
        try {
            if (nextStatus) await featureApi.suggestions.setStatus(detail.suG_MasterID, nextStatus, comment, implType, implId);
            else if (comment.trim()) await featureApi.suggestions.comment(detail.suG_MasterID, comment.trim());
            else return;
            setNextStatus(null);
            setComment('');
            notify.success(nextStatus ? `Status: ${STATUS_LABEL[nextStatus]}` : 'Comment added');
            onChanged();
        } catch (err) {
            notify.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const moves = MOVES[detail.status] ?? [];

    return (
        <Dialog header={`${detail.suggestionNo ?? 'Suggestion'} – ${detail.title}`} visible onHide={onHide} style={{ width: '900px', maxWidth: '96vw' }}>
            <div className="reader-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <StatusTag status={detail.status} />
                <span><i className="pi pi-flag" /> {detail.vesselName || 'Office'}</span>
                <span><i className="pi pi-user" /> {detail.submittedByName ?? detail.submittedBy}{detail.submittedRank ? ` (${detail.submittedRank})` : ''}</span>
                <span><i className="pi pi-calendar" /> {formatDateTime(detail.submittedOn)}</span>
                <span>Priority: {detail.priority}</span>
                {detail.itemType && <span>About: {detail.itemTitle || `${detail.itemType} ${detail.itemID}`}</span>}
            </div>
            {detail.quotedText && <blockquote style={{ borderLeft: '3px solid var(--border-color)', margin: '0 0 12px', padding: '4px 12px' }}>{detail.quotedText}</blockquote>}
            {detail.description && <p style={{ whiteSpace: 'pre-wrap' }}>{detail.description}</p>}
            {detail.files.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                    {detail.files.map((f) => (
                        <Button key={f.id} label={`${f.fileName} (${formatSize(f.blobSize)})`} icon="pi pi-paperclip" text size="small"
                            onClick={() => openApiFile(featureApi.suggestions.fileUrl(f.id), f.fileName).catch((e) => notify.error(errorMessage(e)))} />
                    ))}
                </div>
            )}

            <h4>History</h4>
            <ul className="feature-log">
                {detail.log.map((l) => (
                    <li key={l.suG_LogID}>
                        <div className="log-head">
                            <span>{formatDateTime(l.logDate)}</span>
                            <span>{l.userName ?? l.userID}</span>
                            {l.status && <StatusTag status={l.status} />}
                        </div>
                        {l.comment && <div className="log-text">{l.comment}</div>}
                    </li>
                ))}
            </ul>

            <div className="feature-form" style={{ marginTop: 16 }}>
                <div className="field">
                    <label htmlFor="sug-next">Change status</label>
                    <Dropdown id="sug-next" value={nextStatus} showClear placeholder="Keep the status (comment only)"
                        options={moves.map((m) => ({ label: STATUS_LABEL[m], value: m }))} onChange={(e) => setNextStatus(e.value ?? null)} />
                </div>
                {nextStatus === 'Implemented' && (
                    <div className="field">
                        <label>Implemented in</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Dropdown value={implType} options={ITEM_TYPES.slice(1)} onChange={(e) => setImplType(e.value)} placeholder="Type" />
                            <InputNumber value={implId} onValueChange={(e) => setImplId(e.value ?? null)} placeholder="ID" useGrouping={false} />
                        </div>
                    </div>
                )}
                <div className="field full">
                    <label htmlFor="sug-comment">
                        {nextStatus === 'NeedsInfo' ? 'What information is needed' : nextStatus === 'Rejected' ? 'Reason' : 'Comment'}
                    </label>
                    <InputTextarea id="sug-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} autoResize />
                    {detail.vesselID > 0 && <span className="hint">Status changes and comments go to the vessel with the next sync.</span>}
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <Button label="Close" text onClick={onHide} />
                <Button label={nextStatus ? 'Save status' : 'Add comment'} icon="pi pi-check" loading={busy}
                    disabled={!nextStatus && !comment.trim()} onClick={save} />
            </div>
        </Dialog>
    );
};

export const NewSuggestionDialog: React.FC<{
    onHide: () => void;
    onSaved: () => void;
    itemType?: string;
    itemId?: number;
    itemTitle?: string;
}> = ({ onHide, onSaved, itemType, itemId, itemTitle }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<string | null>(itemType ?? null);
    const [quoted, setQuoted] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [files, setFiles] = useState<File[]>([]);
    const [busy, setBusy] = useState(false);

    const save = async () => {
        if (!title.trim()) { notify.warn('Enter a title.'); return; }
        const form = new FormData();
        form.append('title', title.trim());
        if (description.trim()) form.append('description', description.trim());
        if (type) form.append('itemType', type);
        if (type && itemId) form.append('itemId', String(itemId));
        if (quoted.trim()) form.append('quotedText', quoted.trim());
        form.append('priority', priority);
        files.forEach((f) => form.append('files', f));
        setBusy(true);
        try {
            await featureApi.suggestions.create(form);
            notify.success('Suggestion submitted');
            onSaved();
        } catch (err) {
            notify.error(errorMessage(err), 'Could not submit the suggestion');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog header="New suggestion" visible onHide={onHide} style={{ width: '720px', maxWidth: '96vw' }}>
            <div className="feature-form">
                <div className="field full">
                    <label htmlFor="ns-title">Title</label>
                    <InputText id="ns-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={250} autoFocus />
                </div>
                <div className="field">
                    <label>About</label>
                    {itemTitle ? <span>{itemTitle}</span> : <Dropdown value={type} options={ITEM_TYPES} onChange={(e) => setType(e.value)} />}
                </div>
                <div className="field">
                    <label>Priority</label>
                    <Dropdown value={priority} options={['Low', 'Medium', 'High']} onChange={(e) => setPriority(e.value)} />
                </div>
                <div className="field full">
                    <label htmlFor="ns-desc">Suggestion</label>
                    <InputTextarea id="ns-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} autoResize />
                </div>
                <div className="field full">
                    <label htmlFor="ns-quote">Text it is about (optional)</label>
                    <InputTextarea id="ns-quote" value={quoted} onChange={(e) => setQuoted(e.target.value)} rows={2} maxLength={1000} autoResize />
                </div>
                <div className="field full">
                    <label htmlFor="ns-files">Attachments</label>
                    <input id="ns-files" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <Button label="Cancel" text onClick={onHide} />
                <Button label="Submit" icon="pi pi-send" loading={busy} onClick={save} />
            </div>
        </Dialog>
    );
};

export default SuggestionsPage;
