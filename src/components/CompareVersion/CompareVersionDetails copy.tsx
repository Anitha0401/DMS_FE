import React, { useState, useEffect, useRef } from 'react';
import dmsLifecycleService from '../../services/DMSLifecycleService';
import './CompareVersionDetails.scss';

// import ReactDiffViewer from 'react-diff-viewer';
// import Prism from 'prismjs';
// import 'prismjs/components/prism-javascript';
// import 'prismjs/themes/prism.css';

type ManualFormProps = {
    closeForm: () => void;
    manualID: number
    DM_ManualVersionID_ToCompare: number;
};

const CompareVersionDetailss: React.FC<ManualFormProps> = ({ closeForm, manualID, DM_ManualVersionID_ToCompare }) => {
    const [currentVersion, setCurrentVersion] = useState<string>('');
    const [currentText, setCurrentText] = useState<string>('');
    const [compareVersion, setCompareVersion] = useState<string>('');
    const [compareText, setCompareText] = useState<string>('');

    useEffect(() => {
      const fetchData = async() => {
        dmsLifecycleService.apiCall(`DMS/GetCompareVersion_Content?dm_ManualID=${manualID}&compare_ManualVersionID=${DM_ManualVersionID_ToCompare}`, 'get')
            .then(data => {
                setCurrentVersion(data.current_Version);
                setCurrentText(data.current_ManualContent);
                setCompareVersion(data.compare_Version);
                setCompareText(data.compare_ManualContent);
            })
            .catch(() => {
                setCurrentVersion('');
                setCurrentText('');
                setCompareVersion('');
                setCompareText('');
            });
        }

        fetchData();
    }, [DM_ManualVersionID_ToCompare]);

    const syntaxHighlight = (str :any) => {
      if (!str) return;
      // const language = Prism.highlight(str, Prism.languages.javascript,  'js');
      // return <span dangerouslySetInnerHTML={{ __html: language }} />;
    };

    return (
        <div className="compare-version-details">
            <div style={{ marginBottom: '1px', width: '100%',  flexDirection: 'column', display: 'flex', justifyContent: 'space-between' }}>
               <div style={{flexDirection : 'row', display:'flex', width:'100%'}}>
                  <div style={{flexDirection:'row'}}>
                     <label className='selectedText'>
                    Compare Version :
                    </label>
                    <span style={{ width:'450px', fontWeight: 'bold', fontSize: 18, fontStyle:'bold', marginLeft: 8, display:'inline-block' }}> 
                      {compareVersion}
                    </span>

                    <label className='selectedText' style={{ textAlign:'right'}}>
                    Current Version :
                    </label>
                    <span style={{width: '350px', fontWeight: 'bold', fontSize: 18, fontStyle:'bold', marginLeft: 8, display:'inline-block' }}> 
                    {currentVersion}
                    </span>
                 
                 
                    <button style={{alignItems:'right'}} onClick={closeForm}>Close</button>
                  </div>
               </div>
                <div style={{ height: '620px', overflowY: 'auto', border:'1.5px solid #251414' }} >
                    {/* <ReactDiffViewer
                      oldValue={compareText} 
                      newValue={currentText} 
                      renderContent={syntaxHighlight}
                      splitView={true} 
                    /> */}
                </div>
            </div>
        </div>
    );
};

export default CompareVersionDetailss;