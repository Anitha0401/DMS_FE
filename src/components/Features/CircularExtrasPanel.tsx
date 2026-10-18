import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AutoComplete } from 'primereact/autocomplete';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import featureApi, { CircularExtras, CircularManualLink, itemLink, SearchHit } from '../../services/featureApi';
import { errorMessage } from '../../services/DMSLifecycleService';
import notify from '../../services/notify';
import { formatDate } from '../utils/formatDate';
import './Features.scss';

export const LINK_TYPES = [
    { label: 'Amends', value: 'Amends' },
    { label: 'Supersedes', value: 'Supersedes' },
    { label: 'Refers to', value: 'RefersTo' },
];

const linkTypeText = (t: string) => LINK_TYPES.find((x) => x.value === t)?.label ?? t;

const isoDate = (d: Date | null) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null;

/** Picks a manual or circular through the search API. */
const ItemPicker: React.FC<{ type: 'Manual' | 'Circular'; value: SearchHit | null; onChange: (h: SearchHit | null) => void; placeholder: string }> =
    ({ type, value, onChange, placeholder }) => {
        const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
        const [typed, setTyped] = useState<string | SearchHit>(value ?? '');
        return (
            <AutoComplete
                value={typed}
                suggestions={suggestions}
                field="title"
                placeholder={placeholder}
                forceSelection
                itemTemplate={(h: SearchHit) => <span>{h.number ? `${h.number} – ` : ''}{h.title}</span>}
                selectedItemTemplate={(h: SearchHit) => `${h.number ? `${h.number} – ` : ''}${h.title ?? ''}`}
                completeMethod={(e) => featureApi.search(e.query, type)
                    .then((hits) => setSuggestions(hits.filter((h) => type === 'Manual' ? h.itemType === 'Manual' : h.itemType === 'Circular' || h.itemType === 'Alert')))
                    .catch(() => setSuggestions([]))}
                onChange={(e) => { setTyped(e.value); onChange(e.value && typeof e.value === 'object' ? e.value : null); }}
                style={{ width: '100%' }}
                inputStyle={{ width: '100%' }}
            />
        );
    };

/**
 * Features 3 and 7 on a circular / alert: days to acknowledge, "valid until", the manuals it amends or refers to,
 * and cancel / supersede. Shown in the circular's detail pane.
 */
