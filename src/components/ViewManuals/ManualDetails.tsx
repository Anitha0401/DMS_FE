import React, { useEffect, useState } from 'react';
import './ManualDetails.scss';
import dmsLifecycleService from '../../services/DMSLifecycleService';

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
    
    useEffect(() => {
        dmsLifecycleService.apiCall(`DMS/GetManualDetailsByVersionId/${dmManualVersionID}`, 'get')
                .then((data: any) => {
                    console.log(data);
                    setManualData(data);
                })
                .catch(() => {
                    setManualData(undefined);
                });
    }, []);

    return (
         <div className="manual-details-container">
            <div className="manual-details-header">
                <h3>{manualData?.manualName || 'Manual Details'}</h3>
                {/* Optionally add a close button here */}
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
                    <span className="value">{manualData?.createdDate}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Published By</span>
                    <span className="value">{manualData?.publishedBy}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Published Date</span>
                    <span className="value">{manualData?.publishedDate}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Released By</span>
                    <span className="value">{manualData?.releasedBy}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Released Date</span>
                    <span className="value">{manualData?.releasedDate}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Last Modified By</span>
                    <span className="value">{manualData?.lastModifiedBy}</span>
                </div>
                <div className="manual-details-item">
                    <span className="label">Last Modified Date</span>
                    <span className="value">{manualData?.lastModifiedDate}</span>
                </div>
            </div>
            <div className="manual-details-section">
                <span className="label">Comments</span>
                <div className="manual-details-comments">{manualData?.comments}</div>
            </div>
            <div className="manual-details-section">
                <span className="label">Contents</span>
                <div className="manual-details-contents">
                     <p style={{whiteSpace:'pre-wrap'}} dangerouslySetInnerHTML={{ __html: manualData?.textContents ?? "" }}>
                      </p>
                </div>
            </div>
        </div>
    );
};

export default ManualDetails;