import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './CompareVersion.scss';

type ManualFormProps = {
    onSubmit: (data: ManualFormData) => void;
    closeForm: () => void;
    selectedManualID: number;
};

export type ManualFormData = {
    DM_ManualVersionID_ToCompare: number;
};

const defaultData: ManualFormData = {
    DM_ManualVersionID_ToCompare: -1
};

const CompareVersion: React.FC<ManualFormProps> = ({ onSubmit, closeForm, selectedManualID }) => {
   const [form, setForm] = useState<ManualFormData>(defaultData);
   const [manualName, setManualName] = useState<string>('');
   const [currentVersion, setCurrentVersion] = useState<string>('');
   const [versionOptions, setVersionOptions] = useState<{ label: string; value: string }[]>([]);
   const [error, setError] = useState<string>('');

    useEffect(() => {
        dmsLifecycleService.apiCall(`DMS/GetManualVersionList?dm_ManualID=${selectedManualID}`, 'get')
            .then(data => {
                const options = data.map((cat: any) => ({
                    label: cat.version,
                    value: cat.dM_ManualVersionID
                }));
                setVersionOptions(options);
            })
            .catch(() => setVersionOptions([]));

          dmsLifecycleService.apiCall(`DMS/GetManualSimpleDetails/${selectedManualID}`, 'get')
            .then(data => {
                setManualName(data.manualName);
                setCurrentVersion(data.version);
            })
            .catch(() => setVersionOptions([]));
    }, [selectedManualID]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.DM_ManualVersionID_ToCompare === -1) {
            setError('Please select a version to compare.');
            return;
        }
        setError('');
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="compare-manual-form">
            <div style={{ color: 'red', height:'20px', marginLeft: '160px' }}>
                    {error}
            </div>
            <div style={{ marginBottom: '1px', width: '100%', flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '100%', flexDirection: 'column', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <label style={{ fontWeight: 'bold', width: '175px', textAlign: 'right' }}>Manual : &nbsp;</label>
                        <label className='selectedLabel'> {manualName}</label>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <label style={{ fontWeight: 'bold', width: '175px', textAlign: 'right' }}>Current Version : &nbsp;</label>
                        <label className='selectedLabel'> {currentVersion}</label>
                    </div>
                </div>
                <div className="d-flex justify-content-end" style={{ textAlign: 'right', marginRight: '60px', width: '100%' }}>
                    <button type="submit" className="button" style={{height: '67px'}}>Compare</button>
                    <button type="button" className="btn-gray btn-secondary ms-2" style={{height: '67px', width: '80px'}} onClick={closeForm}>Cancel
                    </button> &nbsp;&nbsp;&nbsp;
                </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                <div style={{ flex: 1, minWidth: '650px', textAlign: 'left' }}>
                    <div className="row" >
                        <div className="manual-form-group">
                            <label
                                style={{ width: '175px', flexShrink: 0, textAlign: 'right' }}>Version To Compare : &nbsp;</label>
                            <Dropdown
                                className="dropdown-compact"
                                value={form.DM_ManualVersionID_ToCompare}
                                options={versionOptions}
                                onChange={e => setForm(prev => ({ ...prev, DM_ManualVersionID_ToCompare: e.value }))}
                                placeholder="Select a Version"
                                style={{ width: '350px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default CompareVersion;