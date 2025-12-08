import React, { useState, useEffect } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Tree } from 'primereact/tree';
import { SelectButton } from 'primereact/selectbutton';
import { TreeNode } from 'primereact/treenode';
import { ContextMenu } from 'primereact/contextmenu';
import { MenuItem } from 'primereact/menuitem';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import PageHeader from '../PageHeader';
import './CircularsList.scss';
import { setError } from '../../store/slices/appSlice';
import AddEditCircular from './AddEditCircular/AddEditCircular';

interface Circular {
    id: string;
    circularType: string;
    category: string;
    circularNumber: string;
    reference: string,
    title: string;
    status: 'Active' | 'Archived' | 'Draft';
    priority: 'High' | 'Medium' | 'Low';
    dateIssued: string;
    remarks: string;
    releasedDate: string;
    attachments: number;
    isNew?: boolean;
    isCategory?: boolean;
}

interface AckRecord {
    id: string;
    vesselName: string;
    acknowledgedBy: string;
    acknowledgedDate: string;
    status: 'Acknowledged' | 'Pending' | 'Overdue';
    remarks?: string;
}

interface CircularsListProps {
    userId: string;
    calledMode?: string;
}

interface TreeNodeData extends TreeNode {
    data: Circular;
}

const CircularsList: React.FC<CircularsListProps> = ({ userId, calledMode }) => {
    const [circulars, setCirculars] = useState<Circular[]>([]);
    const [dbInfoAction, setDbInfoAction] = useState('');
    const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
    const [ackList, setAckList] = useState<AckRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [ackLoading, setAckLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [filterCategory, setFilterCategory] = useState('all');
    const [nodes, setNodes] = useState<TreeNodeData[]>([]);
    const [selectedNodeKey, setSelectedNodeKey] = useState<any>(null);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null | undefined>(null);
    const [selectedAction, setSelectedAction] = useState<string>('Add');
    const [expandedKeys, setExpandedKeys] = useState<{ [key: string]: boolean }>({});
    const [viewMode, setViewMode] = useState('list');
    const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
    const [editingCircular, setEditingCircular] = useState<Circular | null>(null);
    const cm = React.useRef<ContextMenu>(null);

    const menuItems: MenuItem[] = [
        { label: 'Edit', icon: 'pi pi-fw pi-pencil', command: () => handleEdit(selectedCircular?.id || '') },
        { label: 'View', icon: 'pi pi-fw pi-eye', command: () => handleView(selectedCircular?.id || '') },
        { label: 'Download', icon: 'pi pi-fw pi-download', command: () => handleDownload(selectedCircular?.id || '') },
        { label: 'Log', icon: 'pi pi-fw pi-history', command: () => handleLog(selectedCircular?.id || '') },
        { label: 'Add to Favorites', icon: 'pi pi-fw pi-star' }
    ];

    const sortOptions = [
        { label: 'Newest First', value: 'newest' },
        { label: 'Oldest First', value: 'oldest' },
        { label: 'Priority', value: 'priority' }
    ];

    const categoryOptions = [
        { label: 'All Categories', value: 'all' },
        { label: 'S afety', value: 'safety' },
        { label: 'Operations', value: 'operations' },
        { label: 'Compliance', value: 'compliance' },
        { label: 'Technical', value: 'technical' }
    ];

    const viewOptions = [
        { icon: 'pi pi-align-justify', value: 'list', label: 'List' },
        { icon: 'pi pi-th-large', value: 'grid', label: 'Grid' },
        { icon: 'pi pi-sitemap', value: 'tree', label: 'Tree' }
    ];

     const getHeaderTitle = () => {
        switch (calledMode) {
            case 'all':
                return 'Circulars & Alerts Dashboard';
            case 'new':
                return 'New Circulars & Alerts List';
            case 'favorites':
                return 'My Favorites';
            case 'toack':
                return 'Acknowledgment Required';
            case 'pending':
                return 'Pending Circulars';
            case 'acknowledged':
                return 'Acknowledged Circulars';
            case 'archived':
                return 'Archived Circulars';

            case 'circulars':
                return 'Circulars Dashboard';
            case 'newcirculars':
                return 'New Circulars List';
             case 'favoritescirculars':
                return 'My Favorites Circulars';
            case 'toackcirculars':
                return 'Acknowledgment Required Circulars';
            case 'pendingcirculars':
                return 'Pending Circulars';
            case 'acknowledgedcirculars':
                return 'Acknowledged Circulars';
            case 'archivedcirculars':
                return 'Archived Circulars';
                
            case 'alerts':
                return 'Alerts Dashboard';
            case 'newalerts':
                return 'New Alerts List';
             case 'favoritesalerts':
                return 'My Favorites Alerts';
            case 'toackalerts':
                return 'Acknowledgment Required Alerts';
            case 'pendingalerts':
                return 'Pending Alerts';
            case 'acknowledgedalerts':
                return 'Acknowledged Alerts';
            case 'archivedalerts':
                return 'Archived Alerts';
            default:
                return 'Circulars & Alerts Dashboard';
        }
    };

    useEffect(() => {
        if (calledMode) {
            localStorage.setItem('lastDashboardTab', 'circulars');
        }
    }, [calledMode]);

    useEffect(() => {
        fetchCirculars();
        LoadTreeNodeData();

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

    const fetchCirculars = async () => {
        setLoading(true);

        setTimeout(() => {
            const dummyData: Circular[] = [
                {
                    id: '1',
                    circularType: 'circular',
                    category: 'Safety',
                    reference: 'Safety',
                    circularNumber: 'CIR-2024-001',
                    title: 'New Safety Protocols for Vessel Operations',
                    priority: 'High',
                    status: 'Active',
                    dateIssued: '2024-11-20',
                    remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                    attachments: 3,
                    releasedDate: '2024-11-21',
                    isNew: true
                },
                {
                    id: '2',
                    circularType: 'circular',
                    category: 'Safety',
                    reference: 'Safety',
                    circularNumber: 'CIR-2024-002',
                    title: 'Vessel Operations Safety manuals',
                    priority: 'Low',
                    status: 'Active',
                    dateIssued: '2025-09-20',
                    remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                    attachments: 3,
                    releasedDate: '2024-11-21',
                    isNew: true
                },
                {
                    id: '3',
                    circularType: 'circular',
                    category: 'Safety',
                    reference: 'Safety',
                    circularNumber: 'CIR-2024-003',
                    title: 'New Protocols for Vessel Operations',
                    priority: 'Medium',
                    status: 'Active',
                    dateIssued: '2023-10-20',
                    remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                    attachments: 3,
                    releasedDate: '2024-11-21',
                    isNew: true
                }
            ];
            setCirculars(dummyData);
            setNodes(dummyTreeData);
            setLoading(false);
        }, 1000);
    };
    
    const dummyTreeData: TreeNodeData[] = [
        {
            key: '0',
            label: 'Safety Circulars',
            data: {
                id: '1',
                circularType: 'circular',
                category: 'Safety',
                reference: 'Safety',
                circularNumber: 'CIR-2024-001',
                title: 'New Safety Protocols for Vessel Operations',
                priority: 'High',
                status: 'Active',
                dateIssued: '2024-11-20',
                remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                attachments: 3,
                releasedDate: '2024-11-21',
                isNew: true,
                isCategory: true
            },
            children: [
                {
                    key: '0-0',
                    label: 'New Safety Protocols',
                    data: {
                        id: '1',
                        circularType: 'circular',
                        category: 'Safety',
                        reference: 'Safety',
                        circularNumber: 'CIR-2024-001',
                        title: 'New Safety Protocols for Vessel Operations',
                        priority: 'High',
                        status: 'Active',
                        dateIssued: '2024-11-20',
                        remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                        attachments: 3,
                        releasedDate: '2024-11-21',
                        isNew: true
                    },
                    children: []
                },
                {
                    key: '0-1',
                    label: 'Updated Fire Drill Procedures',
                    data: {
                        id: '2',
                        circularType: 'circular',
                        category: 'Safety',
                        reference: 'Safety',
                        circularNumber: 'CIR-2024-002',
                        title: 'Vessel Operations Safety manuals',
                        priority: 'Low',
                        status: 'Active',
                        dateIssued: '2025-09-20',
                        remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                        attachments: 3,
                        releasedDate: '2024-11-21',
                        isNew: true
                    },
                    children: []
                }
            ]
        },
        {
            key: '1',
            label: 'Operational Memos',
            data: {
                id: '3',
                circularType: 'circular',
                category: 'Safety',
                reference: 'Safety',
                circularNumber: 'CIR-2024-003',
                title: 'New Protocols for Vessel Operations',
                priority: 'Medium',
                status: 'Active',
                dateIssued: '2023-10-20',
                remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                attachments: 3,
                releasedDate: '2024-11-21',
                isNew: true,
                isCategory: true
            },
            children: [
                {
                    key: '1-0',
                    label: 'Revised Cargo Handling Guidelines',
                    data: {
                        id: '3',
                        circularType: 'circular',
                        category: 'Safety',
                        reference: 'Safety',
                        circularNumber: 'CIR-2024-003',
                        title: 'New Protocols for Vessel Operations',
                        priority: 'Medium',
                        status: 'Active',
                        dateIssued: '2023-10-20',
                        remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                        attachments: 3,
                        releasedDate: '2024-11-21',
                        isNew: true
                    },
                    children: []
                }
            ]
        },
        {
            key: '2',
            label: 'Technical Bulletins',
            data: {
                id: '1',
                circularType: 'circular',
                category: 'Safety',
                reference: 'Safety',
                circularNumber: 'CIR-2024-001',
                title: 'New Safety Protocols for Vessel Operations',
                priority: 'High',
                status: 'Active',
                dateIssued: '2024-11-20',
                remarks: 'Updated safety protocols for all vessel operations effective immediately.',
                attachments: 3,
                releasedDate: '2024-11-21',
                isNew: true,
                isCategory: true
            },
            children: []
        }
    ];

    const LoadTreeNodeData = async () => {
        try {
            // const data: TreeNodeData[] = await dmsLifecycleService.getApiCall(`DMS/GetTreeViewManualList?userId=${userId}`);
            const data = dummyTreeData;
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
    
    const onSelectionChange = (e: any) => {
        setSelectedNodeKey(e.value);
        const node = findNodeByKey(nodes, e.value as string);
        if (node) {
            if (node.data.isCategory) {
                setSelectedCircular(null);
            } else {
                setSelectedCircular(node.data as Circular);
            }
        }
    }

    const onTreeContextMenu = (event: any) => {
        event.originalEvent.preventDefault();
        const node = event.node;
        setSelectedNodeKey(node.key);
        if (node && !node.data.isCategory) {
            setSelectedCircular(node.data);
            cm.current?.show(event.originalEvent);
        }
        else {
            cm.current?.hide(event.originalEvent);
            setSelectedCircular(null);
        }
    };

    const onListContextMenu = (event: React.MouseEvent, circular: Circular) => {
        event.preventDefault();
        setSelectedCircular(circular);
        cm.current?.show(event);
    };
    
    useEffect(() => {
        if (selectedCircular) {
            fetchAckList(selectedCircular.id);
        }
    }, [selectedCircular]);

    const fetchAckList = async (circularId: string) => {
        setAckLoading(true);
        
        setTimeout(() => {
            const dummyAckData: AckRecord[] = [
                {
                    id: '1',
                    vesselName: 'MV Ocean Star',
                    acknowledgedBy: 'John Smith',
                    acknowledgedDate: '2024-11-21',
                    status: 'Acknowledged',
                    remarks: 'Received and understood'
                },
                {
                    id: '2',
                    vesselName: 'MV Sea Explorer',
                    acknowledgedBy: 'Pending',
                    acknowledgedDate: '-',
                    status: 'Pending'
                },
                {
                    id: '3',
                    vesselName: 'MV Pacific Queen',
                    acknowledgedBy: 'Mike Johnson',
                    acknowledgedDate: '2024-11-22',
                    status: 'Acknowledged',
                    remarks: 'Acknowledged'
                },
                {
                    id: '4',
                    vesselName: 'MV Atlantic Wave',
                    acknowledgedBy: 'Pending',
                    acknowledgedDate: '-',
                    status: 'Overdue',
                    remarks: 'Overdue by 2 days'
                }
            ];
            setAckList(dummyAckData);
            setAckLoading(false);
        }, 500);
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'High': return 'pi-exclamation-triangle';
            case 'Medium': return 'pi-info-circle';
            case 'Low': return 'pi-check-circle';
            default: return 'pi-circle';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Active': return 'pi-check-circle';
            case 'Draft': return 'pi-file-edit';
            case 'Archived': return 'pi-inbox';
            default: return 'pi-circle';
        }
    };

    const getAckStatusColor = (status: string) => {
        switch (status) {
            case 'Acknowledged': return 'success';
            case 'Pending': return 'warning';
            case 'Overdue': return 'danger';
            default: return 'info';
        }
    };

    const ackStatusBodyTemplate = (rowData: AckRecord) => {
        return <Tag value={rowData.status} severity={getAckStatusColor(rowData.status)} />;
    };

    const handleView = (id: string) => {
        console.log('View circular:', id);
    };

    const handleEdit = (id: string) => {
        const circularToEdit = circulars.find(c => c.id === id) || null;
        setEditingCircular(circularToEdit);
        setIsAddDialogVisible(true);
    };

    const handleDownload = (id: string) => {
        console.log('Download circular:', id);
    };

    const handleLog = (id: string) => {
        console.log('View log for circular:', id);
        // TODO: Open log dialog or navigate to log page
    };

    const filteredCirculars = circulars.filter(circular => {
        const matchesSearch = searchTerm === '' || 
                          circular.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          circular.circularNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || 
                            circular.category.toLowerCase() === filterCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    const itemTemplate = (circular: Circular) => {
        const isSelected = selectedCircular?.id === circular.id;

        return (
           <div 
                className={`circular-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedCircular(circular)}
                onContextMenu={(e) => onListContextMenu(e, circular)}
            >
                <div className="circular-header">
                    <div className="circular-number-badge">
                        <h4>{circular.circularNumber}</h4>
                    </div>
                    <div className="circular-tags">
                        <span className={`custom-tag priority-${circular.priority.toLowerCase()}`}>
                            <i className={`pi ${getPriorityIcon(circular.priority)}`}></i>
                            {circular.priority}
                        </span>
                        <span className={`custom-tag status-${circular.status.toLowerCase()}`}>
                            <i className={`pi ${getStatusIcon(circular.status)}`}></i>
                            {circular.status}
                        </span>
                    </div>
                </div>

                <div className="circular-body">
                    <h3 className="circular-title">{circular.title}</h3>
                    <p className="circular-description">{circular.reference}</p>
                    
                    <div className="circular-meta">
                        <div className="meta-left">
                            <div className="meta-item">
                                <i className="pi pi-folder"></i>
                                <span>{circular.category}</span>
                            </div>
                            <div className="meta-item">
                                <i className="pi pi-calendar"></i>
                                <span>{new Date(circular.dateIssued).toLocaleDateString()}</span>
                            </div>
                            <div className="meta-item">
                                <i className="pi pi-paperclip"></i>
                                <span>{circular.attachments} Attachments</span>
                            </div>
                        </div>
                        <div className="circular-actions">
                             <Button 
                                icon="pi pi-pencil" 
                                label="Edit" 
                                className="p-button-text"
                                onClick={() => handleEdit(circular.id)}
                            />
                            <Button 
                                icon="pi pi-eye" 
                                label="View" 
                                className="p-button-text"
                                onClick={() => handleView(circular.id)}
                            />
                            <Button 
                                icon="pi pi-download" 
                                label="Download" 
                                className="p-button-text"
                                onClick={() => handleDownload(circular.id)}
                            />
                            <Button 
                                icon="pi pi-history" 
                                label="Log" 
                                className="p-button-text"
                                onClick={() => handleLog(circular.id)}
                                tooltip="View Activity Log"
                            />
                            <Button 
                                icon="pi pi-star" 
                                label="Favorites" 
                                className="p-button-text "
                                tooltip="Add to Favorites"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleNewCircular = () => {
        setEditingCircular(null);
        setIsAddDialogVisible(true);
    };
    
    const headerActions = (
        <Button 
            icon="pi pi-plus" 
            label="New Circular"
            className="p-button-success"
            onClick={handleNewCircular}
            tooltip="Create New Circular"
        />
    );

    const findNodeByKey = (nodes: TreeNodeData[], key: string): TreeNodeData | null => {
        for (const node of nodes) {
            if (node.key === key) {
                return node;
            }
            if (node.children) {
                const found = findNodeByKey(node.children as TreeNodeData[], key);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };

    return (
        <div className='main-page-wrapper'>
            <ContextMenu 
                model={menuItems} 
                ref={cm} 
            />
            <AddEditCircular
                visible={isAddDialogVisible}
                onHide={() => setIsAddDialogVisible(false)}
                circular={editingCircular}
            />
            <PageHeader
                title={`COMPANY - ${getHeaderTitle()}`}
                subtitle="Test User Name"
                rightContent={dbInfoAction}
            />
            
            <div className="circulars-split-container">
                <div className="circulars-list-section">
                    <div className="list-controls">
                        <div className="search-box">
                            <span className="p-input-icon-left">
                                <i className="pi pi-search" />
                                <InputText
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search circulars..."
                                    className="search-input"
                                />
                            </span>
                        </div>
                        <div className="filter-controls">
                            <Dropdown
                                value={filterCategory}
                                options={categoryOptions}
                                onChange={(e) => setFilterCategory(e.value)}
                                placeholder="Category"
                                className="filter-dropdown"
                            />
                            {(
                                viewMode === 'list' ? (
                                    <Dropdown
                                        value={sortOrder}
                                        options={sortOptions}
                                        onChange={(e) => setSortOrder(e.value)}
                                        placeholder="Sort by"
                                        className="filter-dropdown"
                                    />
                                ) : null
                            )}
                        </div>
                        <div className="view-switcher">
                            <SelectButton
                                value={viewMode}
                                options={viewOptions}
                                onChange={(e) => {
                                    if (e.value !== null) {
                                        setViewMode(e.value);
                                    }
                                }}
                                itemTemplate={(option) => (
                                    <div className="flex align-items-center" style={{ padding: '0.5rem 0.7rem' }}>
                                        <i className={option.icon} style={{ fontSize: '1.2rem' }}></i>
                                    </div>
                                )}
                                tooltip="Switch between List and Tree view"
                                tooltipOptions={{ position: 'bottom' }}
                            />
                        </div>
                        <span className="results-count">{filteredCirculars.length} Circulars</span>
                        {/* <Button 
                            icon="pi pi-refresh" 
                            rounded 
                            text 
                            onClick={fetchCirculars}
                            tooltip="Refresh"
                        /> */}
                    </div>
                    
                    <div className="list-content">
                        {loading ? (
                            <div className="skeleton-list">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton-item">
                                        <Skeleton width="100%" height="150px" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            viewMode === 'tree' ? (
                            <Tree
                                value={nodes}
                                selectionMode="single"
                                selectionKeys={selectedNodeKey}
                                onSelectionChange={onSelectionChange}
                                expandedKeys={expandedKeys}
                                onToggle={(e) => {
                                    setExpandedKeys(e.value);
                                    cm.current?.hide(e.originalEvent);
                                }}
                                className="custom-tree"
                                onContextMenu={onTreeContextMenu}
                            />
                            ) : viewMode === 'grid' ? (
                                <div className="circulars-grid">
                                    {filteredCirculars.map((circular) => (
                                        <div key={circular.id} className="grid-item" onClick={() => setSelectedCircular(circular)}>
                                            <div className="grid-item-header">
                                                <h4>{circular.circularNumber}</h4>
                                            </div>
                                            <h3 className="grid-item-title">{circular.title}</h3>
                                            <div className="meta-left">
                                                <div className="meta-item">
                                                    <i className="pi pi-folder"></i>
                                                    <span>{circular.category}</span>
                                                    <i className="pi pi-calendar"></i>
                                                    <span>{new Date(circular.dateIssued).toLocaleDateString()}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <i className="pi pi-paperclip"></i>
                                                    <span>{circular.attachments} Attachments</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <DataView 
                                value={filteredCirculars} 
                                itemTemplate={itemTemplate}
                                layout="list"
                                paginator
                                rows={10}
                                className="circulars-dataview"
                            />
                            )
                        )}
                    </div>
                </div>
                <div className="ack-list-section">
                    <div className="section-header">
                        <h2><i className="pi pi-check-square"></i> Acknowledgment Status</h2>
                        {selectedCircular && (
                            <Button 
                                icon="pi pi-refresh" 
                                rounded 
                                text 
                                onClick={() => fetchAckList(selectedCircular.id)}
                                tooltip="Refresh Acknowledgments"
                            />
                        )}
                        <Button 
                            icon="pi pi-plus" 
                            label="New Circular"
                            className="p-button-success"
                            onClick={handleNewCircular}
                            rounded
                            style={{padding:'0.2rem 0.5rem', borderRadius: '0.5rem'}}
                        />
                    </div>
                    {selectedCircular ? (
                        <>
                            <div className="selected-circular-info">
                                <h3>{selectedCircular.circularNumber}</h3>
                                <p>{selectedCircular.title}</p>
                            </div>

                            <div className="ack-table-container">
                                {ackLoading ? (
                                    <div className="skeleton-table">
                                        <Skeleton width="100%" height="300px" />
                                    </div>
                                ) : (
                                    <DataTable 
                                        value={ackList} 
                                        className="ack-table"
                                        scrollable 
                                        scrollHeight="flex"
                                        stripedRows
                                        paginator
                                        rows={10}
                                        emptyMessage="No acknowledgment records found"
                                    >
                                        <Column field="vesselName" header="Vessel Name" sortable />
                                        <Column field="acknowledgedBy" header="Acknowledged By" sortable />
                                        <Column field="acknowledgedDate" header="Date" sortable />
                                        <Column field="status" header="Status" body={ackStatusBodyTemplate} sortable />
                                        <Column field="remarks" header="Remarks" />
                                    </DataTable>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <i className="pi pi-info-circle" style={{ fontSize: '3rem', color: 'var(--text-secondary)' }}></i>
                            <h3>No Circular Selected</h3>
                            <p>Select a circular from the list to view its status.</p>
                        </div>
                    )}
            </div>
        </div>
    </div>
    );
};

export default CircularsList;