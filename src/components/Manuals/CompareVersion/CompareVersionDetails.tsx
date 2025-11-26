import React, { useState, useEffect } from 'react';
import * as Diff from 'diff';
import DOMPurify from 'dompurify';
import dmsLifecycleService from '../../../services/DMSLifecycleService';
import './CompareVersionDetails.scss';

type ManualFormProps = {
    closeForm: () => void;
    manualID: number;
    DM_ManualVersionID_ToCompare: number;
};

const CompareVersionDetails: React.FC<ManualFormProps> = ({ closeForm, manualID, DM_ManualVersionID_ToCompare }) => {
    const [currentVersion, setCurrentVersion] = useState<string>('');
    const [compareVersion, setCompareVersion] = useState<string>('');
    const [diffResult, setDiffResult] = useState<Diff.Change[]>([]);

    const formatHTMLForDisplay = (htmlContent: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        return tempDiv.innerText;
    };

    const renderDiff = (changes: Diff.Change[]) => {
        const diffStyles = {
            removed: {
                backgroundColor: '#ffd7d5',
                textDecoration: 'line-through',
                color: '#b31d28',
                display: 'inline',
            },
            added: {
                backgroundColor: '#cdffd8',
                color: '#22863a',
                display: 'inline',
            },
            unchanged: {
                color: '#24292e',
                display: 'inline'
            },
            diffLine: {
                display: 'flex',
                width: '100%',
                marginBottom: '8px'
            },
            diffPanel: {
                flex: 1,
                padding: '10px 20px',
                backgroundColor: '#f6f8fa',
                overflowX: 'auto' as React.CSSProperties['overflowX'],
                whiteSpace: 'nowrap' as const
            }
        };

        // Group changes by lines for side-by-side comparison
        const leftContent = changes.map((part, index) => {
            if (part.removed || !part.added) {
                return (
                    <span key={index} style={part.removed ? diffStyles.removed : diffStyles.unchanged}>
                        {formatHTMLForDisplay(part.value)}
                    </span>
                );
            }
            return null;
        });

        const rightContent = changes.map((part, index) => {
            if (part.added || !part.removed) {
                return (
                    <span key={index} style={part.added ? diffStyles.added : diffStyles.unchanged}>
                        {formatHTMLForDisplay(part.value)}
                    </span>
                );
            }
            return null;
        });

        return (
            <div style={{ display: 'flex', width: '100%' }}>
                <div style={{ ...diffStyles.diffPanel, borderRight: '1px solid #e1e4e8' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#24292e', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px' }}>
                        Compare Version : {compareVersion}
                    </h3>
                    <div className="diff-content">
                        {leftContent}
                    </div>
                </div>
                <div style={diffStyles.diffPanel}>
                    <h3 style={{ fontSize: '1.25rem', color: '#24292e', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px' }}>
                        Current Version : {currentVersion}
                    </h3>
                    <div className="diff-content">
                        {rightContent}
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
      const fetchData = async() => {
        dmsLifecycleService.getApiCall(`DMS/GetCompareVersion_Content?dm_ManualID=${manualID}&compare_ManualVersionID=${DM_ManualVersionID_ToCompare}`)
            .then(data => {
                setCurrentVersion(data.current_Version);
                setCompareVersion(data.compare_Version);
                
                // Calculate diff on the HTML content
                const diff = Diff.diffWords(
                    data.compare_ManualContent,
                    data.current_ManualContent
                );
                setDiffResult(diff);
            })
            .catch(() => {
                setCurrentVersion('');
                setCompareVersion('');
            });
        }

        fetchData();
    }, [DM_ManualVersionID_ToCompare, manualID]);

    const sanitizeAndRenderHTML = (content: string) => {
        // Sanitize HTML content for security
        const sanitizedContent = DOMPurify.sanitize(content);
        return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
    };

    return (
        <div className="compare-version-details">
            <div style={{ marginBottom: '1px', width: '100%', flexDirection: 'column', display: 'flex' }}>
                <div style={{ height: '100%', overflowY: 'auto', border: '1.5px solid #251414' }}>
                    {renderDiff(diffResult)}
                </div>
            </div>
        </div>
    );
};

export default CompareVersionDetails;