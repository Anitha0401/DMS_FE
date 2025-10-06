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
            <div className="approve-manual-metadata" style={{flexDirection: 'column'}}>
                <div style={{ flexDirection: 'row'}}>
                    <label className='selectedText' style={{ fontWeight: 'bold'}}>
                    Version :
                    </label>
                    <label className='selectedText'>{version}</label>
                    <label className='selectedText' style={{ width:'135px', textAlign:'right',  fontWeight: 'bold'}}>
                    Status :&nbsp;
                    </label>
                    <label className='selectedText'>{status}</label>
                </div>
                <div>
                    <label className='selectedText' style={{ fontWeight: 'bold'}}>
                    Manual Name : &nbsp;
                    </label>
                    <label className='selectedText'>{manualName}</label>
                </div>
            </div>
            <div className="approve-manual-section">
                <div className="section-title">Comments</div>
                <textarea
                    className="approve-manual-comment"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add your comment (optional)"
                    rows={3}
                />
            </div>
            <div className="approve-manual-actions">
                <Button label="Approve" icon="pi pi-check" className="p-button-success" onClick={() => onApprove(comment)} />
                <Button label="Send Back" icon="pi pi-times" className="p-button-danger" onClick={() => onReject(comment)} style={{ marginLeft: '1rem' }} />
            </div>
        </div>
    );
};

export default ApproveManual;