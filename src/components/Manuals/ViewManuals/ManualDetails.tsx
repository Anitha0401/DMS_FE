import React, { useEffect, useState } from 'react';
import JoditEditor from 'jodit-react';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './ManualDetails.scss';
import { useTheme } from '../../../contexts/ThemeContext';

export interface ManualDetailsProps {
    dmManualVersionID: number;
    closeForm: () => void;
}

export type ManualDetails = {
    categoryName: string;
    manualCode: string;
    manualNo: string;
    manualName: string;
    version: string;
    statusString: string;
    textContents: string;
    isApprovalRequired: boolean;
    canExport: boolean;
    createdBy: string;
    createdDate: string;
    releasedBy: string;
    releasedDate: string;
    publishedBy: string;
    publishedDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    comments: string;
    dM_ManualID: string;
    dM_ManualVersionID: string;
};

const ManualDetails: React.FC<ManualDetailsProps> = ({ dmManualVersionID, closeForm }) => {
   const [manualData, setManualData] = useState<ManualDetails>();
   const [loading, setLoading] = useState(true);
   const { theme } = useTheme(); 
    
    useEffect(() => {
        dmsLifecycleService.getApiCall(`DMS/GetManualDetailsByVersionId/${dmManualVersionID}`)
                .then((data: any) => {
                    setManualData(data);
                    setLoading(false);
                })
                .catch(() => {
                    setManualData(undefined);
                    setLoading(false);
                });
    }, []);

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        // Assumes dateStr is ISO format or contains date and time
        return dateStr.split('T')[0]; // Returns only the date part
    };

    if (loading) return <div>Loading manual detailss.....</div>

    return (
         <div className="manual-details-container">
            <div className="manual-details-header">
                <h3>{manualData?.manualName || 'Manual Details'}</h3>
            </div>
            <div className="manual-details-grid">
                <div className="manual-details-item">
                    <span className="label">Category</span>
                    <span className="value">{manualData?.categoryName}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Manual Code</span>
                    <span className="value">{manualData?.manualCode}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Manual No</span>
                    <span className="value">{manualData?.manualNo}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Status</span>
                    <span className="value">{manualData?.statusString}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Version</span>
                    <span className="value">{manualData?.version}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Can Export</span>
                    <span className="value">{manualData?.canExport ? 'Yes' : 'No'}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Approval Required</span>
                    <span className="value">{manualData?.isApprovalRequired ? 'Yes' : 'No'}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Created By</span>
                    <span className="value">{manualData?.createdBy}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Created Date</span>
                    <span className="value">{formatDate(manualData?.createdDate)}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Published By</span>
                    <span className="value">{manualData?.publishedBy}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Published Date</span>
                    <span className="value">{formatDate(manualData?.publishedDate)}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Released By</span>
                    <span className="value">{manualData?.releasedBy}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Released Date</span>
                    <span className="value">{formatDate(manualData?.releasedDate)}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Last Modified By</span>
                    <span className="value">{manualData?.lastModifiedBy}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Last Modified Date</span>
                    <span className="value">{formatDate(manualData?.lastModifiedDate)}</span>
                </div>
            </div>
            <div className="manual-details-section">
                <span className="label">Comment</span>
                <div className="manual-details-comments">{manualData?.comments}</div>
            </div>
            <div className="manual-details-section">
                <span className="label">Context</span>
                <div className="manual-details-contents" style={{ height: 'calc(100% - 500px)', margin:'0px', padding: '2px', overflowY: 'hidden'}}>
                      <JoditEditor
                        value={manualData?.textContents ?? ""}
                        config={{
                            readonly: true,
                            toolbar: false,
                            height: '550px',
                            showXPathInStatusbar: false,
                            showCharsCounter: false,
                            showWordsCounter: false,
                            theme: theme === 'dark' ? 'dark' : 'default',
                            style: {
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontFamily: '"Segoe UI", Arial, sans-serif',
                                fontSize: '14px',
                                lineHeight: '1.6'
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ManualDetails;