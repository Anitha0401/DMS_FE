import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './AddEditOtherDocument.scss';

export interface OtherDocumentTypeOption {
    label: string;
    value: string;
    docTypeId?: number;
}

interface AddEditOtherDocumentProps {
    visible: boolean;
    vesselId: number;
    documentTypes: OtherDocumentTypeOption[];
    onHide: () => void;
    onSaved: () => void;
}

interface NewDocumentForm {
    title: string;
    documentNumber: string;
    documentTypeId: string;
    reference: string;
    comments: string;
    status: string;
    file: File | null;
}

const createDocumentPayload = (data: any) => ({
    otherDocumentMasterID: 0,
    vesselID: data.vesselID ?? data.vslID ?? 0,
    vslID: data.vslID ?? data.vesselID ?? 0,
    otherDocument_TypeID: Number(data.otherDocument_TypeID ?? 0),
    documentNumber: data.documentNumber || `DOC-${Date.now()}`,
    title: data.title,
    documentTitle: data.documentTitle || data.title,
    status: data.status || 'Active',
    reference: data.reference || '',
    comments: data.comments || '',
    uploadedOn: data.uploadedOn || new Date().toISOString(),
    uploadedBy: data.uploadedBy || 'HQ',
    description: data.description || data.comments || data.title,
    fileName: data.fileName || '',
    fileType: data.fileType || 'application/octet-stream',
    originalFileType: data.originalFileType || data.fileType || 'application/octet-stream',
    blobSize: Number(data.blobSize || 0),
    blobContents: data.blobContents || null,
    calledMode: 'New'
});

const emptyForm = (documentTypes: OtherDocumentTypeOption[]): NewDocumentForm => ({
    title: '',
    documentNumber: '',
    documentTypeId: documentTypes.find(type => type.docTypeId)?.docTypeId?.toString() || '',
    reference: '',
    comments: '',
    status: 'Active',
    file: null
});

