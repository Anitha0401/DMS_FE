import React from 'react';

interface QuickActionLinkProps {
    title: string;
    desc: string;
    icon: string;
    action: () => void;
}

const QuickActionLink: React.FC<QuickActionLinkProps> = ({ title, desc, icon, action }) => {
    return (
        <div 
            className="action-link"
            onClick={action}
        >
            <i className={icon}></i>
            <strong>{title}</strong>
            <p>{desc}</p>
        </div>
    );
};

export default QuickActionLink;