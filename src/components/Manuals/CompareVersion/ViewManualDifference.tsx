import React from 'react';
import './CompareVersionDetails.scss';
import HtmlDiff from '../../utils/HtmlDiff';

type ManualFormProps = {
    closeForm: () => void;
    compareText: string;
    currentText: string;
};

const ViewManualDifference: React.FC<ManualFormProps> = ({ closeForm, compareText, currentText }) => {

    return (
        <div className="compare-version-details">
            <div style={{ marginBottom: '1px', width: '100%', flexDirection: 'column', display: 'flex' }}>
                <div style={{ height: '100%', overflowY: 'auto', border: '1.5px solid #251414' }}>
                    <HtmlDiff oldHtml={compareText} newHtml={currentText} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <button className="button" onClick={closeForm}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ViewManualDifference;