import React, { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { OverlayPanel } from 'primereact/overlaypanel';
import { SelectButton } from 'primereact/selectbutton';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';
import { COMPANY_NAME, ENV_LABEL } from '../config/appConfig';
import { MANUAL_LINK_VIEW_OPTIONS, useManualLinkView } from '../config/manualLinkView';
import './PageHeader.scss';

type PageHeaderProps = {
  title: string;
  /** Kept for compatibility; the logged-in user's name is shown instead. */
  subtitle?: string;
  subContent?: string | React.ReactNode;
  /** Kept for compatibility; the environment label now comes from REACT_APP_ENV_LABEL. */
  rightContent?: string;
  /** Page-level buttons shown on the right, e.g. "New circular". */
  actions?: React.ReactNode;
  /** Show the "Go to Dashboard" link. Default: on every page except the dashboard. */
  showDashboardButton?: boolean;
};

/** One header for every page: logo, page title, navigation, page actions, user menu. */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subContent, actions, showDashboardButton }) => {
  const { theme, setTheme, themeOptions } = useTheme();
  const user = authService.currentUser();
  const { pathname } = useLocation();
  const showDashboardLink = showDashboardButton ?? !pathname.toLowerCase().startsWith('/dashboard');
  const [manualLinkView, setManualLinkView] = useManualLinkView();
  const settingsRef = useRef<OverlayPanel>(null);

  return (
    <header className="header-bar">
      <div className="header-left">
        <img src="/logo.png" alt={`${COMPANY_NAME} logo`} className="logo1" />
        <div className="header-titles">
          <span className="header-company">{COMPANY_NAME}</span>
          <h1 className="header-title">{title}</h1>
          {subContent && <div className="header-subcontent-text">{subContent}</div>}
        </div>
      </div>

      {showDashboardLink && (
        <nav className="header-nav" aria-label="Main">
          <NavLink to="/dashboard" className="header-nav-link">
            <i className="pi pi-arrow-left" /> Go to Dashboard
          </NavLink>
        </nav>
      )}

      <div className="header-right">
        {actions && <div className="header-actions">{actions}</div>}
        <Dropdown
          value={theme}
          options={themeOptions}
          onChange={(e) => setTheme(e.value)}
          optionLabel="label"
          optionValue="value"
          className="theme-selector"
          aria-label="Theme"
        />
        <button
          type="button"
          className="header-settings"
          aria-label="Settings"
          title="Settings"
          onClick={(e) => settingsRef.current?.toggle(e)}
        >
          <i className="pi pi-cog" />
        </button>
        <OverlayPanel ref={settingsRef} className="header-settings-panel">
          <h3>Settings</h3>
          <div className="setting-row">
            <span className="setting-label" id="manual-link-view-label">Manual links open as</span>
            <SelectButton
              value={manualLinkView}
              options={MANUAL_LINK_VIEW_OPTIONS}
              onChange={(e) => e.value && setManualLinkView(e.value)}
              aria-labelledby="manual-link-view-label"
            />
            <small className="setting-help">
              {manualLinkView === 'tree'
                ? 'The Manuals tree shows only the matching manuals.'
                : 'The matching manuals show as a list in place of the tree.'}
            </small>
          </div>
        </OverlayPanel>
        <div className="header-user">
          <span className="header-user-name">
            <i className="pi pi-user" /> {user?.userName ?? ''}
            {ENV_LABEL && <span className="env-badge">{ENV_LABEL}</span>}
          </span>
          <button type="button" className="header-logout" onClick={() => authService.logout()}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
