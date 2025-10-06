import React from 'react';
import './PageHeader.scss';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, rightContent }) => {
   return (
    <div className="header-bar">
          <div className="header-left">
            <img src="/logo.png" alt="Company Logo" className="logo1" />
            <span className="header-title">{title}</span>
          </div>
          <div className="header-right" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            {subtitle && <span className="header-subtitle">{subtitle}</span>}
            <div style={{flexDirection: 'row', alignItems: 'center'}}>
               {rightContent && <span className="header-subtitle1"> ( {rightContent} )</span>}
               <a href='' className="href">Logout</a>
            </div>
         </div>
    </div>
  );
};

export default PageHeader;
