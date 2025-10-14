import React, { useEffect, useState } from 'react';
import VesselList from './VesselList';
import VesselRankList from './VesselRankList';
import HQUserList, { HQUser } from './HQUserList';
import './VesselDetails.scss';
import dmsLifecycleService from '../../services/DMSLifecycleService';

type VesselFormProps = {
    initialData?: VesselFormData;
    onSubmit: (data: VesselFormData) => void;
    closeForm: () => void;
    selectedAction: string;
    selectedManualID: number;
};

export type VesselFormData = {
    DM_ManualID: number;
    CalledMode: string;
    VesselIdList: number[];
    VesselRankList: string[];
    HQ_UsersIDList: number[];
};

const defaultData: VesselFormData = {
    DM_ManualID: -1,
    CalledMode: '',
    VesselIdList: [],
    VesselRankList: [],
    HQ_UsersIDList: []
};

export interface Vessel {
    vesselID: number;
    vslName: string;
    vslType: string;
}

export interface VesselRank {
    userRank: string;
    userDeptDisplay?: string;
    userDept?: string;
}

const VesselDetails: React.FC<VesselFormProps> = ({ initialData, onSubmit, closeForm, selectedAction, selectedManualID }) => {
    const [form, setForm] = useState<VesselFormData>(initialData || defaultData);
    const [vslRank, setVslRank] = useState<VesselRank[]>([]);
    const [vesselList, setVesselList] = useState<Vessel[]>([]);
    const [hqUser, setHqUser] = useState<HQUser[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await dmsLifecycleService.apiCall('DMS/GetManualRightsUsersAsync');
                setVesselList(data.vesselList);
                setVslRank(data.vslRankList);
                setHqUser(data.hqUserList);
            } catch {
                setVslRank([]);
                setVesselList([]);
                setHqUser([]);
            }
            
            if ((selectedAction === 'Edit' || selectedAction === 'View') && selectedManualID > 0) {
                try {
                    const data: any = await dmsLifecycleService.apiCall(`DMS/GetSelectedManualRightsList/${selectedManualID}`, 'get');
                 
                    setForm({
                        DM_ManualID: data.dM_ManualID ?? selectedManualID ?? -1,
                        CalledMode: selectedAction,
                        VesselIdList: data.vesselIdList ?? [],
                        VesselRankList: data.vesselRankList ?? [],
                        HQ_UsersIDList: data.hQ_UsersIDList ?? []
                    });
                } catch {
                }
            }
            else {
                setForm({
                    DM_ManualID: selectedManualID ?? -1,
                    CalledMode: selectedAction,
                    VesselIdList: [],
                    VesselRankList: [],
                    HQ_UsersIDList: []
                });
            }
        };
        fetchData();
    }, [selectedAction, selectedManualID]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    const handleVesselSelectionChange = (selected: any[]) => {
        const vesselIDs = selected.map(v => v.vesselID);
        setForm(prev => ({ ...prev, VesselIdList: vesselIDs }));
    };

    const handleVesselRankSelectionChange = (selected: any[]) => {
        const vslRank = selected.map(v => v.userRank);
        setForm(prev => ({ ...prev, VesselRankList: vslRank }));
    };

    const handleHQUserSelectionChange = (selected: any[]) => {
        const hqUser = selected.map(v => v.hQ_UsersID);
        setForm(prev => ({ ...prev, HQ_UsersIDList: hqUser }));
    };
    
    return (
        <form onSubmit={handleSubmit} className="vessel-details-form">
            <div style={{ marginBottom: '1px', width: '100%', flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
                <div className="d-flex justify-content-end" style={{ textAlign: 'right', width: '100%' }}>
                  {selectedAction !== 'View' && (
                        <button type="submit" className="button" style={{width: '100px', height: '40px'}}>
                            Save
                        </button>
                    )} 
                 <button type="button" className="button btn-secondary ms-2" onClick={closeForm}>
                        Cancel
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '25px', marginTop: '10px' }}>
                <div style={{ width: '500px' }}>
                    <VesselList
                        vessels={vesselList}
                        selectedVesselIdList={form.VesselIdList}
                        onSelectionChange={handleVesselSelectionChange}
                        isViewMode={selectedAction === 'View'}
                    />
                </div>
                <div style={{ width: '300px'}}>
                    <VesselRankList
                        vslRank={vslRank}
                        selectedVesselRankList={form.VesselRankList}
                        onSelectionChange={handleVesselRankSelectionChange}
                        isViewMode={selectedAction === 'View'}
                    />
                </div>
                <div style={{ width: '650px'}}>
                    <HQUserList
                        hqUser={hqUser}
                        selectedHQUserList={form.HQ_UsersIDList}
                        onSelectionChange={handleHQUserSelectionChange}
                        isViewMode={selectedAction === 'View'}
                    />
                </div>
            </div>
        </form>
    );
};

export default VesselDetails;