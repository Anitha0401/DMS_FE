import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import PageHeader from '../PageHeader';
import MetricCard from '../Dashboard/Manuals/MetricCard';
import authService from '../../services/authService';
import featureApi, { CertificateItem, CertificateType, openApiFile, VesselOption } from '../../services/featureApi';
import { errorMessage } from '../../services/DMSLifecycleService';
import notify from '../../services/notify';
import { formatDate } from '../utils/formatDate';
import './Features.scss';

const STATUS_TEXT: Record<string, string> = { Valid: 'Valid', Expiring: 'Expiring soon', Expired: 'Expired', NoExpiry: 'No expiry' };

/** Sends a date as yyyy-MM-dd (no time zone shift). */
const isoDate = (d: Date | null | undefined) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';

/** Feature 6: vessel certificates (other documents of a certificate type) with their expiry. */
const CertificatesPage: React.FC = () => {
    const isAdmin = (authService.currentUser()?.role ?? '').toLowerCase() === 'admin';
    const [searchParams] = useSearchParams();
    const [rows, setRows] = useState<CertificateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [vesselId, setVesselId] = useState<number | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [includeReplaced, setIncludeReplaced] = useState(false);
    const [vessels, setVessels] = useState<VesselOption[]>([]);
    const [types, setTypes] = useState<CertificateType[]>([]);
    const [showNew, setShowNew] = useState<CertificateItem | 'new' | null>(null);
    const [showTypes, setShowTypes] = useState(false);
    const linkedId = Number(searchParams.get('id') || 0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await featureApi.certificates.list(vesselId, null, includeReplaced || !!linkedId));
        } catch (err) {
            notify.error(errorMessage(err), 'Could not load certificates');
        } finally {
            setLoading(false);
        }
    }, [vesselId, includeReplaced, linkedId]);

    const loadTypes = useCallback(() => featureApi.certificates.types().then(setTypes).catch(() => setTypes([])), []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { featureApi.vessels().then(setVessels).catch(() => setVessels([])); loadTypes(); }, [loadTypes]);

    const counts = useMemo(() => ({
        expired: rows.filter((r) => r.status === 'Expired').length,
        expiring: rows.filter((r) => r.status === 'Expiring').length,
        valid: rows.filter((r) => r.status === 'Valid' || r.status === 'NoExpiry').length,
    }), [rows]);

    const shown = useMemo(() => {
        let list = status ? rows.filter((r) => r.status === status) : rows;
        if (linkedId) list = [...list].sort((a, b) => (a.otherDocumentMasterID === linkedId ? -1 : b.otherDocumentMasterID === linkedId ? 1 : 0));
        return list;
    }, [rows, status, linkedId]);

    return (
        <div className="feature-page">
            <PageHeader
                title="Certificates"
                actions={(
                    <>
                        {isAdmin && <Button label="Certificate types" icon="pi pi-cog" outlined onClick={() => setShowTypes(true)} />}
                        <Button label="Add certificate" icon="pi pi-plus" onClick={() => setShowNew('new')} />
                    </>
                )}
            />
            <main className="feature-main">
                <div className="pending-cards">
                    <MetricCard number={counts.expired} label="Expired" icon="pi pi-times-circle" color="red" css="stat-card-red" action={() => setStatus('Expired')} />
                    <MetricCard number={counts.expiring} label="Expiring soon" icon="pi pi-exclamation-triangle" color="orange" css="stat-card-orange" action={() => setStatus('Expiring')} />
                    <MetricCard number={counts.valid} label="Valid" icon="pi pi-verified" color="green" css="stat-card-green" action={() => setStatus(null)} />
                </div>
                <div className="feature-toolbar">
                    <Dropdown value={vesselId} filter optionLabel="vslName" optionValue="vesselID"
                        options={[{ vesselID: null, vslName: 'All vessels' }, ...vessels]} onChange={(e) => setVesselId(e.value)} />
                    <Dropdown value={status} options={[{ label: 'Any status', value: null }, ...Object.entries(STATUS_TEXT).map(([value, label]) => ({ label, value }))]}
                        onChange={(e) => setStatus(e.value)} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Checkbox inputId="cert-old" checked={includeReplaced} onChange={(e) => setIncludeReplaced(!!e.checked)} />
                        <label htmlFor="cert-old">Show renewed (old) certificates</label>
                    </span>
                    <span className="spacer" />
                    <Button icon="pi pi-refresh" text aria-label="Refresh" onClick={load} />
                </div>
                <div className="feature-card">
                    <DataTable value={shown} loading={loading} paginator rows={25} stripedRows size="small" emptyMessage="No certificates."
                        rowClassName={(r: CertificateItem) => (r.otherDocumentMasterID === linkedId ? 'p-highlight' : '')}>
                        <Column field="vesselName" header="Vessel" sortable />
                        <Column field="documentType" header="Type" sortable />
                        <Column field="documentTitle" header="Certificate" sortable body={(r: CertificateItem) => (
                            <span>{r.documentTitle}{r.certificateNo ? <small style={{ display: 'block', opacity: 0.7 }}>No. {r.certificateNo}</small> : null}</span>
                        )} />
                        <Column field="issuedBy" header="Issued by" sortable />
                        <Column field="issueDate" header="Issued" sortable body={(r: CertificateItem) => formatDate(r.issueDate)} />
                        <Column field="expiryDate" header="Expires" sortable body={(r: CertificateItem) => formatDate(r.expiryDate)} />
                        <Column field="nextSurveyDate" header="Next survey" sortable body={(r: CertificateItem) => formatDate(r.nextSurveyDate)} />
                        <Column field="status" header="Status" sortable body={(r: CertificateItem) => (
                            <span className={`feature-tag ${r.status.toLowerCase()}`}>{STATUS_TEXT[r.status]}</span>
                        )} />
                        <Column header="" style={{ width: 110 }} body={(r: CertificateItem) => (
                            <div style={{ display: 'flex' }}>
                                {r.firstFileID && (
                                    <Button icon="pi pi-file-pdf" text aria-label="Open" tooltip="Open"
                                        onClick={() => openApiFile(featureApi.certificates.fileUrl(r.firstFileID!), `${r.documentTitle || 'certificate'}.pdf`)
                                            .catch((e) => notify.error(errorMessage(e)))} />
                                )}
                                <Button icon="pi pi-replay" text aria-label="Renew" tooltip="Add the renewed certificate" onClick={() => setShowNew(r)} />
                            </div>
                        )} />
                    </DataTable>
                </div>
            </main>

            {showNew && (
                <NewCertificateDialog
                    renew={showNew === 'new' ? null : showNew}
                    vessels={vessels}
                    types={types.filter((t) => t.isCertificate)}
                    onHide={() => setShowNew(null)}
                    onSaved={() => { setShowNew(null); load(); }}
                />
            )}
            {showTypes && <CertificateTypesDialog types={types} onHide={() => { setShowTypes(false); loadTypes(); load(); }} />}
        </div>
    );
};

