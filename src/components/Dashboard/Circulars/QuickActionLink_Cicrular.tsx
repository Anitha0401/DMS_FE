import React from 'react';

interface QuickActionLinkProps {
    title: string;
    desc: string;
    icon: string;
}

const QuickActionLink_Cicrular: React.FC<QuickActionLinkProps> = ({ title, desc, icon }) => {
    return (
        <div className="action-link">
            <i className={icon}></i>
            <strong>{title}</strong>
            <p>{desc}</p>
        </div>
    );
};

export default QuickActionLink_Cicrular;