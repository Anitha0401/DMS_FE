import React, {useState, useEffect, useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { ContextMenu } from 'primereact/contextmenu';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './ManualsContent.scss';
import { setError } from '../../store/slices/appSlice';
import { Dialog } from 'primereact/dialog';
import CompareVersion from '../CompareVersion/CompareVersion';
import CompareVersionDetails from '../CompareVersion/CompareVersionDetails';
import ManualDetails from '../ViewManuals/ManualDetails';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import ApproveManual from './ApproveManual';
import AddEditManual from '../AddEditManual/AddEditManual';
import { downloadAsWord } from '../utils/DownloadManuals';
import { downloadAsPDF } from '../utils/DownloadManuals';
import JoditEditor from 'jodit-react';
import { defaultMargins } from 'html-docx-js-typescript/dist/templates';

export interface ManualDetailsProps {
    userId: string;
    onRefreshTree?: () => void;
}

const ManualsContent: React.FC<ManualDetailsProps> = ({userId, onRefreshTree})  => {
    const dispatch = useDispatch();
    const manualInfo = useSelector((state: RootState) => state.appInfo);
    const [manualID, setManualID] = useState<number>(-1);
    const [isFavourite, setIsFavourite] = useState<boolean>(false);
    const [manualText, setManualText] = useState("");
    const [isChecked, setIsChecked] = useState(true);
    const [isManualReleased, setIsManualReleased] = useState(false);
    const [visibleAddEditDialog, setVisibleAddEditDialog] = useState<boolean>(false);
    const [visibleCompareVersionDialog, setVisibleCompareVersionDialog] = useState<boolean>(false);
    const [visibleCompareVersionDetailsDialog, setVisibleCompareVersionDetailsDialog] = useState<boolean>(false);
    const [visibleManualDetailsDialog, setVisibleManualDetailsDialog] = useState<boolean>(false);
    const [visibleApproveManualDialog, setVisibleApproveManualDialog] = useState<boolean>(false);
    const [DM_ManualVersionID_ToCompare, setDM_ManualVersionID_ToCompare] = useState<number>(-1);
    const [headerText, setHeaderText] = useState<string>('Manual Details');
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const menu = useRef<any>(null);
    const toast = useRef<any>(null);
   
    useEffect(() => {
        if(manualInfo.selectedManualNodeObj)
        {
            setManualID(manualInfo.selectedManualNodeObj.key ? Number(manualInfo.selectedManualNodeObj.key) : -1);
            setHeaderText(manualInfo.selectedManualNodeObj ? manualInfo.selectedManualNodeObj.label : '');
            setIsFavourite(manualInfo.selectedManualNodeObj.data.isFavourite ? manualInfo.selectedManualNodeObj.data.isFavourite == 1 ? true : false : false);

            if(manualInfo.selectedManualNodeObj?.data?.dM_StatusID === 150) {
                setIsManualReleased(manualInfo.selectedManualNodeObj.data.isActive);
            }
        }        
    }, [manualInfo.selectedManualNodeObj]);
    
    useEffect(() => {
        if (manualInfo.selectedManualNodeObj) {
            fetchData();
        }
    }, [isChecked, manualInfo.selectedManualNodeObj]);

    const fetchData = async() => {
          dmsLifecycleService.apiCall(`DMS/GetManualContent?dm_ManualID=${manualInfo.selectedManualNodeObj.key}&IncludeSubManuals=${isChecked}`, 'get')
                .then((manualResponse) => {
                    setManualText(manualResponse);
                })
                .catch((err) => {
                    setManualText(err.message || 'Error fetching data');
                });
        };
       
    const downloadAsWordHandler = () => {
        downloadAsWord(manualText, manualInfo.selectedManualNodeObj?.data?.dM_ManualVersionID);
    };
    
    const downloadAsPDFHandler = () => {
        downloadAsPDF(manualText, manualInfo.selectedManualNodeObj?.data?.dM_ManualVersionID);
    };
 
    const contextMenuItems = [
        { label: 'PDF', icon: 'pi pi-file-pdf', command: downloadAsPDFHandler },
        { label: 'Word', icon: 'pi pi-file-word', command: downloadAsWordHandler }
    ];

    const updateManuals = async (data: any) => {
        try {
            await dmsLifecycleService.apiCall('DMS/EditManual', 'post', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

           setVisibleAddEditDialog(false);
           fetchData();
           if (onRefreshTree) onRefreshTree(); 
        } catch (err: any) {
            dispatch(setError(err.message || 'Error adding manual'));
        }
    }

    const ApproveManuals = async (data: any) => {
        try {
            await dmsLifecycleService.apiCall('DMS/ApproveManual', 'post', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

           setVisibleApproveManualDialog(false);
           fetchData();
           if (onRefreshTree) onRefreshTree(); 
           //if (typeof onRefreshTree === 'function') onRefreshTree(); 
        } catch (err: any) {
            dispatch(setError(err.message || 'Error approving manual'));
        }
    }

    const SendBackManuals = async (data: any) => {
        try {
            await dmsLifecycleService.apiCall('DMS/SendBackManual', 'post', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

           setVisibleApproveManualDialog(false);
           fetchData();
           if (onRefreshTree) onRefreshTree(); 
        } catch (err: any) {
            dispatch(setError(err.message || 'Error approving manual'));
        }
    }

    const showCompareVersion = async (data: any) => {
        try {
            setDM_ManualVersionID_ToCompare(data.DM_ManualVersionID_ToCompare);
            
            setVisibleCompareVersionDialog(false);
            setVisibleCompareVersionDetailsDialog(true);
        } catch (err: any) {
            dispatch(setError(err.message || 'Error updating vessel details'));
        }
    }

    const checkConfirmation = () => {
        setShowConfirmPopup(true);
    };

    const CustomConfirmDialog = () => {
        if (!showConfirmPopup) return null;
        return (
            <div className="confirm-overlay">
                <div className="confirm-popup">
                    <div className="confirm-header">
                        <i className="pi pi-exclamation-triangle" /> Confirmation
                    </div>
                    <div className="confirm-content">
                        Are you sure you want to add this manual as favourite?
                    </div>
                    <div className="confirm-actions">
                        <button 
                            className="confirm-button confirm-yes" 
                            onClick={() => {
                                setShowConfirmPopup(false);
                                accept();
                            }}
                        >
                            Yes
                        </button>
                        <button 
                            className="confirm-button confirm-no" 
                            onClick={() => {
                                setShowConfirmPopup(false);
                                reject();
                            }}
                        >
                            No
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const accept = () => {
        dmsLifecycleService.apiCall(`DMS/AddToFavourite?dm_ManualID=${manualID}&userId=${userId}`, 'get')
            .then(() => {
                toast.current.show({
                    severity: 'info',
                    summary: 'Confirmed',
                    detail: 'Manual added to favourites.',
                    life: 3000,
                    closable: true
                });
            })
            .catch(() => {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to add manual to favourites.',
                    life: 3000,
                    closable: true
                });
            });
    }

    const reject = () => {
        toast.current.show({
            severity: 'warn',
            summary: 'Rejected',
            detail: 'You have rejected add favourite',
            life: 3000,
            closable: true
        });
    }

    return (
       <>
        <Toast ref={toast} />
        <div className='sectionDiv'>
            <div className='selectedTextDiv'>
                <div style={{width: '215px', flexDirection: 'row', display: 'inline-flex', alignItems: 'left', verticalAlign: 'middle'}}>
                    <span className='selectedText' style={{verticalAlign: 'middle'}}>Selected Manual :&nbsp;</span>
                    <span  style={{display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', fontSize: '18px'}}>
                    {manualInfo.selectedManualNodeObj
                        ? ` (v${manualInfo.selectedManualNodeObj.data.manualVersion})`
                        : ''}
                    </span>  &nbsp;
                </div>
                <div style={{width: '1000px', flexDirection: 'row', display: 'inline-flex', alignItems: 'left', verticalAlign: 'middle'}}>
                    <label className='selectedTextHighlight'
                    title={
                        manualInfo.selectedManualNodeObj
                        ? manualInfo.selectedManualNodeObj.label
                        : ''
                    }
                    >
                    {manualInfo.selectedManualNodeObj
                        ? manualInfo.selectedManualNodeObj.label
                        : ''}
                    </label>
                </div>
                <div style={{width: '190px',  display: 'inline-flex', alignItems: 'center', verticalAlign: 'top' }}>
                    <button
                        type="button"
                        className="info-icon-btn"
                        title="Manual Info"
                        onClick={() => setVisibleManualDetailsDialog(true)}
                    >
                        <img src="/info.jpg" alt="Info" />
                    </button>
                    <Button
                        icon={isFavourite ? "pi pi-star-fill" : "pi pi-star"}
                        label={isFavourite ? "My Favourite" : "Add to Favourite"}
                        className="p-button-rounded p-button-warning p-button-lg"
                        style={{
                            fontSize: '1rem',
                            padding: '0.5rem 0.5rem',
                            minWidth: 170,
                            whiteSpace: 'nowrap',
                            height: '2.2rem', // adjust as needed
                            lineHeight: '1.2rem'
                        }}
                        //tooltip={isFavourite ? "Already in Favourites" : "Add to Favourite"}
                        onClick={checkConfirmation}
                        disabled={isFavourite}
                    />
                </div>
            </div>
            <div style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{flexDirection: 'row'}}>
                    <span className='selectedText' style={{verticalAlign: 'middle', display: 'inline-flex'}}>Status :&nbsp;</span>
                    <span style={{ fontWeight: 'bold', fontSize: 18, fontStyle:'bold', marginLeft: 8, width:'300px', display:'inline-flex' }}>
                    {manualInfo.selectedManualNodeObj
                        ? manualInfo.selectedManualNodeObj.data.statusString
                        : ''}
                    </span>

                    <label style={{ marginLeft: '5px', width: '220px', display: 'inline-block', fontSize: '18px', fontStyle:'normal' }}>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => { setIsChecked(e.target.checked); }}
                            className="large-checkbox"
                            style={{ marginLeft: '6px', marginRight: '4px', verticalAlign: 'middle' }}
                         />{' '}&nbsp;
                        Include Sub Manual
                    </label>
                    </div>
                     <div style={{flexDirection: 'row', display: 'block', alignItems: 'right'}}>
                        <ContextMenu model={contextMenuItems} ref={menu} style={{ minWidth: '150px' }} />
                        <button
                            type="button"
                            className="download-icon-btn"
                            title="Download Manual"
                            style={{
                                background: 'none',
                                border: 'none',
                                marginLeft: '5px',
                                cursor: 'pointer',
                                verticalAlign: 'middle'
                            }}
                            onClick={e => menu.current.show(e)}
                        >
                            <img src="/download1.png" alt="Download" className="download-icon" style={{ width: '50px', height: '40px' }} />
                        </button>
                        <button
                            className="manual-action-btn"
                            onClick={() => setVisibleCompareVersionDialog(true)}
                            type="button"
                        >
                            Compare Version
                        </button>
                        <button
                            className="manual-action-btn"
                            onClick={() => { setVisibleAddEditDialog(true); }}
                            type="button"
                            style={{ width: '100px', marginRight: '8px' }}
                            disabled = {!isManualReleased && manualInfo.selectedManualNodeObj?.data?.dM_StatusID !== 100}
                        >
                            Edit
                        </button>
                        <button
                            className="manual-action-btn"
                            onClick={() => setVisibleApproveManualDialog(true)}
                            type="button"
                            style={{ width:'120px'}}
                            disabled = {isManualReleased || manualInfo.selectedManualNodeObj?.data?.dM_StatusID === 100}
                        >
                           Approve
                        </button>
                        <button
                            className="manual-action-btn"
                            onClick={() => alert('Send Message clicked!')}
                            type="button"
                            style={{ width:'140px'}}
                            disabled = {manualInfo.selectedManualNodeObj?.data?.dM_StatusID === 100}
                        >
                            Send Message
                        </button>
                    </div>
            </div>
            <div className='sectiontext'>
                 {manualInfo.selectedManualNodeObj ? (
                    <JoditEditor
                        value={manualText}
                        config={{
                            readonly: true,
                            toolbar: false,
                            height: 690,
                            showCharsCounter: false,
                            showWordsCounter: false,
                            showXPathInStatusbar: false,
                        }}
                    />
                ) : (
                    <p></p>
                )}
            </div>
        </div>
        <Dialog header={'Compare Version'}
            visible={visibleCompareVersionDialog}
            style={{ width: '450px', height: '32vh', minWidth: '90vh' }}
            contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
            headerStyle={{ height: '60px', backgroundColor: '#d2e3f9ff', borderBottom: '2px solid blue' }}
            onHide={() => { if (!visibleCompareVersionDialog) return; setVisibleCompareVersionDialog(false); }}>
            <CompareVersion
                onSubmit={showCompareVersion}
                closeForm={() => setVisibleCompareVersionDialog(false)}
                selectedManualID={manualID}
            />
        </Dialog>

        <Dialog
            header={'Compare Version : ' + headerText}
            visible={visibleCompareVersionDetailsDialog}
            style={{ width: '1250px', minWidth: '90vh' }}
            contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
            headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue' }}
            onHide={() => { if (!visibleCompareVersionDetailsDialog) return; setVisibleCompareVersionDetailsDialog(false); }}>
            <CompareVersionDetails
                closeForm={() => setVisibleCompareVersionDetailsDialog(false)}
                manualID={manualID}
                DM_ManualVersionID_ToCompare={DM_ManualVersionID_ToCompare}
            />
        </Dialog>
        {visibleManualDetailsDialog && (
            <Dialog
                className="manual-details-dialog"
                header={'Manual Details '}
                visible={visibleManualDetailsDialog}
                style={{ width: '1550px', minWidth: '90vh' }}
                contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
                headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue', height: '60px' }}
                onHide={() => { if (!visibleManualDetailsDialog) return; setVisibleManualDetailsDialog(false); }}>
                <ManualDetails 
                    closeForm={() => setVisibleManualDetailsDialog(false)}
                    dmManualVersionID={manualInfo.selectedManualNodeObj?.data?.dM_ManualVersionID} />
            </Dialog>
        )}
        {visibleApproveManualDialog && (
            <Dialog
                className="no-header-dialog"
                header={null} // or header=""
                visible={visibleApproveManualDialog}
                style={{ width: '550px', minWidth: '90vh' }}
                contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
                onHide={() => { if (!visibleApproveManualDialog) return; setVisibleApproveManualDialog(false); }}>
                <ApproveManual 
                    manualName={manualInfo.selectedManualNodeObj?.label}
                    version={manualInfo.selectedManualNodeObj?.data?.manualVersion}
                    status={manualInfo.selectedManualNodeObj?.data?.statusString}
                    onApprove={(comment) => { ApproveManuals({ dM_ManualID: manualInfo.selectedManualNodeObj?.key, dM_ManualVersionID: manualInfo.selectedManualNodeObj?.data?.dM_ManualVersionID, userID: userId, comments: comment }); }}
                    onReject={(comment) => { SendBackManuals({ dM_ManualID: manualInfo.selectedManualNodeObj?.key, dM_ManualVersionID: manualInfo.selectedManualNodeObj?.data?.dM_ManualVersionID, userID: userId, comments: comment }); }}
                    onClose={() => setVisibleApproveManualDialog(false)}
                />
            </Dialog>
        )}
        {visibleAddEditDialog && (
           <Dialog header={headerText}
            visible={visibleAddEditDialog}
            style={{ width: '60%', height: '160vh' }}
            contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
            headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue' , height: '30px'}}
            onHide={() => { if (!visibleAddEditDialog) return; setVisibleAddEditDialog(false); }}>
                <AddEditManual
                    onSubmit={updateManuals}
                    closeForm={() => { setVisibleAddEditDialog(false); }}
                    selectedAction="Edit"
                    selectedManualID={manualInfo.selectedManualNodeObj?.data?.dM_ManualID}
                    selectedManualVersionID={manualInfo.selectedManualNodeObj?.data?.dM_ManualVersionID}
                />
            </Dialog>
        )}
        </> 
    );
};

export default ManualsContent;