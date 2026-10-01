import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { SelectButton } from 'primereact/selectbutton';
import { Checkbox } from 'primereact/checkbox';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import { Vessel } from '../../VesselDetails/VesselDetails';
import './AddEditCircular.scss';

interface AddEditCircularProps {
    initialData?: CircularFormData;
    onSubmit: (data: CircularFormData) => void;
    onCancel: () => void;
    circularType: string;
    selectedAction: string;
    selectedCIR_MasterID: number;
}

interface CircularFormData {
    ciR_MasterID: number;
    ciR_BlobID: number;
    circularType: string;
    ciR_CategoryID: number;
    ciR_Number: string;
    allowedUserToAck: string;
    requireAcknowledgement?: boolean;
    reference: string,
    title: string;
    status: 'Active' | 'Archived' | 'Draft';
    priority: '1' | '2' | '3';
    dateIssued: Date | null;
    releasedDate: Date | null;
    remarks?: string;
    createdBy?: string;

    description?: string;
    fileName?: string;
    fileType?: string;
    originalFileType?: string;
    blobSize?: string;
    blobContents?: Uint8Array | string;
    calledMode?: string;
    vesselIdList?: number[];
}

interface AllowedUserOption {
    label: string;
    value: string;
    department?: string;
}

const toAllowedUserOptions = (value: any): AllowedUserOption[] => {
    const values = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(',').map(item => item.trim()).filter(Boolean)
            : [];

    return values.map(item => {
        if (typeof item === 'string') {
            return { label: item, value: item };
        }

        const optionValue = String(item.value ?? item.id ?? item.userRank ?? item.userName ?? item.name ?? '');
        return {
            label: String(item.label ?? item.userRank ?? item.userName ?? item.name ?? optionValue),
            value: optionValue
        };
    }).filter(option => option.value);
};

const toVesselRankOptions = (ranks: any): AllowedUserOption[] => {
    if (!Array.isArray(ranks)) return [];

    return ranks
        .map((rank): AllowedUserOption | null => {
            const userRank = String(rank?.userRank ?? rank?.UserRank ?? '').trim();
            const department = String(rank?.userDeptDisplay ?? rank?.UserDeptDisplay ?? '').trim();
            return userRank
                ? { label: userRank, value: userRank, department }
                : null;
        })
        .filter((option): option is AllowedUserOption => option !== null);
};

const toAllowedUserValues = (value: any): string[] =>
    toAllowedUserOptions(value).map(option => option.value);

const toVesselIds = (value: any): number[] => {
    if (!Array.isArray(value)) return [];

    return value
        .map(item => {
            if (typeof item === 'number') return item;
            return Number(item?.vesselID ?? item?.vesselId ?? item?.id ?? item);
        })
        .filter(vesselId => Number.isFinite(vesselId) && vesselId > 0);
};

const getReferenceValue = (data: any): string =>
    String(data?.reference ?? data?.Reference ?? data?.circularReference ?? data?.cirReference ?? '');

const decodeBlobContents = (contents: Uint8Array | string): Uint8Array | null => {
    if (contents instanceof Uint8Array) return contents;
    if (typeof contents !== 'string' || !contents.trim()) return null;

    try {
        const base64 = contents.includes(',')
            ? contents.slice(contents.indexOf(',') + 1)
            : contents;
        const byteCharacters = window.atob(base64);
        const byteArray = new Uint8Array(byteCharacters.length);

        for (let index = 0; index < byteCharacters.length; index += 1) {
            byteArray[index] = byteCharacters.charCodeAt(index);
        }

        return byteArray;
    } catch {
        return null;
    }
};

const defaultData: CircularFormData = {
    ciR_MasterID: -1,
    ciR_BlobID: -1,
    circularType: 'circulars',
    ciR_CategoryID: -1,
    ciR_Number: '',
    allowedUserToAck: '',
    requireAcknowledgement: false,
    reference: '',
    title: '',
    status: 'Draft',
    priority: '3',
    dateIssued: null,
    releasedDate: null,
    remarks: '',
    createdBy: '',
    description: '',
    fileName: '',
    fileType: '',
    originalFileType: '',
    blobSize: '',
    blobContents: undefined,
    calledMode: 'New',
    vesselIdList: []
}

/* ---------- Attachment (one file per circular: the API stores a single blob) ---------- */

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

const fileExtension = (name: string) => (name.split('.').pop() || '').toLowerCase();

