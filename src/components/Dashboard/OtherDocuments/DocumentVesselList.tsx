import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './DocumentVesselList.scss';

interface VesselListProps {
    onSelectionChange?: (selected: number[]) => void;
}

export interface Vessel {
    vesselID: number;
    vslName: string;
    vslType: string;
}

const DocumentVesselList: React.FC<VesselListProps> = ({ onSelectionChange }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [vesselList, setVesselList] = useState<Vessel[]>([]);    
    const [selectedVessels, setSelectedVessels] = useState<Vessel[]>([]);
    const [selectedVesselType, setSelectedVesselType] = useState<string | null>(null);
    const [vesselTypeOptions, setVesselTypeOptions] = useState<{ label: string; value: string }[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [allData, setAllData] = useState<Vessel[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const vslTypeData = await dmsLifecycleService.getApiCall('Vessel/GetVslType');
                const options = vslTypeData.map((cat: any) => ({
                    label: cat,
                    value: cat
                }));
                setVesselTypeOptions(options);
            } catch {
                setVesselTypeOptions([]);
            }
            
            dmsLifecycleService.getApiCall('Vessel/GetVessels')
            .then((data: Vessel[]) => {
                setVesselList(data);
            })
            .catch(() => {
                setVesselList([]);
            });
        };

        fetchData();
    }, []);
    
    useEffect(() => {
        setAllData(vesselList);

	    setIsLoading(false);
    }, [vesselList]);

    const filteredVessels = allData.filter(vessel => {
        const vslType = vessel.vslType || '';
        
        const vslTypeMatch = selectedVesselType
            ? (vslType && vslType.toUpperCase() === selectedVesselType.toUpperCase())
            : true;
        
        return vslTypeMatch;
   });

    const handleSelectionChange = (e: any) => {
        setSelectedVessels(e.value);
        onSelectionChange && onSelectionChange(e.value);
    };
    
    const onSearchChange = (e: any) => {
        const value = e.target.value;
        setSearchValue(value);

        if (value.trim() === '') {
            setAllData(vesselList);
        } else {
            const filtered = vesselList.filter(vsl => 
                vsl.vslName.toLowerCase().includes(value.toLowerCase()) ||
                vsl.vslType.toLowerCase().includes(value.toLowerCase())
            );
            setAllData(filtered);
        }
    };

    return (
        <div className='vessel-details-container'>
            <div>
                <label className="headerLabel">Vessel List</label>
            </div>
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
            </div>
            <div className="p-inputgroup" style={{ alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold', width: '50px' }}>Type: </label>
                <Dropdown
                    value={selectedVesselType}
                    options={vesselTypeOptions}
                    onChange={e => setSelectedVesselType(e.value)}
                    placeholder="Select Vessel Type"
                    style={{ width: '10px', height: '40px', verticalAlign: 'middle' }}
                    showClear
                />
            </div>
            <div>
                <DataTable
                    value={filteredVessels}
                    loading={isLoading}
                    selection={selectedVessels}
                    onSelectionChange={handleSelectionChange}
                    selectionMode="checkbox"
                    dataKey="vesselID"
                    scrollable scrollHeight="500px"
                    emptyMessage={isLoading ? 'Loading...' : 'No vessel found.'}
                    className="vessel-rank-list p-datatable-gridlines"
                    style={{ width: '100%' }}
                >
                    <Column field="vslCode" header="Code" sortable />
                    <Column field="vslName" header="Name" sortable bodyStyle={{ width: '400px' }} />
                    <Column field="vslType" header="Type" sortable bodyStyle={{ width: '100px' }} />
                    <Column field="vesselID" header="ID" sortable hidden={true} />
                </DataTable>
            </div>
        </div>
    );
};

export default DocumentVesselList;