import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import ManualsTreeView from './ManualsTreeView';
import ManualsContent from './ManualsContent';
import PageHeader from '../../PageHeader';
import UserManualList from '../ViewManuals/UserManualList';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './ManualMainPage.scss';

export interface ManualDetailsProps {
    userId: string;
}

const ManualMainPage: React.FC<ManualDetailsProps> = ({ userId }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showUserManualDialog, setShowUserManualDialog] = useState(false); 
    const [dbInfoAction, setDbInfoAction] = useState('');
    const [usersAction, setUsersAction] = useState('');
    const [usersActionHeader, setUsersActionHeader] = useState('');
    const [approvalCnt, setApprovalCnt] = useState(0); 
    const [reviewCnt, setReviewCnt] = useState(0);
    const [ackCnt, setAckCnt] = useState(0);
    const [newCnt, setNewCnt] = useState(0);
    const [favouriteCnt, setFavouriteCnt] = useState(0);
    const treeViewRef = useRef<any>(null);

    const setUserActionCounts = () => {
        dmsLifecycleService.getApiCall(`DMS/GetUserManualCounts?userId=${userId}`)
            .then((data: any) => {
                if (data) {
                    setApprovalCnt(data.approvalCnt || 0);
                    setReviewCnt(data.reviewCnt || 0);
                    setAckCnt(data.ackCnt || 0);
                    setNewCnt(data.newCnt || 0);
                    setFavouriteCnt(data.favouriteCnt || 0);
                }
            })
            .catch(() => {
                setApprovalCnt(0);
                setReviewCnt(0);
                setAckCnt(0);
                setNewCnt(0);
                setFavouriteCnt(0);
            });
    };

    useEffect(() => {   
        setUserActionCounts();

        dmsLifecycleService.getApiCall(`Login/dbinfo`)
            .then((data: any) => {
                if (data) {
                   let dbShort = data.database ? data.database.substring(0, 7).toLowerCase() : '';
                   let dbInfo = "Prod Env";
                   if (dbShort === "testdms") dbInfo = "Dev Env";
                   else if (dbShort === "testdms") dbInfo = "QA Env";
                   else if (dbShort === "testdms") dbInfo = "Dev Env";
                   else if (dbShort === "testdms") dbInfo = "UAT Env";
                   setDbInfoAction(dbInfo);
                }
            })
            .catch(() => {});
    }, [userId]);

    const usersManualAction = (e: React.MouseEvent<HTMLAnchorElement>, callMode: string, headerText: string) => {
        e.preventDefault(); 
        setUsersAction(callMode);
        setUsersActionHeader(headerText);
        setShowUserManualDialog(true);
    }

    const LoadTreeNodeData = () => {
        setUserActionCounts();

        if (treeViewRef.current && typeof treeViewRef.current.refreshTree === 'function') {
            treeViewRef.current.refreshTree();
        }
    };

    return (
        <div className='main-page-wrapper'>
            <PageHeader
                title="COMPANY - Document Management System"
                subtitle="Test User Name"
                rightContent={dbInfoAction}
            />
            <div className="main-page-content">
                <div className="tree-section">
                    <div className="tree-container">
                        <ManualsTreeView ref={treeViewRef} userId={userId} />
                    </div>
                    <div className="menu-section">
                        <a href="#" className="menu-link" onClick={(e) => usersManualAction(e, "PendingMyApproval", "Approval Pending")}>
                            <i className="pi pi-clock"></i>
                            <span>Pending My Approval ({approvalCnt})</span>
                        </a>
                        <a href="#" className="menu-link" onClick={(e) => usersManualAction(e, "PendingMyReview", "Review Pending")}>
                            <i className="pi pi-eye"></i>
                            <span>Pending My Review ({reviewCnt})</span>
                        </a>
                        <a href="#" className="menu-link" onClick={(e) => usersManualAction(e, "PendingMyAcknowledgement", "Acknowledgement Pending")}>
                            <i className="pi pi-thumbs-up"></i>
                            <span>Pending My Acknowledgement ({ackCnt})</span>
                        </a>
                        <a href="#" className="menu-link" onClick={(e) => usersManualAction(e, "NewDocuments", "New Documents")}>
                            <i className="pi pi-plus-circle"></i>
                            <span>New Documents ({newCnt})</span>
                        </a>
                        <a href="#" className="menu-link" onClick={(e) => usersManualAction(e, "Favourites", "My Favourites")}>
                            <i className="pi pi-star-fill"></i>
                            <span>My Favourites ({favouriteCnt})</span>
                        </a>
                    </div>
                </div>
                <div className={`content-section with-tree`}>
                    <div ref={scrollRef} />
                    <ManualsContent userId={userId} onRefreshTree={LoadTreeNodeData} />
                </div>
            </div>
            {showUserManualDialog && (
                <Dialog 
                    header={usersActionHeader + " - Manual List "}
                    visible={showUserManualDialog}
                    style={{ width: '90%', maxWidth: '1800px' }}
                    contentStyle={{ 
                        padding: '0.5rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        height: '80vh', 
                        overflowY: 'hidden' 
                    }}
                    headerStyle={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        borderBottom: '3px solid var(--primary-color)', 
                        height: '80px',
                        color: 'var(--text-primary)'
                    }}
                    onHide={() => { if (!showUserManualDialog) return; setShowUserManualDialog(false); }}
                >
                     <UserManualList userId={userId} callMode={usersAction} />
                </Dialog>
            )}
        </div>
    );
};

export default ManualMainPage;