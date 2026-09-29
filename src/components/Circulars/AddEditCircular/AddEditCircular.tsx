import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { Checkbox } from 'primereact/checkbox';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import VesselList from '../../VesselDetails/VesselList';
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

const AddEditCircular: React.FC<AddEditCircularProps> = ({ initialData, onSubmit, onCancel, circularType, selectedAction, selectedCIR_MasterID }) => {
    const [formData, setFormData] = useState<CircularFormData>(initialData || defaultData);
    const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
    const [allowedUserOptions, setAllowedUserOptions] = useState<AllowedUserOption[]>([]);
    const [selectedAllowedUsers, setSelectedAllowedUsers] = useState<string[]>(
        toAllowedUserValues(initialData?.allowedUserToAck)
    );
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [vesselList, setVesselList] = useState<Vessel[]>([]);
    const [selectedVesselIds, setSelectedVesselIds] = useState<number[]>(
        initialData?.vesselIdList || []
    );
    const [requireAcknowledgement, setRequireAcknowledgement] = useState(
        initialData?.requireAcknowledgement ?? false
    );
    const fileUploadRef = useRef<FileUpload>(null);

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
        if (selectedAction === 'Edit' && formData.blobContents && formData.fileName) {
            const byteArray = decodeBlobContents(formData.blobContents);
            if (!byteArray) {
                setUploadedFiles([]);
                return;
            }

            const blob = new Blob([byteArray], { type: formData.fileType });
            const file = new File([blob], formData.fileName, { type: formData.fileType });

            setUploadedFiles([file]);
        }
    }, [formData.blobContents, formData.fileName, selectedAction, formData.fileType]);
    
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

        onSubmit(dataToSubmit);
    };

    const handleCancel = async () => {
        if(selectedAction === 'Add' && formData.ciR_MasterID > 0){
            await dmsLifecycleService.deleteApiCall(`circular/RemoveTempCIR?cir_MasterID=${formData.ciR_MasterID}`, {});
        }
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="add-edit-manual-form">
            <div className="dialog-footer">
                <label className="acknowledgement-toggle" htmlFor="requireAcknowledgement">
                    <Checkbox
                        inputId="requireAcknowledgement"
                        checked={requireAcknowledgement}
                        onChange={(event) => setRequireAcknowledgement(event.checked ?? false)}
                    />
                    <span>Require Acknowledgement</span>
                </label>
                <Button type="button" label="Cancel" icon="pi pi-times" onClick={handleCancel} className="p-button-secondary p-button-outlined" />
                <Button type="submit" label="Save" icon="pi pi-check" className="p-button-success" />
            </div>
            <div className="p-fluid form-grid circular-editor-grid">
                
                <div className="form-section circular-details-section">
                    <div className="field-row three-columns">
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
                                Circular Number 
                            </label>
                            <InputText 
                                id="ciR_Number" 
                                value={formData.ciR_Number || ''} 
                                onChange={(e) => handleInputChange(e, 'ciR_Number')}
                                placeholder="Enter circular number"
                            />
                        </div>
                            <div className="field">
                            <label htmlFor="allowedUserToAck">
                                Allowed User To Ack
                            </label>
                            <MultiSelect
                                id="allowedUserToAck"
                                className="allowed-user-rank-select"
                                panelClassName="allowed-user-rank-panel"
                                value={selectedAllowedUsers}
                                options={allowedUserOptions}
                                onChange={(e) => setSelectedAllowedUsers(e.value || [])}
                                placeholder="Select users to acknowledge"
                                display="chip"
                                filter
                                filterPlaceholder="Search ranks..."
                                maxSelectedLabels={3}
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

                    <div className="field message-field">
                        <label htmlFor="remarks">Message / Remarks</label>
                        <InputTextarea 
                            id="remarks" 
                            value={formData.remarks || ''} 
                            onChange={(e) => handleInputChange(e, 'remarks')} 
                            rows={6}
                            placeholder="Enter circular message or additional remarks"
                            autoResize
                        />
                    </div>
                </div>

                <div className="form-section attachments-section">
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
                                const { chooseButton } = options;
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

                <div className="form-section vessel-selection-section">
                    <div className="section-heading">
                        <h2>Acknowledgement recipients</h2>
                        <span>{selectedVesselIds.length} selected</span>
                    </div>
                    <VesselList
                        vessels={vesselList}
                        selectedVesselIdList={selectedVesselIds}
                        onSelectionChange={(selected) => setSelectedVesselIds(
                            (selected as any[]).map((vessel) =>
                                typeof vessel === 'number' ? vessel : vessel.vesselID
                            )
                        )}
                    />
                </div>
                
            </div>
        </form>
    );
};
export default AddEditCircular;
