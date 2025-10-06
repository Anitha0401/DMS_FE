import React, { useImperativeHandle, forwardRef, useState, useRef, useEffect } from 'react';
import { Tree } from "primereact/tree";
import { TreeNode } from 'primereact/treenode';
import { Dialog } from 'primereact/dialog';
import AddEditManual from '../AddEditManual/AddEditManual';
import { ContextMenu } from 'primereact/contextmenu';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setError, setSelectedManualNodeObj } from '../../store/slices/appSlice';
import type { ContextMenu as ContextMenuType } from 'primereact/contextmenu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import axios from 'axios';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import VesselDetails from '../VesselDetails/VesselDetails';
import ManualDetails from '../ViewManuals/ManualDetails';
import ManualAckList from '../ViewManuals/ManualAckList';

export interface ManualsTreeViewProps {
    userId: string;
}

interface TreeNodeData extends TreeNode {
    data: {
        dM_ManualID: number;
        dM_ManualVersionID: number;
        parentID: number;
        manualLevel: number;
    };
}

const ManualsTreeView = forwardRef<any, ManualsTreeViewProps>(({ userId }, ref) => {
    const dispatch = useDispatch();
    const appInfo = useSelector((state: RootState) => state.appInfo);
    const [nodes, setNodes] = useState<TreeNodeData[]>([]);
    const [allNodes, setAllNodes] = useState<TreeNodeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNodeKey, setSelectedNodeKey] = useState<any>(null);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null | undefined>(null);
    const [searchValue, setSearchValue] = useState('');
    const [contextMenuSelectionKey, setContextMenuSelectionKey] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState<{ [key: string]: boolean }>({});
    const [visibleAddEditDialog, setVisibleAddEditDialog] = useState<boolean>(false);
    const [visibleVesselDetailsDialog, setVisibleVesselDetailsDialog] = useState<boolean>(false);
    const [visibleManualDetailsDialog, setVisibleManualDetailsDialog] = useState<boolean>(false);
    const [visibleVslAckDialog, setVisibleVslAckDialog] = useState<boolean>(false);
    const [selectedAction, setSelectedAction] = useState<string>('Add');
    const [headerText, setHeaderText] = useState<string>('Add Manual');
    const [newNodeKey, setNewNodeKey] = useState<string | null>(null);
    const cm = useRef<ContextMenuType | null>(null);

    useImperativeHandle(ref, () => ({
        refreshTree
    }));

    const contextMenuItems = [
        {
            label: 'Add Manual',
            icon: 'pi pi-plus',
            items: [
                {
                    label: 'As Sub Manual',
                    icon: 'pi',
                    command: () => {
                        setVisibleAddEditDialog(true);
                        setHeaderText('Add Sub Manual : ' + selectedNodeLabel);
                        setSelectedAction('AddSubLevel');
                    }
                },
                {
                    label: 'At Same Level',
                    icon: 'pi',
                    command: () => {
                        setVisibleAddEditDialog(true);
                        setHeaderText('Add Manual');
                        setSelectedAction('AddSameLevel');
                    }
                }
            ]
        },
        {
            label: 'Edit Manual',
            icon: 'pi pi-pencil',
            command: () => { 
                setVisibleAddEditDialog(true); 
                setHeaderText('Edit Manual : ' + selectedNodeLabel); 
                setSelectedAction('Edit'); },
            disabled: !(appInfo.selectedManualNodeObj && String(appInfo.selectedManualNodeObj.data.statusString).toUpperCase() === 'DRAFT')
        },
        {
            label: 'Delete ',
            icon: 'pi pi-trash',
            items: [
                {
                    label: 'Manual',
                    icon: 'pi',
                    command: () => {
                        if (selectedNodeKey) confirmManualDelete(selectedNodeKey);
                    }
                },
                {
                    label: 'Latest Version',
                    icon: 'pi',
                    command: () => {
                        if (selectedNodeKey) confirmLatestVersionDelete(selectedNodeKey);
                    }
                }
            ]
        },
        {
            label: '',
        },
        {
            label: 'Assign Manual Rights (To Ack)',
            icon: 'pi pi-user-plus',
            command: () => { 
                setVisibleVesselDetailsDialog(true); 
                setHeaderText('Assign Manual Rights : ' + selectedNodeLabel); 
                setSelectedAction('Edit'); }
        },
        {
            label: '                     ',
        },
        {
            label: 'View Manual Details',
            icon: 'pi pi-eye',
            command: () => { 
                setVisibleManualDetailsDialog(true); 
                setHeaderText('View Manual Details : ' + selectedNodeLabel); 
            }
        },
        {
            label: 'View Manual Rights (To Ack)',
            icon: 'pi pi-check',
            command: () => { 
                setVisibleVesselDetailsDialog(true); 
                setHeaderText('View Manual Rights : ' + selectedNodeLabel); 
                setSelectedAction('View'); }
        },
        {
            label: 'View User Acks',
            icon: 'pi pi-check',
            command: () => { 
                setVisibleVslAckDialog(true); 
                setHeaderText('View User Ack: ' + selectedNodeLabel); 
                setSelectedAction('View'); }
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            await LoadTreeNodeData();
        };

        fetchData();
    }, []);

    const refreshTree = () => {
        setSelectedAction('Refresh')
        const fetchData = async () => {
            setNewNodeKey(appInfo.selectedManualNodeObj ? appInfo.selectedManualNodeObj.key : '');
            await LoadTreeNodeData();
        };

        fetchData();
    };

    useEffect(() => {
        if (newNodeKey) {
            setSelectedNodeKey(newNodeKey);
            const selectedNode = findNodeByKey(nodes, newNodeKey);
            setSelectedNodeLabel(selectedNode ? selectedNode.label : null);
            setExpandedKeys(prev => ({
                ...prev,
                [appInfo.selectedManualNodeObj ? appInfo.selectedManualNodeObj.key : '']: true
            }));
            dispatch(setSelectedManualNodeObj(selectedNode));
            setNewNodeKey(null);
        }
    }, [nodes]);

    const LoadTreeNodeData = async () => {
        try {
            const data: TreeNodeData[] = await dmsLifecycleService.apiCall(`DMS/GetTreeViewManualList?userId=${userId}`, 'get');
            setAllNodes(data);
            setNodes(data);

            if (selectedAction === 'AddSubLevel' || selectedAction === 'AddSameLevel' || selectedAction === 'Edit' || selectedAction === 'Refresh') {
                return;
            }
            else {
                const firstNode = getFirstNodeKey(data);
                if (firstNode && firstNode.key) {
                    const firstKey = String(firstNode.key);
                    setExpandedKeys({ [firstKey]: true });
                    setSelectedNodeLabel(firstNode.label);
                    dispatch(setSelectedManualNodeObj(firstNode));
                    setSelectedNodeKey(data[0].key);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Error fetching data');
        } finally {
            setLoading(false);
        }
    }

    function getFirstNodeKey(nodes: TreeNodeData[]) {
        if (!nodes || nodes.length === 0) return null;
        let node: any = nodes[0];
        return node;
    }
    
    const onContextMenu = (event: any) => {
        setContextMenuSelectionKey(event.node.key);
        setSelectedNodeKey(event.node.key);
        setSelectedNodeLabel(event.node.label);
        dispatch(setSelectedManualNodeObj(event.node));
        cm.current?.show(event.originalEvent);
    };

    const onSelectionChange = (e: any) => {
        setSelectedNodeKey(e.value);
        const selectedNode = findNodeByKey(nodes, e.value);
        setSelectedNodeLabel(selectedNode ? selectedNode.label : null);
    };

    const findNodeByKey = (nodeList: any, key: any) => {
        for (let node of nodeList) {
            if (node.key === key) {
                dispatch(setSelectedManualNodeObj(node));
                return node;
            }
            if (node.children) {
                const childNode: any = findNodeByKey(node.children, key);
                if (childNode) {
                    dispatch(setSelectedManualNodeObj(childNode));
                    return childNode;
                }
            }
        }
        return null;
    };

    const filterTree = (nodes: any, searchTerm: string): TreeNodeData[] => {
        const filtered = [];

        for (const node of nodes) {
            const labelMatch = node.label.toLowerCase().includes(searchTerm.toLowerCase());

            let childrenMatch: any = [];
            if (node.children) {
                childrenMatch = filterTree(node.children, searchTerm);
            }

            if (labelMatch || childrenMatch.length > 0) {
                filtered.push({
                    ...node,
                    children: childrenMatch.length > 0 ? childrenMatch : undefined
                });
            }
        }

        return filtered;
    };

    const onSearchChange = (e: any) => {
        const value = e.target.value;
        setSearchValue(value);

        if (value.trim() === '') {
            setNodes(allNodes);
            setExpandedKeys({});
        } else {
            const filtered = filterTree(allNodes, value);
            setNodes(filtered);
            expandAll();
        }
    };

    const onNodeSelect = (event: any) => {
        setSelectedNodeKey(event.node.key);
        setSelectedNodeLabel(event.node.label);
    };

    const expandAll = () => {
        const keys: { [key: string]: boolean } = {};

        const traverse = (nodes: any[]) => {
            for (const node of nodes) {
                if (node.children) {
                    keys[node.key] = true;
                    traverse(node.children);
                }
            }
        };

        traverse(nodes);
        setExpandedKeys(keys);
    };

    const collapseAll = () => {
        setExpandedKeys({});
    };
    
    const updateManuals = async (data: any) => {
        try {
            var url = '';
            if (selectedAction === 'AddSubLevel' || selectedAction === 'AddSameLevel') {
                url = 'DMS/AddManual';
            } else if (selectedAction === 'Edit') {
                url = 'DMS/EditManual';
            }

            const response = await dmsLifecycleService.apiCall(url, 'post', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setVisibleAddEditDialog(false);
            if (selectedAction === 'AddSubLevel' || selectedAction === 'AddSameLevel') {
                await LoadTreeNodeData();
                setNewNodeKey(response.manualId || null);
                setVisibleVesselDetailsDialog(true);
            } else {
                setNewNodeKey(data.DM_ManualID);
                await LoadTreeNodeData();
            }
                      
        } catch (err: any) {
            dispatch(setError(err.message || 'Error adding manual'));
        }
    }

    const updateVesselDetails = async (data: any) => {
        try {
            var url = 'DMS/UpdateManualRights';
           
            await dmsLifecycleService.apiCall(url, 'post', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setVisibleVesselDetailsDialog(false);
            await LoadTreeNodeData();
        } catch (err: any) {
            dispatch(setError(err.message || 'Error updating vessel details'));
        }
    }

    const confirmManualDelete = (nodeKey: string) => {
        confirmDialog({
            message: 'Are you sure you want to delete the selected manual?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => callManualDeleteAPI(nodeKey),
            reject: () => { }
        });
    };

    const callManualDeleteAPI = async (nodeKey: string) => {
        try {
            const response = await dmsLifecycleService.apiCall(
                    `DMS/DeleteManual/${nodeKey}`,
                    'delete'
            );

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            await LoadTreeNodeData();
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                const msg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Something went wrong.';
                alert(msg);
            } else {
                alert('Error deleting node: ' + err.message);
            }
        }
    };

    const confirmLatestVersionDelete = (nodeKey: string) => {
        confirmDialog({
            message: 'Are you sure you want to delete the latest version of selected manual?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => callLatestVersionDeleteAPI(nodeKey),
            reject: () => { }
        });
    };

    const callLatestVersionDeleteAPI = async (nodeKey: string) => {
        try {
            const response = await dmsLifecycleService.apiCall(
                    `DMS/DeleteManual/${nodeKey}`,
                    'delete'
            );
            
            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            await LoadTreeNodeData();
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                const msg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Something went wrong.';
                alert(msg);
            } else {
                alert('Error deleting node: ' + err.message);
            }
        }
    };

    if (loading) return <div>Loading Tree.....</div>

    return (
        <div className="tree-maincontainer">
            <div className="p-inputgroup mb-2" style={{ gap: '15px' }}>
                <InputText
                    placeholder="Search..."
                    value={searchValue}
                    onChange={onSearchChange}
                    style={{ height: '38px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                    <Button label="" icon="pi pi-plus" className="treeButton" tooltip="Expand All" onClick={expandAll} /> &nbsp;&nbsp;
                    <Button label="" icon="pi pi-minus" className="treeButton" tooltip="Collapse All" onClick={collapseAll} />&nbsp;&nbsp;
                </div>
            </div>
            <div className="tree-container">
                <ConfirmDialog />
                <ContextMenu model={contextMenuItems} ref={cm} />
                <Tree
                    value={nodes}
                    selectionMode="single"
                    onNodeClick={onNodeSelect}
                    selectionKeys={selectedNodeKey}
                    onSelectionChange={onSelectionChange}
                    expandedKeys={expandedKeys}
                    onToggle={(e) => setExpandedKeys(e.value)}
                    contextMenuSelectionKey={contextMenuSelectionKey ?? undefined}
                    onContextMenu={onContextMenu}
                />
            </div>
            <Dialog 
                header={headerText}
                visible={visibleAddEditDialog}
                style={{ width: '60%', height: '160vh' }}
                contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
                headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue'  , height: '50px'}}
                onHide={() => { if (!visibleAddEditDialog) return; setVisibleAddEditDialog(false); }}>
                <AddEditManual
                    onSubmit={updateManuals}
                    closeForm={() => { setVisibleAddEditDialog(false); }}
                    selectedAction={selectedAction}
                    selectedManualID={selectedNodeKey ? Number(selectedNodeKey) : -1}
                    selectedManualVersionID={selectedNodeKey ? Number(appInfo.selectedManualNodeObj?.data?.dM_ManualVersionID) : -1}
                />
            </Dialog>

            <Dialog header={headerText}
                visible={visibleVesselDetailsDialog}
                style={{ width: '70%', maxHeight: '90vh', minWidth: '90vh' }}
                contentStyle={{ height: '100%', padding: '0.5rem', backgroundColor: '#e5eefbff' }}
                headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue' }}
                onHide={() => { if (!visibleVesselDetailsDialog) return; setVisibleVesselDetailsDialog(false); }}>
                <VesselDetails
                    onSubmit={updateVesselDetails}
                    closeForm={() => setVisibleVesselDetailsDialog(false)}
                    selectedAction={selectedAction}
                    selectedManualID={selectedNodeKey ? Number(selectedNodeKey) : -1}
                />
            </Dialog>

            <Dialog header={headerText}
                className="manual-dialog"
                visible={visibleManualDetailsDialog}
                style={{ width: '1250px', minWidth: '90vh', height: '100vh', maxHeight: '95vh' }}
                contentStyle={{ padding: '0.5rem', backgroundColor: '#e5eefbff' }}
                headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue' }}
                onHide={() => { if (!visibleManualDetailsDialog) return; setVisibleManualDetailsDialog(false); }}>
                <ManualDetails
                    closeForm={() => setVisibleManualDetailsDialog(false)}
                    dmManualVersionID={selectedNodeKey ? Number(appInfo.selectedManualNodeObj?.data?.dM_ManualVersionID) : -1}
                />
            </Dialog>

            <Dialog header={headerText}
                visible={visibleVslAckDialog}
                style={{ width: '70%', maxHeight: '90vh', minWidth: '90vh', margin: '0px' }}
                contentStyle={{ height: '100%', padding: '0.2em', backgroundColor: '#e5eefbff' }}
                headerStyle={{ backgroundColor: '#d2e3f9ff', borderBottom: '3px solid blue' }}
                onHide={() => { if (!visibleVslAckDialog) return; setVisibleVslAckDialog(false); }}>
                <ManualAckList
                    closeForm={() => setVisibleVslAckDialog(false)}
                    dm_ManualID={selectedNodeKey ? Number(appInfo.selectedManualNodeObj?.data?.dm_ManualID) : -1}
                />
            </Dialog>
        </div>
    );
});

export default ManualsTreeView;