import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.scss';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  subContent? : string | React.ReactNode;
  rightContent?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, subContent, rightContent }) => {
   const navigate = useNavigate();
   return (
    <div className="header-bar">
          <div className="header-left">
            <img src="/logo.png" alt="Company Logo" className="logo1" />
            <span className="header-title">{title}</span>
          </div>
          <div className="header-right" style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            {subContent && <div className="header-subcontent">{subContent}</div>}
            <div className="header-subcontent">
             <button 
              className="dashboard-link-btn"
              onClick={() => navigate('/dashboard')}
              title="Go to Dashboard"
              style={{ marginRight: '10px', padding: '0.5rem 1rem', height: '42px' }}
            >
                <i className="pi pi-th-large"></i> &nbsp;
                Go to Dashboard
            </button>
            </div>
         </div>
          <div style={{flexDirection: 'column', alignItems: 'center'}}>
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
