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
        <div
            className={`action-item is-clickable ${count > 0 ? 'has-action' : ''}`}
            onClick={action}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); } }}
        >
            <div className={cardClass}>
                <i className={icon}></i>
            </div>
            <div className="action-content">
                <div className="action-title">{text}</div>
                <div className="action-count">{count} {subtext}</div>
            </div>
            {count > 0 && <div className="action-badge">{count}</div>}
        </div>      
    );
};

export default ActionItem;