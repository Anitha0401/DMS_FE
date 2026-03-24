import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './OtherDocumentList.scss';

interface OtherDocument {
    documentID: number;
    title: string;
    documentType: string;
    uploadBy: string;
    uploadDate: string;
}

interface OtherDocumentListProps {
    vesselId: number | null;
}

const OtherDocumentList: React.FC<OtherDocumentListProps> = ({ vesselId }) => {
    const [documents, setDocuments] = useState<OtherDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');

    const documentTypes = [
        { label: 'All Types', value: '' },
        { label: 'Manual', value: 'Manual' },
        { label: 'Log', value: 'Log' },
        { label: 'Plan', value: 'Plan' }
    ];

    // useEffect(() => {
    //     if (vesselId) {
    //         setLoading(true);
    //         dmsLifecycleService.getApiCall(`OtherDocument/GetDocumentsByVessel/${vesselId}`)
    //             .then((data: OtherDocument[]) => {
    //                 setDocuments(data);
    //                 setLoading(false);
    //             })
    //             .catch(() => {
    //                 setDocuments([]);
    //                 setLoading(false);
    //             });
    //     } else {
    //         setDocuments([]);
    //     }
    // }, [vesselId]);

     useEffect(() => {
        setLoading(true);
      
            const dummyData: OtherDocument[] = [
                { documentID: 1, title: 'Safety Manual', documentType: 'Manual', uploadBy: 'John Doe (C/E)', uploadDate: '2023-01-15' },
                { documentID: 2, title: 'Engine Room Log', documentType: 'Log', uploadBy: 'Jane Smith (MAS)', uploadDate: '2023-02-20' },
                { documentID: 3, title: 'Cargo Plan', documentType: 'Plan', uploadBy: 'Alice Johnson (2/E)', uploadDate: '2023-03-10' },
            ];
            setDocuments(dummyData);
       
        setLoading(false);
    }, [vesselId]);

    const handleViewDocument = (documentId: number) => {
        console.log('Viewing document:', documentId);
    };

    const handleNewDocument = () => {
        console.log('New document button clicked');
    };

    const dateTemplate = (rowData: OtherDocument) => {
        return new Date(rowData.uploadDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const actionBodyTemplate = (rowData: OtherDocument) => {
        return (
            <div className="action-buttons">
                <Button 
                    icon="pi pi-eye" 
                    className="p-button-rounded p-button-text p-button-info" 
                    tooltip="View Document"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => handleViewDocument(rowData.documentID)}
                    style={{ width: '3rem', height: '3rem', fontSize: '1.5rem' }}
                />
                <Button 
                    icon="pi pi-download" 
                    className="p-button-rounded p-button-text p-button-success" 
                    tooltip="Download"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => console.log('Download:', rowData.documentID)}
                    style={{ width: '3rem', height: '3rem', fontSize: '1.5rem' }}
                />
                <Button 
                    icon="pi pi-trash" 
                    className="p-button-rounded p-button-text p-button-danger" 
                    tooltip="Delete"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => console.log('Delete:', rowData.documentID)}
                    style={{ width: '3rem', height: '3rem', fontSize: '2.5rem' }}
                />
            </div>
        );
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesType = selectedType === '' || selectedType === null || selectedType === undefined || doc.documentType === selectedType;
        const matchesSearch = !globalFilterValue || 
            doc.title.toLowerCase().includes(globalFilterValue.toLowerCase()) ||
            doc.documentType.toLowerCase().includes(globalFilterValue.toLowerCase()) ||
            doc.uploadBy.toLowerCase().includes(globalFilterValue.toLowerCase());
        return matchesType && matchesSearch;
    });

    if (loading) {
        return <Skeleton width="100%" height="500px" />;
    }

    return (
        <div className="document-list-container">
            <div className="document-list-header">
                <div className="header-title">
                    <h2><i className="pi pi-file-o"></i> Other Documents</h2>
                    <span className="document-count">{filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}</span>
                </div>
                <Button 
                    label="New Document" 
                    icon="pi pi-plus" 
                    className="p-button-success" 
                    onClick={handleNewDocument}
                />
            </div>

            <div className="document-controls">
                <div className="search-box">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            value={globalFilterValue}
                            onChange={(e) => setGlobalFilterValue(e.target.value)}
                            placeholder={`Search Document...`}
                            className="search-input"
                        />
                    </span>
                </div>
                
                <Dropdown
                    value={selectedType}
                    options={documentTypes}
                    onChange={(e) => setSelectedType(e.value)}
                    placeholder="Filter by Type"
                    className="type-filter"
                />
            </div>

            <div className="table-wrapper">
                <DataTable 
                    value={filteredDocuments} 
                    emptyMessage="No documents found."
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    className="documents-table"
                    stripedRows
                    scrollable
                    scrollHeight="flex"
                >
                    <Column field="title" header="Document Title" sortable style={{ minWidth: '250px' }} />
                    <Column field="documentType" header="Type" sortable style={{ width: '120px' }} />
                    <Column field="uploadDate" header="Upload Date" body={dateTemplate} sortable style={{ width: '150px' }} />
                    <Column field="uploadBy" header="Uploaded By" sortable style={{ width: '180px' }} />
                    <Column body={actionBodyTemplate} header="Actions" style={{ width: '140px' }} />
                </DataTable>
            </div>
        </div>
    );
};

export default OtherDocumentList;
