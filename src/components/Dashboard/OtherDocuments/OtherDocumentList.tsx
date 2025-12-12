import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './OtherDocumentList.scss';

interface OtherDocument {
    documentID: number;
    title: string;
    documentType: string;
    uploadDate: string;
}

interface OtherDocumentListProps {
    vesselId: number | null;
}

const OtherDocumentList: React.FC<OtherDocumentListProps> = ({ vesselId }) => {
    const [documents, setDocuments] = useState<OtherDocument[]>([]);
    const [loading, setLoading] = useState(false);

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
                { documentID: 1, title: 'Safety Manual', documentType: 'Manual', uploadDate: '2023-01-15' },
                { documentID: 2, title: 'Engine Room Log', documentType: 'Log', uploadDate: '2023-02-20' },
                { documentID: 3, title: 'Cargo Plan', documentType: 'Plan', uploadDate: '2023-03-10' },
            ];
            setDocuments(dummyData);
       
        setLoading(false);
    }, [vesselId]);

    const handleViewDocument = (documentId: number) => {
        console.log('Viewing document:', documentId);
        // Here you would typically open a new tab or a modal to view the document
        // For example: window.open(`/documents/${documentId}`, '_blank');
    };

    const actionBodyTemplate = (rowData: OtherDocument) => {
        return (
            <Button 
                icon="pi pi-eye" 
                className="p-button-rounded p-button-text" 
                label="View"
                onClick={() => handleViewDocument(rowData.documentID)} 
            />
        );
    };

    if (loading) {
        return <Skeleton width="100%" height="500px" />;
    }

    return (
        <div className="document-list-container">
            <div className="document-list-header">
                <h2><i className="pi pi-file-o"></i> Documents</h2>
            </div>
            <DataTable value={documents} emptyMessage="No documents found for the selected vessel.">
                <Column field="title" header="Title" />
                <Column field="documentType" header="Type" />
                <Column field="uploadDate" header="Upload Date" />
                <Column body={actionBodyTemplate} header="View" />
            </DataTable>
        </div>
    );
};

export default OtherDocumentList;