const AddEditOtherDocument: React.FC<AddEditOtherDocumentProps> = ({
    visible,
    vesselId,
    documentTypes,
    onHide,
    onSaved
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newDocumentForm, setNewDocumentForm] = useState<NewDocumentForm>(() => emptyForm(documentTypes));
    const nextNumberRequestRef = useRef(0);

    useEffect(() => {
        if (visible) {
            setNewDocumentForm(emptyForm(documentTypes));
        }
    }, [visible, documentTypes]);

    const handleDocumentTypeChange = async (documentTypeId: string) => {
        const requestId = ++nextNumberRequestRef.current;
        setNewDocumentForm(previous => ({ ...previous, documentTypeId, documentNumber: '' }));

        if (!documentTypeId) {
            return;
        }

        try {
            const response = await dmsLifecycleService.apiCall(
                `OtherDocument/nextnumber/${documentTypeId}`,
                'get'
            );
            const documentNumber = response?.documentNumber ?? response?.DocumentNumber ?? '';

            if (requestId === nextNumberRequestRef.current) {
                setNewDocumentForm(previous => ({ ...previous, documentNumber }));
            }
        } catch {
            if (requestId === nextNumberRequestRef.current) {
                setNewDocumentForm(previous => ({ ...previous, documentNumber: '' }));
            }
        }
    };

    const resetForm = () => setNewDocumentForm(emptyForm(documentTypes));

    const handleHide = () => {
        if (isSubmitting) return;
        onHide();
    };

    const handleSubmit = async () => {
        if (!newDocumentForm.title.trim() || !newDocumentForm.documentTypeId) {
            return;
        }

        setIsSubmitting(true);

        try {
            let blobContents = null;
            if (newDocumentForm.file) {
                const fileReader = new FileReader();
                blobContents = await new Promise<string>((resolve, reject) => {
                    fileReader.onload = () => resolve(String(fileReader.result || ''));
                    fileReader.onerror = () => reject(new Error('Unable to read file'));
                    fileReader.readAsDataURL(newDocumentForm.file as File);
                });
            }

            const payload = createDocumentPayload({
                vesselID: vesselId ?? 0,
                vslID: vesselId ?? 0,
                otherDocument_TypeID: Number(newDocumentForm.documentTypeId),
                documentNumber: newDocumentForm.documentNumber || `DOC-${Date.now()}`,
                title: newDocumentForm.title,
                documentTitle: newDocumentForm.title,
                status: newDocumentForm.status,
                reference: newDocumentForm.reference,
                comments: newDocumentForm.comments,
                uploadedOn: new Date().toISOString(),
                uploadedBy: 'HQ',
                description: newDocumentForm.comments || newDocumentForm.title,
                fileName: newDocumentForm.file?.name || '',
                fileType: newDocumentForm.file?.type || 'application/octet-stream',
                originalFileType: newDocumentForm.file?.type || 'application/octet-stream',
                blobSize: newDocumentForm.file?.size || 0,
                blobContents
            });

            await dmsLifecycleService.postApiCall('OtherDocument/AddOtherDocument', payload);
            resetForm();
            onHide();
            onSaved();
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedVesselSummary = `Vessel ID: ${vesselId}`;

    return (
        <Dialog
            visible={visible}
            onHide={handleHide}
            header={
                <div className="dialog-header-content">
                    <div>
                        <h3>Add New Vessel Document</h3>
                    </div>
                </div>
            }
            style={{ width: '74vw', maxWidth: '1400px', height: '75vh' }}
            className="add-edit-circular-dialog"
            modal
            draggable={false}
        >
            <div className="dialog-footer">
                <Button 
                    type="button" 
                    label="Cancel" 
                    icon="pi pi-times" 
                    onClick={handleHide} 
                    className="p-button-secondary p-button-outlined" />
                <Button 
                    type="submit" 
                    label="Save" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !newDocumentForm.title.trim() || !newDocumentForm.documentTypeId}
                    icon="pi pi-check" 
                    className="p-button-success" />
            </div>

             <div className="p-fluid form-grid circular-editor-grid">
                <div className="form-section circular-details-section">
                    <div className="section-title">
                        <i className="pi pi-file" />
                        <span>Document Details</span>
                    </div>

                    <div className="form-grid">
                        <div className="field field-wide">
                            <label>Document Title</label>
                            <InputText
                                value={newDocumentForm.title}
                                onChange={(e) => setNewDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter document title"
                            />
                        </div>

                        <div className="field-row two-columns">
                            <div className="field">
                                <label>Document Type</label>
                                <Dropdown
                                    value={newDocumentForm.documentTypeId}
                                    options={documentTypes.filter(type => type.value).map(type => ({
                                        label: type.label,
                                        value: String(type.docTypeId || '')
                                    }))}
                                    onChange={(e) => handleDocumentTypeChange(e.value)}
                                    placeholder="Select type"
                                    optionLabel="label"
                                    optionValue="value"
                                />
                            </div>

                            <div className="field">
                                <label>Document Number</label>
                                <InputText
                                    value={newDocumentForm.documentNumber}
                                    readOnly
                                    placeholder="Generated from document type"
                                />
                            </div>
                        </div>

                        <div className="field-row two-columns">
                            <div className="field">
                                <label>Status</label>
                                <Dropdown
                                    value={newDocumentForm.status}
                                    options={[
                                        { label: 'Active', value: 'Active' },
                                        { label: 'Review', value: 'Review' },
                                        { label: 'Archived', value: 'Archived' }
                                    ]}
                                    onChange={(e) => setNewDocumentForm(prev => ({ ...prev, status: e.value }))}
                                    placeholder="Select status"
                                />
                            </div>

                            <div className="field">
                                <label>Reference</label>
                                <InputText
                                    value={newDocumentForm.reference}
                                    onChange={(e) => setNewDocumentForm(prev => ({ ...prev, reference: e.target.value }))}
                                    placeholder="Optional reference or memo number"
                                />
                            </div>
                        </div>
                    </div>
                </div>

               <div className="form-section attachments-section">
                    <div className="section-title">
                        <i className="pi pi-upload" />
                        <span>Attachment & Notes</span>
                    </div>

                    <div className="upload-box">
                        <div className="upload-label-row">
                            <span className="upload-title">Upload File</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            {newDocumentForm.file ? (
                                <span className="upload-file-name">{newDocumentForm.file.name}</span>
                            ) : (
                                <span className="upload-hint">No file selected</span>
                            )}
                        </div>

                        <FileUpload
                            mode="basic"
                            name="documentUpload"
                            chooseLabel="Choose File"
                            accept="*"
                            disabled={Boolean(newDocumentForm.file) || isSubmitting}
                            customUpload
                            auto
                            onSelect={(e) => {
                                const selected = e.files?.[0] || null;
                                setNewDocumentForm(prev => ({ ...prev, file: selected }));
                            }}
                            className="document-upload"
                        />
                    </div>
                    <br></br>
                    <div className="field">
                        <label>Comments</label>
                        <InputTextarea
                            value={newDocumentForm.comments}
                            onChange={(e) => setNewDocumentForm(prev => ({ ...prev, comments: e.target.value }))}
                            rows={4}
                            placeholder="Add notes or comments for this document"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default AddEditOtherDocument;
