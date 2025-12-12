import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './AddEditCircular.scss';

interface AddEditCircularProps {
    isVisible: boolean;
    initialData?: CircularFormData;
    onSubmit: (data: CircularFormData) => void;
    closeForm: () => void;
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
}

const defaultData: CircularFormData = {
    ciR_MasterID: -1,
    ciR_BlobID: -1,
    circularType: 'circulars',
    ciR_CategoryID: -1,
    ciR_Number: '',
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
    calledMode: 'New'
}

const AddEditCircular: React.FC<AddEditCircularProps> = ({ isVisible, initialData, onSubmit, closeForm, circularType, selectedAction, selectedCIR_MasterID }) => {
    const [formData, setFormData] = useState<CircularFormData>(initialData || defaultData);
    const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const fileUploadRef = useRef<FileUpload>(null);

    const priorityOptions = [
        { label: 'High', value: '1' },
        { label: 'Medium', value: '2' },
        { label: 'Low', value: '3' }
    ];

    useEffect(() => {
        dmsLifecycleService.getApiCall(`circular/GetCategories?isToIncludeAll=false&circularType=${circularType}`)
            .then(data => {
                const options = data.map((item: any ) => ({
                    label: item.category ,
                    value: item.ciR_CategoryID ,
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
                        reference: data.reference ?? '',
                        title: data.title ?? '',
                        status: data.status ?? 'Draft',
                        priority: data.priority ?? '3',
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
                        calledMode: 'Edit'
                    });
                })
                .catch(() => {
                   
                });
        }
        else {
            // For add mode, reset to default or initialData
            setFormData({
                ciR_MasterID: -1,
                ciR_BlobID: -1,
                circularType: circularType,
                ciR_CategoryID: -1,
                ciR_Number: '',
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
                calledMode: 'Add'
            });
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
            dmsLifecycleService.getApiCall(`circular/GetNextCIRNumbersByCategory?categoryID=${categoryID}`)
                .then((data: any) => {
                    setFormData(prev => ({ ...prev, ciR_Number: data.circularNumber || data }));
                })
                .catch(() => {
                    console.error('Failed to fetch circular number');
                });
        }
    };

    const onFileSelect = (e: any) => {
        const files = e.files || [];
        setUploadedFiles(files);
        
        // Update formData with file information
        if (files.length > 0) {
            const file = files[0]; // Using first file for now
            
            // Read file as ArrayBuffer for byte array
            const reader = new FileReader();
            reader.onloadend = () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                const byteArray = new Uint8Array(arrayBuffer);
                
                setFormData(prev => ({
                    ...prev,
                    fileName: file.name,
                    blobSize: file.size.toString(),
                    fileType: file.type || file.name.split('.').pop(),
                    originalFileType: file.type || file.name.split('.').pop(),
                    blobContents: byteArray
                }));
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const onFileRemove = (e: any) => {
        const files = e.files || [];
        setUploadedFiles(files);
        
        // Update formData when files are removed
        if (files.length === 0) {
            setFormData(prev => ({
                ...prev,
                fileName: '',
                blobSize: '0',
                fileType: '',
                originalFileType: '',
                blobContents: undefined
            }));
        } else {
            const file = files[0];
            
            // Read file as ArrayBuffer for byte array
            const reader = new FileReader();
            reader.onloadend = () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                const byteArray = new Uint8Array(arrayBuffer);
                
                setFormData(prev => ({
                    ...prev,
                    fileName: file.name,
                    blobSize: file.size.toString(),
                    fileType: file.type || file.name.split('.').pop(),
                    originalFileType: file.type || file.name.split('.').pop(),
                    blobContents: byteArray
                }));
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const onFileClear = () => {
        setUploadedFiles([]);
        setFormData(prev => ({
            ...prev,
            fileName: '',
            blobSize: '0',
            fileType: '',
            originalFileType: '',
            blobContents: undefined
        }));
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataToSubmit = { ...formData };
        if (dataToSubmit.blobContents && dataToSubmit.blobContents instanceof Uint8Array) {
            let binary = '';
            const bytes = new Uint8Array(dataToSubmit.blobContents);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            dataToSubmit.blobContents = window.btoa(binary);
        }

        onSubmit(dataToSubmit);
    };

    return (
        <Dialog
           visible={isVisible}
           header={
               <div className="dialog-header-content">
                   <i className={circularType === 'circulars' ? 'pi pi-inbox' : 'pi pi-bell'}></i>
                   <span>{selectedAction === 'Edit' ? 'Edit' : 'Add New'} {circularType === 'circulars' ? 'Circular' : 'Alert'}</span>
               </div>
           }
           style={{ width: '60vw' }}
           onHide={closeForm}
           className="add-edit-circular-dialog"
           modal
           draggable={false}
        >
            <form onSubmit={handleSubmit} className="add-edit-manual-form">
                   <div className="dialog-footer">
                        <Button type="button" label="Cancel" icon="pi pi-times" onClick={closeForm} className="p-button-secondary p-button-outlined" />
                        <Button type="submit" label="Save" icon="pi pi-check" className="p-button-success" />
                    </div>
                <div className="p-fluid form-grid">
                 
                    <div className="form-section">
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="category">
                                    Category <span className="required">*</span>
                                </label>
                                <Dropdown 
                                    id="category" 
                                    value={formData.ciR_CategoryID} 
                                    options={categoryOptions} 
                                    onChange={handleCategoryChange} 
                                    placeholder="Select a Category"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="ciR_Number">
                                    Circular Number <span className="required">*</span>
                                </label>
                                <InputText 
                                    id="ciR_Number" 
                                    value={formData.ciR_Number || ''} 
                                    onChange={(e) => handleInputChange(e, 'ciR_Number')}
                                    placeholder="Enter circular number"
                                />
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="title">
                                Title <span className="required">*</span>
                            </label>
                            <InputText 
                                id="title" 
                                value={formData.title || ''} 
                                onChange={(e) => handleInputChange(e, 'title')}
                                placeholder="Enter circular title"
                            />
                        </div>
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="priority">
                                    Priority <span className="required">*</span>
                                </label>
                                <Dropdown 
                                    id="priority" 
                                    value={formData.priority} 
                                    options={priorityOptions} 
                                    onChange={(e) => handleInputChange(e, 'priority')} 
                                    placeholder="Select Priority"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="dateIssued">
                                    Date Issued <span className="required">*</span>
                                </label>
                                <Calendar 
                                    id="dateIssued" 
                                    value={formData.dateIssued ? new Date(formData.dateIssued) : null} 
                                    onChange={(e) => handleInputChange(e, 'dateIssued')} 
                                    showIcon
                                    dateFormat="dd-mm-yy"
                                    placeholder="Select date"
                                    timeOnly={false}
                                    showTime={false}
                                />
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="reference">Reference</label>
                            <InputText 
                                id="reference" 
                                value={formData.reference || ''} 
                                onChange={(e) => handleInputChange(e, 'reference')}
                                placeholder="Enter reference"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="field">
                            <label htmlFor="attachments">
                                Upload Files
                                <span className="file-info"> (PDF, DOC, DOCX, XLS, XLSX - Max 10MB per file)</span>
                            </label>
                            <FileUpload
                                ref={fileUploadRef}
                                name="attachments"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                maxFileSize={10000000}
                                onSelect={onFileSelect}
                                onRemove={onFileRemove}
                                onClear={onFileClear}
                                emptyTemplate={
                                    <div className="file-upload-empty">
                                        <i className="pi pi-cloud-upload"></i>
                                        <p>Drag and drop files here or click to browse</p>
                                    </div>
                                }
                                headerTemplate={(options) => {
                                    const { chooseButton, uploadButton, cancelButton } = options;
                                    return (
                                        <div className="file-upload-header" style={{gap: '2.5rem'}}>
                                            {chooseButton}
                                            {uploadedFiles && uploadedFiles.length > 0 && (
                                                <span className="file-count">
                                                    {uploadedFiles.length} file(s) selected
                                                </span>
                                            )}
                                        </div>
                                    );
                                }}
                                itemTemplate={(file: any, props: any) => (
                                    <div className="file-upload-item">
                                        <div className="file-info-wrapper">
                                            <i className="pi pi-file"></i>
                                            <div className="file-details">
                                                <span className="file-name">{file?.name || 'Unknown'}</span>
                                                <span className="file-size">{file?.size ? (file.size / 1024).toFixed(2) : '0'} KB</span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            icon="pi pi-times"
                                            className="p-button-rounded p-button-danger p-button-text"
                                            onClick={() => {
                                                if (props?.onRemove) {
                                                    props.onRemove(new Event('remove'));
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                chooseLabel="Select Files"
                                chooseOptions={{
                                    icon: 'pi pi-folder-open',
                                    className: 'p-button-outlined'
                                }}
                            />
                        </div>
                    </div>
                    
                    <div className="form-section">
                        <div className="field">
                            <label htmlFor="remarks">Remarks</label>
                            <InputTextarea 
                                id="remarks" 
                                value={formData.remarks || ''} 
                                onChange={(e) => handleInputChange(e, 'remarks')} 
                                rows={3}
                                placeholder="Enter additional remarks"
                                autoResize
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Dialog>
    );
};
export default AddEditCircular;
