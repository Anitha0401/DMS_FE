import React from 'react';

interface ActionItemProps {
    count: number;
    text: string;
    subtext?: string;
    icon?: string;
    css?: string;
}

const ActionItem_Cicrular: React.FC<ActionItemProps> = ({count,  text, subtext, icon, css }) => {
  
    const cardClass = `action-icon ${css}`

    return (
        <div>
             <div className={`action-item ${count > 0 ? 'has-action' : ''}`}>
                <div className={cardClass}>
                    <i className={icon}></i>
                    {/* <i className="pi pi-check-circle"></i> */}
                </div>
                <div className="action-content">
                    <div className="action-title">{text}</div>
                    <div className="action-count">{count} {subtext}</div>
                </div>
                {count > 0 && <div className="action-badge">{count}</div>}
            </div>
        </div>
    );
};

export default ActionItem_Cicrular;