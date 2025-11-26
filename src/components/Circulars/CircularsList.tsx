import React, { useState, useEffect } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useTheme } from '../../contexts/ThemeContext';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import PageHeader from '../PageHeader';
import './CircularsList.scss';

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

    const { theme, setTheme, themeOptions } = useTheme();
    
    const sortOptions = [
        { label: 'Newest First', value: 'newest' },
        { label: 'Oldest First', value: 'oldest' },
        { label: 'Priority', value: 'priority' }
    ];

    const categoryOptions = [
        { label: 'All Categories', value: 'all' },
        { label: 'Safety', value: 'safety' },
        { label: 'Operations', value: 'operations' },
        { label: 'Compliance', value: 'compliance' },
        { label: 'Technical', value: 'technical' }
    ];

    useEffect(() => {
        fetchCirculars();
        
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
        // TODO: Replace with actual API call
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
            setLoading(false);
        }, 1000);
    };

    
    useEffect(() => {
        if (selectedCircular) {
            fetchAckList(selectedCircular.id);
        }
    }, [selectedCircular]);

       const fetchAckList = async (circularId: string) => {
        setAckLoading(true);
        // TODO: Replace with actual API call
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
            >
                <div className="circular-header">
                    <div className="circular-number-badge">
                        {circular.circularNumber}
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
                                className="p-button-text p-button-rounded"
                                tooltip="Add to Favorites"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const listHeader = (
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
                <Dropdown
                    value={sortOrder}
                    options={sortOptions}
                    onChange={(e) => setSortOrder(e.value)}
                    placeholder="Sort by"
                    className="filter-dropdown"
                />
            </div>
            <span className="results-count">{filteredCirculars.length} circulars</span>
            <Button 
                icon="pi pi-refresh" 
                rounded 
                text 
                onClick={fetchCirculars}
                tooltip="Refresh"
            />
        </div>
    );

    return (
        <div className='main-page-wrapper'>
            <PageHeader
                title="COMPANY - Circulars & Alerts Dashboard"
                subtitle="Test User Name"
                subContent={
                    <div className="header-actions">
                        <Dropdown 
                            value={theme} 
                            options={themeOptions} 
                            onChange={(e) => setTheme(e.value)}
                            optionLabel="label"
                            optionValue="value"
                            className="theme-selector"
                            placeholder="Select Theme"
                            style={{ 
                                height: '43px',
                                minHeight: '32px',
                                fontSize: '0.85rem'
                            }}
                            panelStyle={{
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                }
                rightContent={dbInfoAction}
            />
            <div className="circulars-split-container">
                <div className="circulars-list-container">
                    {listHeader}
                    
                    {loading ? (
                        <div className="skeleton-list">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton-item">
                                    <Skeleton width="100%" height="150px" />
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
                    )}
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
                    </div>
                    {selectedCircular ? (
                        <>
                            <div className="selected-circular-info">
                                <h3>{selectedCircular.circularNumber}</h3>
                                <p>{selectedCircular.title}</p>
                            </div>

                            {ackLoading ? (
                                <div className="skeleton-table">
                                    <Skeleton width="100%" height="300px" />
                                </div>
                            ) : (
                                <DataTable 
                                    value={ackList} 
                                    className="ack-table"
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
                        </>
                    ) : (
                        <div className="no-selection">
                            <i className="pi pi-info-circle" style={{ fontSize: '3rem', color: 'var(--text-secondary)' }}></i>
                            <h3>No Circular Selected</h3>
                            <p>Select a circular from the list to view acknowledgment status</p>
                        </div>
                    )}
            </div>
        </div>
    </div>
    );
};

export default CircularsList;