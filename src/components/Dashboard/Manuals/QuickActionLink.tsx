import React from 'react';

interface QuickActionLinkProps {
    title: string;
    desc: string;
    icon: string;
}

const QuickActionLink: React.FC<QuickActionLinkProps> = ({ title, desc, icon }) => {
    // Simple link component
    return (
        <div className="action-link">
            <i className={icon}></i>
            <strong>{title}</strong>
            <p>{desc}</p>
        </div>
    );
};

export default QuickActionLink;