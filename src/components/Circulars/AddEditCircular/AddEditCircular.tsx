import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import './AddEditCircular.scss';

interface Circular {
    ciR_CategoryID: number;
    ciR_MasterID: number;
    circularType: string;
    category: string;
    ciR_Number: string;
    reference: string,
    title: string;
    statusString: 'Active' | 'Archived' | 'Draft';
    priority: 'High' | 'Medium' | 'Low';
    dateIssued: string;
    cIRLevel: number;
    releasedDate: string;
    attachmentCount: number;
    isActive?: boolean;
    isFavourite? : boolean;
    isCategory?: boolean;
    remarks?: string;
}

interface AddEditCircularProps {
    visible: boolean;
    onHide: () => void;
    circular: Circular | null;
}

const AddEditCircular: React.FC<AddEditCircularProps> = ({ visible, onHide, circular }) => {
    const [formData, setFormData] = useState<Partial<Circular>>(circular || {});

    const priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];

    const statusOptions = [
        { label: 'Active', value: 'Active' },
        { label: 'Archived', value: 'Archived' },
        { label: 'Draft', value: 'Draft' }
    ];

    const categoryOptions = [
        { label: 'Safety', value: 'Safety' },
        { label: 'Operations', value: 'Operations' },
        { label: 'Compliance', value: 'Compliance' },
        { label: 'Technical', value: 'Technical' }
    ];

    const handleInputChange = (e: any, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _formData = { ...formData };
        // @ts-ignore
        _formData[name] = val;
        setFormData(_formData);
    };

    const onSave = () => {
        // Implement save logic
        console.log('Saving circular:', formData);
        onHide();
    };

    const dialogFooter = (
        <div className="dialog-footer">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-secondary p-button-outlined" />
            <Button label="Save" icon="pi pi-check" onClick={onSave} className="p-button-success" />
        </div>
    );

    return (
        <Dialog
            header={circular ? 'Edit Circular' : 'Add New Circular'}
            visible={visible}
            style={{ width: '50vw' }}
            onHide={onHide}
            footer={dialogFooter}
            className="add-edit-circular-dialog"
        >
            <div className="p-fluid form-grid">
                <div className="field col-12 md:col-6">
                    <label htmlFor="title">Title</label>
                    <InputText id="title" value={formData.title || ''} onChange={(e) => handleInputChange(e, 'title')} />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="ciR_Number">Circular Number</label>
                    <InputText id="ciR_Number" value={formData.ciR_Number || ''} onChange={(e) => handleInputChange(e, 'ciR_Number')} />
                </div>ciR_Number
                <div className="field col-12 md:col-6">
                    <label htmlFor="category">Category</label>
                    <Dropdown id="category" value={formData.category} options={categoryOptions} onChange={(e) => handleInputChange(e, 'category')} placeholder="Select a Category" />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="priority">Priority</label>
                    <Dropdown id="priority" value={formData.priority} options={priorityOptions} onChange={(e) => handleInputChange(e, 'priority')} placeholder="Select a Priority" />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="status">Status</label>
                    <Dropdown id="status" value={formData.statusString} options={statusOptions} onChange={(e) => handleInputChange(e, 'statusString')} placeholder="Select a Status" />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="dateIssued">Date Issued</label>
                    <Calendar id="dateIssued" value={formData.dateIssued ? new Date(formData.dateIssued) : null} onChange={(e) => handleInputChange(e, 'dateIssued')} showIcon />
                </div>
                 <div className="field col-12">
                    <label htmlFor="reference">Reference</label>
                    <InputTextarea id="reference" value={formData.reference || ''} onChange={(e) => handleInputChange(e, 'reference')} rows={3} />
                </div>
                <div className="field col-12">
                    <label htmlFor="remarks">Remarks</label>
                    <InputTextarea id="remarks" value={formData.remarks || ''} onChange={(e) => handleInputChange(e, 'remarks')} rows={3} />
                </div>
            </div>
        </Dialog>
    );
};

export default AddEditCircular;