const NewCertificateDialog: React.FC<{
    renew: CertificateItem | null;
    vessels: VesselOption[];
    types: CertificateType[];
    onHide: () => void;
    onSaved: () => void;
}> = ({ renew, vessels, types, onHide, onSaved }) => {
    const [vesselId, setVesselId] = useState<number | null>(renew?.vesselID ?? null);
    const [typeId, setTypeId] = useState<number | null>(renew?.otherDocument_TypeID ?? null);
    const [title, setTitle] = useState(renew?.documentTitle ?? '');
    const [certificateNo, setCertificateNo] = useState('');
    const [issuedBy, setIssuedBy] = useState(renew?.issuedBy ?? '');
    const [issueDate, setIssueDate] = useState<Date | null>(null);
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [surveyDate, setSurveyDate] = useState<Date | null>(null);
    const [remarks, setRemarks] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [busy, setBusy] = useState(false);

    const save = async () => {
        if (!vesselId || !typeId || !title.trim()) { notify.warn('Choose the vessel and type, and enter a title.'); return; }
        if (files.length === 0) { notify.warn('Attach the certificate.'); return; }
        const form = new FormData();
        form.append('vesselId', String(vesselId));
        form.append('typeId', String(typeId));
        form.append('title', title.trim());
        if (certificateNo.trim()) form.append('certificateNo', certificateNo.trim());
        if (issuedBy.trim()) form.append('issuedBy', issuedBy.trim());
        if (issueDate) form.append('issueDate', isoDate(issueDate));
        if (expiryDate) form.append('expiryDate', isoDate(expiryDate));
        if (surveyDate) form.append('nextSurveyDate', isoDate(surveyDate));
        if (renew) form.append('replacesId', String(renew.otherDocumentMasterID));
        if (remarks.trim()) form.append('remarks', remarks.trim());
        files.forEach((f) => form.append('files', f));
        setBusy(true);
        try {
            await featureApi.certificates.create(form);
            notify.success('Certificate saved; it goes to the vessel with the next sync.');
            onSaved();
        } catch (err) {
            notify.error(errorMessage(err), 'Could not save the certificate');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog header={renew ? `Renew: ${renew.documentTitle}` : 'Add certificate'} visible onHide={onHide} style={{ width: '760px', maxWidth: '96vw' }}>
            {types.length === 0 && (
                <p className="hint">No document type is marked as a certificate yet. An administrator can mark them under "Certificate types".</p>
            )}
            <div className="feature-form">
                <div className="field">
                    <label>Vessel</label>
                    <Dropdown value={vesselId} options={vessels} optionLabel="vslName" optionValue="vesselID" filter disabled={!!renew}
                        onChange={(e) => setVesselId(e.value)} placeholder="Choose the vessel" />
                </div>
                <div className="field">
                    <label>Type</label>
                    <Dropdown value={typeId} options={types} optionLabel="documentType" optionValue="otherDocument_TypeID"
                        onChange={(e) => setTypeId(e.value)} placeholder="Choose the type" />
                </div>
                <div className="field full">
                    <label htmlFor="nc-title">Title</label>
                    <InputText id="nc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={250} />
                </div>
                <div className="field">
                    <label htmlFor="nc-no">Certificate number</label>
                    <InputText id="nc-no" value={certificateNo} onChange={(e) => setCertificateNo(e.target.value)} maxLength={50} />
                </div>
                <div className="field">
                    <label htmlFor="nc-by">Issued by</label>
                    <InputText id="nc-by" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} maxLength={150} />
                </div>
                <div className="field">
                    <label>Issue date</label>
                    <Calendar value={issueDate} onChange={(e) => setIssueDate((e.value as Date) ?? null)} dateFormat="d M yy" showIcon />
                </div>
                <div className="field">
                    <label>Expiry date</label>
                    <Calendar value={expiryDate} onChange={(e) => setExpiryDate((e.value as Date) ?? null)} dateFormat="d M yy" showIcon />
                </div>
                <div className="field">
                    <label>Next survey</label>
                    <Calendar value={surveyDate} onChange={(e) => setSurveyDate((e.value as Date) ?? null)} dateFormat="d M yy" showIcon />
                </div>
                <div className="field full">
                    <label htmlFor="nc-rem">Remarks</label>
                    <InputTextarea id="nc-rem" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} autoResize />
                </div>
                <div className="field full">
                    <label htmlFor="nc-files">Certificate file(s)</label>
                    <input id="nc-files" type="file" multiple accept=".pdf,image/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <Button label="Cancel" text onClick={onHide} />
                <Button label="Save" icon="pi pi-check" loading={busy} onClick={save} />
            </div>
        </Dialog>
    );
};