const CircularExtrasPanel: React.FC<{ circularId: number; canEdit?: boolean; onChanged?: () => void }> = ({ circularId, canEdit = true, onChanged }) => {
    const [extras, setExtras] = useState<CircularExtras | null>(null);
    const [ackDays, setAckDays] = useState<number | null>(null);
    const [validUntil, setValidUntil] = useState<Date | null>(null);
    const [busy, setBusy] = useState(false);
    const [showLink, setShowLink] = useState(false);
    const [showCancel, setShowCancel] = useState(false);

    const load = useCallback(async () => {
        try {
            const e = await featureApi.circular.get(circularId);
            setExtras(e);
            setAckDays(e.ackDueDays ?? null);
            setValidUntil(e.validUntil ? new Date(e.validUntil) : null);
        } catch {
            setExtras(null); // 012 not run yet, or no such circular: hide the panel
        }
    }, [circularId]);

    useEffect(() => { load(); }, [load]);

    if (!extras) return null;

    const dirty = (extras.ackDueDays ?? null) !== ackDays || isoDate(validUntil) !== (extras.validUntil ? extras.validUntil.substring(0, 10) : null);

    const save = async () => {
        setBusy(true);
        try {
            await featureApi.circular.save(circularId, ackDays, isoDate(validUntil));
            notify.success('Saved');
            await load();
            onChanged?.();
        } catch (err) {
            notify.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const removeLink = async (l: CircularManualLink) => {
        try {
            await featureApi.circular.removeLink(l.ciR_ManualLinkID);
            load();
        } catch (err) {
            notify.error(errorMessage(err));
        }
    };

    const cancelled = extras.status === 'Cancelled';
    const expired = !!extras.validUntil && new Date(extras.validUntil) < new Date(new Date().toDateString());

    return (
        <div className="feature-card extras-panel">
            <h4><i className="pi pi-link" /> Validity and related manuals
                {cancelled && <span className="feature-tag cancelled">Cancelled{extras.supersededByNumber ? ` – superseded by ${extras.supersededByNumber}` : ''}</span>}
                {!cancelled && expired && <span className="feature-tag expired">No longer valid</span>}
            </h4>
            <div className="extras-row">
                <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor={`ack-${circularId}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>Days to acknowledge</label>
                    <InputNumber inputId={`ack-${circularId}`} value={ackDays} min={0} max={3650} useGrouping={false} disabled={!canEdit || cancelled}
                        onValueChange={(e) => setAckDays(e.value ?? null)} placeholder="Default" size={6} />
                </div>
                <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Valid until{extras.requiresValidUntil ? ' *' : ''}</label>
                    <Calendar value={validUntil} onChange={(e) => setValidUntil((e.value as Date) ?? null)} dateFormat="d M yy" showIcon showButtonBar
                        disabled={!canEdit || cancelled} placeholder={extras.requiresValidUntil ? 'Required' : 'No end date'} />
                </div>
                {canEdit && !cancelled && <Button label="Save" icon="pi pi-check" size="small" loading={busy} disabled={!dirty} onClick={save} />}
                <span style={{ flex: 1 }} />
                {canEdit && <Button label="Link a manual" icon="pi pi-plus" size="small" outlined onClick={() => setShowLink(true)} />}
                {canEdit && !cancelled && extras.status !== 'Draft' && extras.status !== 'Temp' && (
                    <Button label="Cancel / supersede" icon="pi pi-ban" size="small" severity="danger" outlined onClick={() => setShowCancel(true)} />
                )}
            </div>
            <div className="extras-links">
                {extras.links.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No manuals linked.</span>}
                {extras.links.map((l) => {
                    const link = itemLink('Manual', l.dM_ManualID);
                    return (
                        <div key={l.ciR_ManualLinkID} className="link-line">
                            <span className={`feature-tag ${l.isActive ? 'info' : 'muted'}`}>{linkTypeText(l.linkType)}</span>
                            <Link to={{ pathname: link.pathname, search: link.search }}>{l.manualNo} {l.manualName}</Link>
                            {l.remarks && <span style={{ color: 'var(--text-muted)' }}>– {l.remarks}</span>}
                            {!l.isActive && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(taken into the manual {formatDate(l.closedOn)})</span>}
                            {canEdit && <Button icon="pi pi-times" text rounded size="small" aria-label="Remove link" onClick={() => removeLink(l)} />}
                        </div>
                    );
                })}
            </div>

            {showLink && <AddLinkDialog circularId={circularId} onHide={() => setShowLink(false)} onSaved={() => { setShowLink(false); load(); }} />}
            {showCancel && (
                <CancelDialog circularId={circularId} onHide={() => setShowCancel(false)}
                    onSaved={() => { setShowCancel(false); load(); onChanged?.(); }} />
            )}
        </div>
    );
};

const AddLinkDialog: React.FC<{ circularId: number; onHide: () => void; onSaved: () => void }> = ({ circularId, onHide, onSaved }) => {
    const [manual, setManual] = useState<SearchHit | null>(null);
    const [linkType, setLinkType] = useState('Amends');
    const [remarks, setRemarks] = useState('');
    const [busy, setBusy] = useState(false);

    const save = async () => {
        if (!manual) { notify.warn('Choose a manual.'); return; }
        setBusy(true);
        try {
            await featureApi.circular.addLink(circularId, manual.itemID, linkType, remarks.trim());
            onSaved();
        } catch (err) {
            notify.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog header="Link a manual" visible onHide={onHide} style={{ width: '560px', maxWidth: '96vw' }}>
            <div className="feature-form">
                <div className="field full">
                    <label>Manual</label>
                    <ItemPicker type="Manual" value={manual} onChange={setManual} placeholder="Type a manual number or name" />
                </div>
                <div className="field">
                    <label>This circular…</label>
                    <Dropdown value={linkType} options={LINK_TYPES} onChange={(e) => setLinkType(e.value)} />
                </div>
                <div className="field full">
                    <label htmlFor="al-rem">Section / remarks</label>
                    <InputText id="al-rem" value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} placeholder="e.g. Section 4.2 Bunkering" />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <Button label="Cancel" text onClick={onHide} />
                <Button label="Link" icon="pi pi-link" loading={busy} onClick={save} />
            </div>
        </Dialog>
    );
};

const CancelDialog: React.FC<{ circularId: number; onHide: () => void; onSaved: () => void }> = ({ circularId, onHide, onSaved }) => {
    const [by, setBy] = useState<SearchHit | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const save = async () => {
        setBusy(true);
        try {
            await featureApi.circular.cancel(circularId, by?.itemID ?? null, reason.trim());
            notify.success('Cancelled; the vessels are told with the next sync.');
            onSaved();
        } catch (err) {
            notify.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog header="Cancel or supersede" visible onHide={onHide} style={{ width: '560px', maxWidth: '96vw' }}>
            <div className="feature-form">
                <div className="field full">
                    <label>Superseded by (optional)</label>
                    <ItemPicker type="Circular" value={by} onChange={setBy} placeholder="The circular that replaces it" />
                </div>
                <div className="field full">
                    <label htmlFor="cc-reason">Reason</label>
                    <InputTextarea id="cc-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} autoResize />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <Button label="Back" text onClick={onHide} />
                <Button label="Cancel circular" icon="pi pi-ban" severity="danger" loading={busy} onClick={save} />
            </div>
        </Dialog>
    );
};

/** On a manual: its days to acknowledge, and the circulars / alerts that amend or refer to it. */
export const ManualRelatedCirculars: React.FC<{ manualId: number }> = ({ manualId }) => {
    const [links, setLinks] = useState<CircularManualLink[]>([]);
    const [ackDays, setAckDays] = useState<number | null>(null);
    const [saved, setSaved] = useState<number | null>(null);
    const [available, setAvailable] = useState(false);

    const load = useCallback(async () => {
        if (!manualId || manualId <= 0) { setAvailable(false); return; }
        try {
            const [l, m] = await Promise.all([featureApi.circular.forManual(manualId), featureApi.circular.manual(manualId)]);
            setLinks(l);
            setAckDays(m?.ackDueDays ?? null);
            setSaved(m?.ackDueDays ?? null);
            setAvailable(true);
        } catch {
            setAvailable(false);
        }
    }, [manualId]);

    useEffect(() => { load(); }, [load]);

    if (!available) return null;

    const open = links.filter((l) => l.isActive && l.circularStatus !== 'Cancelled');

    const saveDays = async () => {
        try {
            await featureApi.circular.saveManual(manualId, ackDays);
            setSaved(ackDays);
            notify.success('Saved');
        } catch (err) {
            notify.error(errorMessage(err));
        }
    };

    const closeLinks = async () => {
        try {
            await featureApi.circular.closeLinks(manualId);
            load();
        } catch (err) {
            notify.error(errorMessage(err));
        }
    };

    return (
        <div className="feature-card extras-panel">
            <h4><i className="pi pi-megaphone" /> Related circulars and alerts
                {open.length > 0 && <span className="feature-tag warn">{open.length} open amendment(s)</span>}
            </h4>
            <div className="extras-row">
                <span style={{ fontSize: '0.85rem' }}>Days to acknowledge</span>
                <InputNumber value={ackDays} min={0} max={3650} useGrouping={false} size={5} placeholder="Default" onValueChange={(e) => setAckDays(e.value ?? null)} />
                <Button label="Save" size="small" text disabled={ackDays === saved} onClick={saveDays} />
                <span style={{ flex: 1 }} />
                {open.some((l) => l.linkType !== 'RefersTo') && (
                    <Button label="Amendments taken into this manual" icon="pi pi-check" size="small" outlined onClick={closeLinks}
                        tooltip="Use after releasing the revision that includes them" />
                )}
            </div>
            <div className="extras-links">
                {links.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No circulars refer to this manual.</span>}
                {links.map((l) => {
                    const link = itemLink(l.circularType?.startsWith('Alert') ? 'Alert' : 'Circular', l.ciR_MasterID);
                    return (
                        <div key={l.ciR_ManualLinkID} className="link-line">
                            <span className={`feature-tag ${l.isActive ? 'info' : 'muted'}`}>{linkTypeText(l.linkType)}</span>
                            <Link to={{ pathname: link.pathname, search: link.search }}>{l.circularNumber} {l.circularTitle}</Link>
                            {l.remarks && <span style={{ color: 'var(--text-muted)' }}>– {l.remarks}</span>}
                            {l.circularStatus === 'Cancelled' && <span className="feature-tag cancelled">Cancelled</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CircularExtrasPanel;
