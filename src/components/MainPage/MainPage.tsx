import React, { useEffect, useRef, useState } from 'react';
import ManualsTreeView from './ManualsTreeView';
import ManualsContent from './ManualsContent';
import PageHeader from '../PageHeader';
import { Dialog } from 'primereact/dialog';
import UserManualList from '../ViewManuals/UserManualList';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './MainPage.scss';

export interface ManualDetailsProps {
    userId: string;
}

const MainPage: React.FC<ManualDetailsProps> = ({ userId }) => {
    const [toggleTree, setToggleTree] = useState(true);
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
        dmsLifecycleService.apiCall(`DMS/GetUserManualCounts?userId=${userId}`, 'get')
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
            }
        );
    };

    useEffect(() => {   
        setUserActionCounts();

        dmsLifecycleService.apiCall(`Login/dbinfo`, 'get')
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
            .catch(() => {
               
            }
        );
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
        <div className='wrapper'>
            <PageHeader
                title="COMPANY - Document Management System"
                subtitle="Test User Name"
                rightContent={dbInfoAction}
            />
            <div className="row body">
                <div
                    id="treeComponent"
                    className= "col-3 tree"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'aliceblue',
                        borderRight: '5px #0072bc solid',
                    }}
                >
                    <div className="tree-bar" style={{ flex: 1, overflow: 'auto' }}>
                        <ManualsTreeView ref={treeViewRef} userId={userId} />
                    </div>
                    <div
                        className="menu-bar"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <a href="#" className="hyperlink" onClick={(e) => usersManualAction(e, "PendingMyApproval", "Approval Pending")}>
                            Pending My Approval ({approvalCnt})
                        </a>
                        <a href="#" className="hyperlink" onClick={(e) => usersManualAction(e, "PendingMyReview", "Review Pending")}>
                            Pending My Review ({reviewCnt})
                        </a>
                        <a href="#" className="hyperlink" onClick={(e) => usersManualAction(e, "PendingMyAcknowledgement", "Acknowledgement Pending")}>
                            Pending My Acknowledgement ({ackCnt})
                        </a>
                        <a href="#" className="hyperlink" onClick={(e) => usersManualAction(e, "NewDocuments", "New Documents")}>
                            New Documents ({newCnt})
                        </a>
                        <a href="#" className="hyperlink" onClick={(e) => usersManualAction(e, "Favourites", "My Favourites")}>
                            My Favourites ({favouriteCnt})
                        </a>
                    </div>
                </div>
                <div
                    id="sectionContainer"
                    className={toggleTree ? "col-9 section" : "col-11 section"}
                >
                    <div ref={scrollRef} />
                        <ManualsContent userId={userId} onRefreshTree={LoadTreeNodeData}  />
                </div>
            </div>
            {showUserManualDialog && (
                <Dialog header={usersActionHeader + " - Manual List "}
                    visible={showUserManualDialog}
                    style={{ width: '90%', maxWidth: '1800px' }}
                    contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff', height: '80vh', overflowY: 'hidden' }}
                    headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue' }}
                    onHide={() => { if (!showUserManualDialog) return; setShowUserManualDialog(false); }}>
                     <UserManualList userId={userId} callMode={usersAction} />
                </Dialog>
            )}
        </div>
    );
};

export default MainPage;