const fileIcon = (name: string) => {
    const ext = fileExtension(name);
    if (ext === 'pdf') return 'pi-file-pdf';
    if (ext === 'doc' || ext === 'docx') return 'pi-file-word';
    if (ext === 'xls' || ext === 'xlsx') return 'pi-file-excel';
    return 'pi-file';
};

const formatFileSize = (bytes: number) => {
    if (!bytes || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ---------- Vessel picker (search, type filter, select all) ---------- */

interface VesselPickerProps {
    vessels: Vessel[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
}

const VesselPicker: React.FC<VesselPickerProps> = ({ vessels, selectedIds, onChange }) => {
    const [search, setSearch] = useState('');
    const [type, setType] = useState<string>('all');

    const types = useMemo(
        () => Array.from(new Set(vessels.map(v => v.vslType).filter(Boolean))).sort(),
        [vessels]
    );

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return vessels.filter(v =>
            (type === 'all' || v.vslType === type) &&
            (!term || v.vslName?.toLowerCase().includes(term) || v.vslType?.toLowerCase().includes(term))
        );
    }, [vessels, search, type]);

    const selected = new Set(selectedIds);
    const allVisibleSelected = visible.length > 0 && visible.every(v => selected.has(v.vesselID));

    const toggle = (id: number) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        onChange(Array.from(next));
    };

    const toggleAllVisible = () => {
        const next = new Set(selected);
        if (allVisibleSelected) visible.forEach(v => next.delete(v.vesselID));
        else visible.forEach(v => next.add(v.vesselID));
        onChange(Array.from(next));
    };

    return (
        <div className="cir-vessels">
            <div className="cir-vessels-search">
                <i className="pi pi-search" />
                <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vessels" aria-label="Search vessels" />
            </div>
            {types.length > 1 && (
                <div className="cir-vessels-types" role="group" aria-label="Vessel type">
                    {['all', ...types].map(t => (
                        <button
                            key={t}
                            type="button"
                            className={`cir-chip${type === t ? ' active' : ''}`}
                            onClick={() => setType(t)}
                        >
                            {t === 'all' ? 'All types' : t}
                        </button>
                    ))}
                </div>
            )}
            <div className="cir-vessels-head">
                <label className="cir-check">
                    <Checkbox checked={allVisibleSelected} onChange={toggleAllVisible} disabled={visible.length === 0} />
                    <span>Select all shown</span>
                </label>
                <span className="cir-muted">
                    {selectedIds.length} of {vessels.length} selected
                    {selectedIds.length > 0 && (
                        <button type="button" className="cir-link" onClick={() => onChange([])}>Clear</button>
                    )}
                </span>
            </div>
            <ul className="cir-vessels-list">
                {visible.length === 0 && <li className="cir-vessels-empty">No vessels found</li>}
                {visible.map(v => (
                    <li key={v.vesselID}>
                        <label className={`cir-check cir-vessel-row${selected.has(v.vesselID) ? ' checked' : ''}`}>
                            <Checkbox checked={selected.has(v.vesselID)} onChange={() => toggle(v.vesselID)} />
                            <span className="cir-vessel-name">{v.vslName}</span>
                            <span className="cir-vessel-type">{v.vslType}</span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AddEditCircular: React.FC<AddEditCircularProps> = ({ initialData, onSubmit, onCancel, circularType, selectedAction, selectedCIR_MasterID }) => {
    const [formData, setFormData] = useState<CircularFormData>(initialData || defaultData);
    const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
    const [allowedUserOptions, setAllowedUserOptions] = useState<AllowedUserOption[]>([]);
    const [selectedAllowedUsers, setSelectedAllowedUsers] = useState<string[]>(
        toAllowedUserValues(initialData?.allowedUserToAck)
    );
    const [vesselList, setVesselList] = useState<Vessel[]>([]);
    const [selectedVesselIds, setSelectedVesselIds] = useState<number[]>(
        initialData?.vesselIdList || []
    );
    const [requireAcknowledgement, setRequireAcknowledgement] = useState(
        initialData?.requireAcknowledgement ?? false
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileError, setFileError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    // A new circular gets a temporary record when the form opens. If the form closes without saving
    // (Cancel, the X, or leaving the page) that record is removed, so no empty drafts are left behind.
    const tempMasterIdRef = useRef(-1);
    const savedRef = useRef(false);

    const priorityOptions = [
        { label: 'High', value: '1' },
        { label: 'Medium', value: '2' },
        { label: 'Low', value: '3' }
    ];

    useEffect(() => {
        const fetchData = async () => {
                dmsLifecycleService.getApiCall('DMS/GetManualRightsUsersAsync')
                    .then(data => {
                        setVesselList(data.vesselList || []);
                        setAllowedUserOptions(toVesselRankOptions(data.vslRankList));
                    })
                    .catch(() => {
                        setVesselList([]);
                        setAllowedUserOptions([]);
                    });

                dmsLifecycleService.getApiCall(`circular/GetCategories?isToIncludeAll=false&circularType=${circularType}`)
                    .then(data => {
                        const options = data.map((item: any) => ({
                            label: item.category,
                            value: item.ciR_CategoryID,
                        }));
                        setCategoryOptions(options);
                    })
                    .catch(() => setCategoryOptions([]));

                if (selectedAction === 'Edit' && selectedCIR_MasterID > 0) {
                    dmsLifecycleService.getApiCall(`circular/GetCIRDetails/${selectedCIR_MasterID}`)
                        .then((data: any) => {
                            setFormData({
                                ciR_MasterID: data.ciR_MasterID ?? selectedCIR_MasterID ?? -1,
                                ciR_BlobID: data.ciR_BlobID ?? -1,
                                circularType: data.circularType ?? circularType,
                                ciR_CategoryID: data.ciR_CategoryID ?? -1,
                                ciR_Number: data.ciR_Number ?? '',
                                allowedUserToAck: data.allowedUserToAck ?? '',
                                requireAcknowledgement: data.requireAcknowledgement ?? false,
                                reference: getReferenceValue(data),
                                title: data.title ?? '',
                                status: data.status ?? 'Draft',
                                priority: data.priority?.toString() ?? '3',
                                dateIssued: data.dateIssued ? new Date(data.dateIssued) : null,
                                releasedDate: data.releasedDate ? new Date(data.releasedDate) : null,
                                remarks: data.remarks ?? '',
                                createdBy: data.createdBy ?? '',
                                description: data.description ?? '',
                                fileName: data.fileName ?? '',
                                fileType: data.fileType ?? '',
                                originalFileType: data.originalFileType ?? '',
                                blobSize: data.blobSize ?? '0',
                                blobContents: data.blobContents ?? '',
                                calledMode: 'Edit',
                                vesselIdList: toVesselIds(data.vesselIdList ?? data.vesselIDList)
                            });
                            const allowedUsers = data.allowedUserToAckList ?? data.allowedUsersToAck ?? data.allowedUserToAck;
                            setSelectedAllowedUsers(toAllowedUserValues(allowedUsers));
                            setSelectedVesselIds(toVesselIds(data.vesselIdList ?? data.vesselIDList));
                            setRequireAcknowledgement(data.requireAcknowledgement ?? false);
                        })
                        .catch(() => {

                        });
                }
                else if (selectedAction === 'Add') {
                    // For add mode, reset to default or initialData
                    var cir_MasterID = await dmsLifecycleService.postApiCall(`circular/AddCirMaster?circularType=${circularType}`, {});

                    setFormData({
                        ciR_MasterID: cir_MasterID,
                        ciR_BlobID: -1,
                        circularType: circularType,
                        ciR_CategoryID: -1,
                        ciR_Number: '',
                        allowedUserToAck: '',
                        requireAcknowledgement: false,
                        reference: '',
                        title: '',
                        status: 'Draft',
                        priority: "3",
                        dateIssued: null,
                        releasedDate: null,
                        remarks: '',
                        description: '',
                        fileName: '',
                        fileType: '',
                        originalFileType: '',
                        blobSize: '0',
                        blobContents: undefined,
                        calledMode: 'Add',
                        vesselIdList: []
                    });
                    setSelectedVesselIds([]);
                    setSelectedAllowedUsers([]);
                    setRequireAcknowledgement(false);
                }
        };
        fetchData();
    }, [ selectedAction, selectedCIR_MasterID, circularType]);

    
    useEffect(() => {
        tempMasterIdRef.current = selectedAction === 'Add' ? Number(formData.ciR_MasterID) : -1;
    }, [selectedAction, formData.ciR_MasterID]);

    useEffect(() => () => {
        if (!savedRef.current && tempMasterIdRef.current > 0) {
            dmsLifecycleService.deleteApiCall(`circular/RemoveTempCIR?cir_MasterID=${tempMasterIdRef.current}`, {}).catch(() => undefined);
        }
    }, []);

    const handleInputChange = (e: any, name: string) => {
        const val = (e.target && e.target.value !== undefined) ? e.target.value : e.value;
        let _formData = { ...formData };
        // @ts-ignore
        _formData[name] = val;
        setFormData(_formData);
    };

    const handleCategoryChange = (e: any) => {
        const categoryID = e.value;
        setFormData({ ...formData, ciR_CategoryID: categoryID });
        
        // Fetch circular number based on selected category
        if (categoryID && selectedAction !== 'Edit') {
            dmsLifecycleService.getApiCall(`circular/GetNextCIRNumbersByCategory?categoryID=${categoryID}&cir_MasterID=${formData.ciR_MasterID}`)
                .then((data: any) => {
                    console.log('Fetched circular number:', data);
                    setFormData(prev => ({ 
                        ...prev, 
                        ciR_Number: data.cirNumber || '',
                        allowedUserToAck: data.allowedUserToAck || ''
                    }));
                    const allowedUsers = data.allowedUserToAckList ?? data.allowedUsersToAck ?? data.allowedUserToAck;
                    setSelectedAllowedUsers(toAllowedUserValues(allowedUsers));
                })
                .catch(() => {
                    console.error('Failed to fetch circular number');
                });
        }
    };

    /** Reads the chosen file into the form (same fields as before: fileName, blobSize, fileType, blobContents). */
    const acceptFile = (file: File | undefined) => {
        if (!file) return;
        const ext = fileExtension(file.name);
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            setFileError(`"${file.name}" is not a supported file. Use PDF, Word or Excel.`);
            return;
        }
        if (file.size > MAX_FILE_BYTES) {
            setFileError(`"${file.name}" is ${formatFileSize(file.size)}. The limit is 10 MB.`);
            return;
        }
        setFileError('');
        const reader = new FileReader();
        reader.onloadend = () => {
            const byteArray = new Uint8Array(reader.result as ArrayBuffer);
            setFormData(prev => ({
                ...prev,
                fileName: file.name,
                blobSize: file.size.toString(),
                fileType: file.type || ext,
                originalFileType: file.type || ext,
                blobContents: byteArray
            }));
        };
        reader.readAsArrayBuffer(file);
    };

    const removeFile = () => {
        setFileError('');
        setFormData(prev => ({
            ...prev,
            fileName: '',
            blobSize: '0',
            fileType: '',
            originalFileType: '',
            blobContents: undefined
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /** Opens the attached file (new upload or the one saved with the circular) in a new tab. */
    const viewFile = () => {
        if (!formData.blobContents) return;
        const bytes = decodeBlobContents(formData.blobContents);
        if (!bytes) return;
        const url = URL.createObjectURL(new Blob([bytes], { type: formData.fileType && formData.fileType.includes('/') ? formData.fileType : undefined }));
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    /* Required fields */
    const errors = {
        category: !formData.ciR_CategoryID || Number(formData.ciR_CategoryID) <= 0,
        title: !formData.title?.trim(),
        priority: !formData.priority,
        dateIssued: !formData.dateIssued,
    };
    const missing = [
        errors.category && 'Category',
        errors.title && 'Title',
        errors.priority && 'Priority',
        errors.dateIssued && 'Date issued',
    ].filter(Boolean) as string[];
    const showError = (key: keyof typeof errors) => submitted && errors[key];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (missing.length > 0) return;

        // Send values the API can always read: text never null, numbers never empty text.
        const dataToSubmit: any = {
            ...formData,
            ciR_BlobID: Number(formData.ciR_BlobID ?? -1),
            ciR_CategoryID: Number(formData.ciR_CategoryID ?? -1),
            priority: formData.priority || '3',
            blobSize: Number(formData.blobSize || 0),
            reference: formData.reference ?? '',
            title: formData.title ?? '',
            remarks: formData.remarks ?? '',
            createdBy: formData.createdBy ?? '',
            description: formData.description ?? '',
            fileName: formData.fileName ?? '',
            fileType: formData.fileType ?? '',
            originalFileType: formData.originalFileType ?? '',
            status: formData.status || 'Draft',
        };
        dataToSubmit.allowedUserToAck = selectedAllowedUsers.join(', ');
        dataToSubmit.vesselIdList = selectedVesselIds;
        dataToSubmit.requireAcknowledgement = requireAcknowledgement;
        if (dataToSubmit.blobContents && dataToSubmit.blobContents instanceof Uint8Array) {
            let binary = '';
            const bytes = new Uint8Array(dataToSubmit.blobContents);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            dataToSubmit.blobContents = window.btoa(binary);
        }

        savedRef.current = true;
        onSubmit(dataToSubmit);
    };

    // The temporary record is removed when the form closes (see the effect above).
    const handleCancel = () => onCancel();

    const typeLabel = /alert/i.test(circularType) ? 'alert' : 'circular';
    const fileSize = Number(formData.blobSize || 0);

    return (
        <form onSubmit={handleSubmit} className="cir-form p-fluid" noValidate>
            <div className="cir-form-body">
                <div className="cir-col">
                    <section className="cir-card">
                        <h3><i className="pi pi-file-edit" /> Details</h3>
                        <div className="cir-grid">
                            <div className="cir-field">
                                <label htmlFor="category">Category <span className="required">*</span></label>
                                <Dropdown
                                    id="category"
                                    value={formData.ciR_CategoryID}
                                    options={categoryOptions}
                                    onChange={handleCategoryChange}
                                    placeholder="Select a category"
                                    className={showError('category') ? 'p-invalid' : ''}
                                />
                                {showError('category') && <small className="cir-error">Choose a category</small>}
                            </div>
                            <div className="cir-field">
                                <label htmlFor="ciR_Number">{typeLabel === 'alert' ? 'Alert' : 'Circular'} number</label>
                                <InputText
                                    id="ciR_Number"
                                    value={formData.ciR_Number || ''}
                                    onChange={(e) => handleInputChange(e, 'ciR_Number')}
                                    placeholder="Filled in when you pick a category"
                                />
                            </div>
                            <div className="cir-field span-2">
                                <label htmlFor="title">Title <span className="required">*</span></label>
                                <InputText
                                    id="title"
                                    value={formData.title || ''}
                                    onChange={(e) => handleInputChange(e, 'title')}
                                    placeholder={`What is this ${typeLabel} about?`}
                                    className={showError('title') ? 'p-invalid' : ''}
                                />
                                {showError('title') && <small className="cir-error">Enter a title</small>}
                            </div>
                            <div className="cir-field">
                                <label id="priority-label">Priority <span className="required">*</span></label>
                                <SelectButton
                                    className={`cir-priority${showError('priority') ? ' p-invalid' : ''}`}
                                    value={formData.priority}
                                    options={priorityOptions}
                                    onChange={(e) => e.value && setFormData(prev => ({ ...prev, priority: e.value }))}
                                    aria-labelledby="priority-label"
                                    itemTemplate={(o) => <span className={`cir-priority-option p-${o.value}`}>{o.label}</span>}
                                />
                            </div>
                            <div className="cir-field">
                                <label htmlFor="dateIssued">Date issued <span className="required">*</span></label>
                                <Calendar
                                    id="dateIssued"
                                    value={formData.dateIssued ? new Date(formData.dateIssued) : null}
                                    onChange={(e) => handleInputChange(e, 'dateIssued')}
                                    showIcon
                                    dateFormat="dd M yy"
                                    placeholder="Select date"
                                    className={showError('dateIssued') ? 'p-invalid' : ''}
                                />
                                {showError('dateIssued') && <small className="cir-error">Pick the issue date</small>}
                            </div>
                            <div className="cir-field span-2">
                                <label htmlFor="reference">Reference</label>
                                <InputText
                                    id="reference"
                                    value={formData.reference || ''}
                                    onChange={(e) => handleInputChange(e, 'reference')}
                                    placeholder="e.g. HQ/OPS/45"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="cir-card">
                        <h3><i className="pi pi-comment" /> Message</h3>
                        <InputTextarea
                            id="remarks"
                            value={formData.remarks || ''}
                            onChange={(e) => handleInputChange(e, 'remarks')}
                            rows={5}
                            placeholder={`Message shown with the ${typeLabel}, or any remarks`}
                            aria-label="Message / remarks"
                            autoResize
                        />
                    </section>

                    <section className="cir-card">
                        <h3>
                            <i className="pi pi-paperclip" /> Attachment
                            <span className="cir-muted cir-h-note">PDF, Word or Excel · up to 10 MB</span>
                        </h3>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_EXTENSIONS.map(x => '.' + x).join(',')}
                            className="cir-file-input"
                            onChange={(e) => acceptFile(e.target.files?.[0])}
                            tabIndex={-1}
                            aria-hidden="true"
                        />
                        {formData.fileName ? (
                            <div className="cir-file">
                                <i className={`pi ${fileIcon(formData.fileName)} cir-file-icon`} />
                                <div className="cir-file-text">
                                    <span className="cir-file-name">{formData.fileName}</span>
                                    <span className="cir-muted">{[fileExtension(formData.fileName).toUpperCase(), formatFileSize(fileSize)].filter(Boolean).join(' · ')}</span>
                                </div>
                                <div className="cir-file-actions">
                                    {formData.blobContents && (
                                        <Button type="button" icon="pi pi-eye" className="p-button-text p-button-sm" onClick={viewFile} tooltip="Open" tooltipOptions={{ position: 'top' }} aria-label="Open file" />
                                    )}
                                    <Button type="button" icon="pi pi-refresh" className="p-button-text p-button-sm" onClick={() => fileInputRef.current?.click()} tooltip="Replace" tooltipOptions={{ position: 'top' }} aria-label="Replace file" />
                                    <Button type="button" icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={removeFile} tooltip="Remove" tooltipOptions={{ position: 'top' }} aria-label="Remove file" />
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`cir-dropzone${dragOver ? ' drag-over' : ''}${fileError ? ' has-error' : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                            >
                                <i className="pi pi-cloud-upload" />
                                <span><strong>Click to choose a file</strong> or drag it here</span>
                            </div>
                        )}
                        {fileError && <small className="cir-error">{fileError}</small>}
                    </section>
                </div>

                <div className="cir-col">
                    <section className="cir-card">
                        <h3><i className="pi pi-check-square" /> Acknowledgement</h3>
                        <label className="cir-switch" htmlFor="requireAcknowledgement">
                            <InputSwitch
                                inputId="requireAcknowledgement"
                                checked={requireAcknowledgement}
                                onChange={(event) => setRequireAcknowledgement(!!event.value)}
                            />
                            <span>
                                <strong>Require acknowledgement</strong>
                                <span className="cir-muted">Vessels must confirm they have read it</span>
                            </span>
                        </label>
                        <div className="cir-field">
                            <label htmlFor="allowedUserToAck">Ranks who can acknowledge</label>
                            <MultiSelect
                                id="allowedUserToAck"
                                className="allowed-user-rank-select"
                                panelClassName="allowed-user-rank-panel"
                                value={selectedAllowedUsers}
                                options={allowedUserOptions}
                                onChange={(e) => setSelectedAllowedUsers(e.value || [])}
                                placeholder="Select ranks"
                                display="chip"
                                filter
                                filterPlaceholder="Search ranks..."
                                maxSelectedLabels={4}
                                selectedItemsLabel="{0} ranks selected"
                                showSelectAll
                                showClear
                                optionLabel="label"
                                optionValue="value"
                                itemTemplate={(option: AllowedUserOption) => (
                                    <div className="allowed-user-rank-option">
                                        <span className="rank-option-name">{option.label}</span>
                                        {option.department && (
                                            <span className="rank-option-department">{option.department}</span>
                                        )}
                                    </div>
                                )}
                                emptyMessage="No vessel ranks available"
                                emptyFilterMessage="No matching vessel ranks"
                            />
                        </div>
                    </section>

                    <section className="cir-card cir-card-vessels">
                        <h3><i className="pi pi-send" /> Vessels</h3>
                        <VesselPicker vessels={vesselList} selectedIds={selectedVesselIds} onChange={setSelectedVesselIds} />
                    </section>
                </div>
            </div>

            <div className="cir-form-footer">
                <span className={submitted && missing.length ? 'cir-error' : 'cir-muted'}>
                    {submitted && missing.length
                        ? `Fill in: ${missing.join(', ')}`
                        : <>Fields marked <span className="required">*</span> are required</>}
                </span>
                <div className="cir-form-buttons">
                    <Button type="button" label="Cancel" onClick={handleCancel} className="p-button-text" />
                    <Button type="submit" label={`Save ${typeLabel}`} icon="pi pi-check" />
                </div>
            </div>
        </form>
    );
};
export default AddEditCircular;
