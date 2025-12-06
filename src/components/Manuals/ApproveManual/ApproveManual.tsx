import React, { useState } from 'react';
import { Button } from 'primereact/button';
import './ApproveManual.scss';

export interface ApproveManualProps {
    manualName: string;
    version: string;
    status: string;
    comments?: string;
    onApprove: (comment: string) => void;
    onReject: (comment: string) => void;
    onClose: () => void;
}

const ApproveManual: React.FC<ApproveManualProps> = ({
    manualName,
    version,
    status,
    comments,
    onApprove,
    onReject,
    onClose
}) => {
    const [comment, setComment] = useState('');

    return (
        <div className="approve-manual-container">
            <div className="approve-manual-header">
                <h2>Approve Manual</h2>
                <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={onClose} />
            </div>
            <div className="approve-manual-body">
                <div className="approve-manual-metadata">
                    <div className="meta-item">
                        <span className="meta-label">Version:</span>
                        <span className="meta-value">{version}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-label">Status:</span>
                        <span className="meta-value">{status}</span>
                    </div>
                    <div className="meta-item full-width">
                        <span className="meta-label">Manual Name:</span>
                        <span className="meta-value">{manualName}</span>
                    </div>
                </div>
                <div className="approve-manual-section">
                    <label htmlFor="comment-textarea" className="section-title">Comments</label>
                    <textarea
                        id="comment-textarea"
                        className="approve-manual-comment"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add your comment (optional)"
                        rows={4}
                    />
                </div>
            </div>
            <div className="approve-manual-actions">
                <Button label="Approve" icon="pi pi-check" className="p-button-success" onClick={() => onApprove(comment)} />
                <Button label="Send Back" icon="pi pi-times" className="p-button-danger" onClick={() => onReject(comment)} />
            </div>
        </div>
    );
};

export default ApproveManual;