const CertificateTypesDialog: React.FC<{ types: CertificateType[]; onHide: () => void }> = ({ types, onHide }) => {
    const [list, setList] = useState<CertificateType[]>(types);

    const save = async (t: CertificateType) => {
        try {
            await featureApi.certificates.saveType(t);
            setList((l) => l.map((x) => (x.otherDocument_TypeID === t.otherDocument_TypeID ? t : x)));
        } catch (err) {
            notify.error(errorMessage(err));
        }
    };

    return (
        <Dialog header="Certificate types" visible onHide={onHide} style={{ width: '640px', maxWidth: '96vw' }}>
            <p className="hint">Documents of a type marked as a certificate show here with their expiry. "Warn" = days before expiry it shows as expiring.</p>
            <DataTable value={list} size="small" stripedRows>
                <Column field="documentType" header="Document type" />
                <Column header="Certificate" body={(t: CertificateType) => (
                    <Checkbox checked={t.isCertificate} onChange={(e) => save({ ...t, isCertificate: !!e.checked })} />
                )} style={{ width: 110 }} />
                <Column header="Warn (days)" body={(t: CertificateType) => (
                    <InputNumber value={t.warningDays} min={0} max={3650} size={5} disabled={!t.isCertificate}
                        onValueChange={(e) => { if (e.value != null && e.value !== t.warningDays) save({ ...t, warningDays: e.value }); }} />
                )} style={{ width: 140 }} />
            </DataTable>
        </Dialog>
    );
};

export default CertificatesPage;
