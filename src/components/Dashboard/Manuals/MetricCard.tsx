import React from 'react';

interface MetricCardProps {
    number: number | string;
    label: string;
    subtext?: string;
    icon?: string;
    css?: string;
    color?: string;
    isAction?: boolean;
    action?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ number, label, subtext, icon, css, color, isAction, action }) => {
    const cardClass = `stat-card ${css} ${isAction ? 'action-required-card' : ''}`;
    const iconClass = `${icon} icon-${color}`;

    return (
        <div
            className={`${cardClass}${action ? ' is-clickable' : ''}`}
            onClick={action}
            role={action ? 'button' : undefined}
            tabIndex={action ? 0 : undefined}
            onKeyDown={action ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); } } : undefined}
        >
            <div className="stat-content">
                <div className="stat-icon">
                    <i className={iconClass}></i>
                </div>
                <div className="stat-details">
                    <div className="stat-number">{number}</div>
                    <div className="stat-label">{label}</div>
                </div>
            </div>
            <div className="stat-footer">
                <span className="stat-description">{subtext}</span>
            </div>
            {isAction && <div className="card-indicator"></div>}
        </div>
    );
};

export default MetricCard;