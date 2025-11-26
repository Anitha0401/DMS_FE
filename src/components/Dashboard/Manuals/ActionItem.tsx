import React from 'react';

interface ActionItemProps {
    count: number;
    text: string;
    subtext?: string;
    icon?: string;
    css?: string;
    action: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({count,  text, subtext, icon, css, action }) => {
  
    const cardClass = `action-icon ${css}`

    return (
        <div className={`action-item ${count > 0 ? 'has-action' : ''}`}>
            <div className={cardClass}>
                <i className={icon}></i>
            </div>
            <div className="action-content">
                <div
                    className="action-title"
                    onClick={action}
                    style={{ 
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    {text}
                </div>
                <div className="action-count">{count} {subtext}</div>
            </div>
            {count > 0 && <div className="action-badge">{count}</div>}
        </div>      
    );
};

export default ActionItem;