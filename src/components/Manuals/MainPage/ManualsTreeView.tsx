import React, { useImperativeHandle, forwardRef, useState, useRef, useEffect } from 'react';
import { Tree } from "primereact/tree";
import { TreeNode } from 'primereact/treenode';
import { Dialog } from 'primereact/dialog';
import { ContextMenu } from 'primereact/contextmenu';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setError, setSelectedManualNodeObj } from '../../../store/slices/appSlice';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import type { ContextMenu as ContextMenuType } from 'primereact/contextmenu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import axios from 'axios';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import AddEditManual from '../AddEditManual/AddEditManual';
import VesselDetails from '../../VesselDetails/VesselDetails';
import ManualDetails from '../ViewManuals/ManualDetails';
import ManualAckList from '../ViewManuals/ManualAckList';
import notify from '../../../services/notify';

export interface ManualsTreeViewProps {
    userId: string;
    /** Dashboard/menu filter (?mode=). Matches are selectable; their parents are shown disabled. */
    calledMode?: string;
}

interface TreeNodeData extends TreeNode {
    data: {
        dM_ManualID: number;
        dM_ManualVersionID: number;
        parentID: number;
        manualLevel: number;
    };
}

const ManualsTreeView = forwardRef<any, ManualsTreeViewProps>(({ userId, calledMode }, ref) => {
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
            disabled: !(appInfo.selectedManualNodeObj &&
                        (String(appInfo.selectedManualNodeObj.data.statusString).toUpperCase() === 'DRAFT' ||
                         String(appInfo.selectedManualNodeObj.data.statusString).toUpperCase() === 'RELEASED'))
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
        { separator: true },
        {
            label: 'Assign Manual Rights (To Ack)',
            icon: 'pi pi-user-plus',
            command: () => { 
                setVisibleVesselDetailsDialog(true); 
                setHeaderText('Assign Manual Rights'); 
                setSelectedAction('Edit'); }
        },
        { separator: true },
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
                setHeaderText('View Manual Rights'); 
                setSelectedAction('View'); }
        },
        {
            label: 'View User Acks',
            icon: 'pi pi-check',
            command: () => { 
                setVisibleVslAckDialog(true); 
                setHeaderText('Acknowledgement tracking: ' + selectedNodeLabel); 
                setSelectedAction('View'); }
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            await LoadTreeNodeData();
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calledMode]);

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
            const modeQuery = calledMode ? `&calledMode=${encodeURIComponent(calledMode)}` : '';
            const data: TreeNodeData[] = (await dmsLifecycleService.getApiCall(`DMS/GetTreeViewManualList?userId=${userId}${modeQuery}`)) || [];
            setAllNodes(data);
            setNodes(data);
            setSearchValue('');

            if (calledMode) {
                // Filtered: open every branch so all matches are visible, and select the first match.
                setExpandedKeys(allBranchKeys(data));
                const first = firstSelectable(data);
                setSelectedNodeKey(first ? first.key : null);
                setSelectedNodeLabel(first ? first.label : null);
                dispatch(setSelectedManualNodeObj(first));
                return;
            }
            
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

    /** Keys of every node that has children (for expanding a filtered tree). */
    function allBranchKeys(list: any[], keys: { [key: string]: boolean } = {}) {
        for (const node of list) {
            if (node.children && node.children.length) {
                keys[node.key] = true;
                allBranchKeys(node.children, keys);
            }
        }
        return keys;
    }

    /** First node the user may select (parents shown only for context have selectable = false). */
    function firstSelectable(list: any[]): any {
        for (const node of list) {
            if (node.selectable !== false) return node;
            const child = node.children ? firstSelectable(node.children) : null;
            if (child) return child;
        }
        return null;
    }

    function getFirstNodeKey(nodes: TreeNodeData[]) {
        if (!nodes || nodes.length === 0) return null;
        let node: any = nodes[0];
        return node;
    }
    
    const onContextMenu = (event: any) => {
        if (event.node.selectable === false) return; // context-only parent: no actions
        setContextMenuSelectionKey(event.node.key);
        setSelectedNodeKey(event.node.key);
        setSelectedNodeLabel(event.node.label);
        dispatch(setSelectedManualNodeObj(event.node));
        cm.current?.show(event.originalEvent);
    };

    const onSelectionChange = (e: any) => {
        const target = findNodeQuiet(nodes, e.value);
        if (target && target.selectable === false) return; // parents shown only for context cannot be opened
        setSelectedNodeKey(e.value);
        const selectedNode = findNodeByKey(nodes, e.value);
        setSelectedNodeLabel(selectedNode ? selectedNode.label : null);
    };

    /** Find a node without changing the selected manual. */
    const findNodeQuiet = (nodeList: any[], key: any): any => {
        for (const node of nodeList) {
            if (node.key === key) return node;
            const child = node.children ? findNodeQuiet(node.children, key) : null;
            if (child) return child;
        }
        return null;
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
        if (event.node.selectable === false) return;
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

            const response = await dmsLifecycleService.postApiCall(url, data);

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
            await dmsLifecycleService.postApiCall(url, data);

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
            setSelectedAction('');
            const response = await dmsLifecycleService.deleteApiCall(`DMS/DeleteManual/${nodeKey}`)

            if (!response.ok) {
               // throw new Error('Failed to delete');
            }

            await LoadTreeNodeData();
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                const msg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Something went wrong.';
                notify.error(msg, 'Delete failed');
            } else {
                notify.error(err.message, 'Delete failed');
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
            setSelectedAction('');
            const response = await dmsLifecycleService.deleteApiCall(`DMS/DeleteManual/${nodeKey}`);
            
            if (!response.ok) {
               // throw new Error('Failed to delete');
            }

            await LoadTreeNodeData();
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                const msg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Something went wrong.';
                notify.error(msg, 'Delete failed');
            } else {
                notify.error(err.message, 'Delete failed');
            }
        }
    };

    if (loading) return <div>Loading Tree.....</div>

    return (
        <div className="tree-maincontainer">
            <div className="p-inputgroup">
                <InputText
                    placeholder="Search..."
                    value={searchValue}
                    onChange={onSearchChange}
                    style={{ 
                        height: '38px', 
                        paddingLeft: '10px' 
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                    <Button 
                    label="" 
                    icon="pi pi-plus" 
                    className="treeButton compact-btn" 
                    tooltip="Expand All" 
                    onClick={expandAll}
                    style={{
                        background: 'var(--primary-color)',
                        border: '1px solid var(--primary-color)',
                        color: 'white',
                        width: '38px',
                        height: '38px',
                        minWidth: '38px',
                        padding: '0',
                        fontSize: '0.75rem'
                    }}
                />&nbsp;&nbsp;
                <Button 
                    label="" 
                    icon="pi pi-minus" 
                    className="treeButton compact-btn" 
                    tooltip="Collapse All" 
                    onClick={collapseAll}
                    style={{
                        background: 'var(--primary-color)',
                        border: '1px solid var(--primary-color)',
                        color: 'white',
                        width: '38px',
                        height: '38px',
                        minWidth: '38px',
                        padding: '0',
                        fontSize: '0.75rem'
                    }}
                />&nbsp;&nbsp;
                </div>
            </div>
            <div className="tree-view-container" style={{ padding: 0, margin: 0 }}>
                <ConfirmDialog className="manual-delete-confirm" />
                <ContextMenu 
                    model={contextMenuItems}
                    ref={cm} 
                    className="compact-contextmenu"
                    appendTo="self"
                    style={{ minWidth: '300px' }}
                    pt={{
                        root: { 
                            className: 'no-left-padding',
                            style: { paddingLeft: 0 }
                        },
                        menu: {
                            style: { paddingLeft: 0 }
                        },
                        menuitem: {
                            style: { paddingLeft: 0 }
                        },
                        action: {
                            style: { paddingLeft: '0.25rem' }
                        }
                        }} />
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
                    emptyMessage={calledMode ? 'No manuals match this filter.' : 'No manuals found.'}
                    className="custom-tree"
                    style={{ 
                    border: 'none', 
                    padding: 0, 
                    paddingTop: '2px',
                    margin: 0,
                    background: 'var(--bg-secondary)'
                }}
                />
            </div>
            <Dialog 
                header={headerText}
                className="manual-edit-dialog"
                visible={visibleAddEditDialog}
                style={{ width: '60%', height: '220vh' }}
                contentStyle={{ padding: '0.1rem', backgroundColor: '#e5eefbff' }}
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
                className="manual-rights-dialog"
                visible={visibleVesselDetailsDialog}
                style={{ width: '65%', maxHeight: '90vh', minWidth: '90vh' }}
                contentStyle={{ height: '100%', padding: '0.5rem', backgroundColor: '#e5eefbff' }}
                onHide={() => { if (!visibleVesselDetailsDialog) return; setVisibleVesselDetailsDialog(false); }}>
                <VesselDetails
                    manualTitle={selectedNodeLabel? selectedNodeLabel : ''}
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