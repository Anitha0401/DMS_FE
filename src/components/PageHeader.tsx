import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { OverlayPanel } from 'primereact/overlaypanel';
import { SelectButton } from 'primereact/selectbutton';
import ChangePasswordDialog from './Account/ChangePasswordDialog';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';
import { COMPANY_NAME, ENV_LABEL } from '../config/appConfig';
import { MANUAL_LINK_VIEW_OPTIONS, useManualLinkView } from '../config/manualLinkView';
import './PageHeader.scss';
import './Features/Features.scss';

type PageHeaderProps = {
  title: string;
  /** Kept for compatibility; the logged-in user's name is shown instead. */
  subtitle?: string;
  subContent?: string | React.ReactNode;
  /** Kept for compatibility; the environment label now comes from REACT_APP_ENV_LABEL. */
  rightContent?: string;
  /** Page-level buttons shown on the right, e.g. "New circular". */
  actions?: React.ReactNode;
  /** Kept for compatibility; the main navigation is now shown on every page. */
  showDashboardButton?: boolean;
};

/** Main navigation, the same on every page. `match` decides which link is highlighted. */
const NAV_LINKS: { to: string; label: string; icon: string; match: (path: string, search: string) => boolean }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'pi pi-home', match: (p) => p.startsWith('/dashboard') },
  { to: '/manuals', label: 'Manuals', icon: 'pi pi-book', match: (p) => p.startsWith('/manuals') || p.startsWith('/main') },
  { to: '/circulars?cirmode=circulars', label: 'Circulars', icon: 'pi pi-megaphone',
    match: (p, s) => p.startsWith('/circulars') && !/cirmode=[a-z]*alerts/i.test(s) },
  { to: '/circulars?cirmode=alerts', label: 'Alerts', icon: 'pi pi-exclamation-triangle',
    match: (p, s) => p.startsWith('/circulars') && /cirmode=[a-z]*alerts/i.test(s) },
  { to: '/otherdocuments', label: 'Other docs', icon: 'pi pi-folder-open',
    match: (p) => p.startsWith('/otherdocuments') || p.startsWith('/folders') },
  { to: '/vessel-sync', label: 'Vessel sync', icon: 'pi pi-sync', match: (p) => p.startsWith('/vessel-sync') },
  { to: '/pending', label: 'Pending acks', icon: 'pi pi-clock', match: (p) => p.startsWith('/pending') },
  { to: '/suggestions', label: 'Suggestions', icon: 'pi pi-comments', match: (p) => p.startsWith('/suggestions') },
];

/** one word -> first two letters. */
const initials = (name?: string) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** One header for every page: logo, page title, navigation, page actions, user menu. */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subContent, actions }) => {
  const { theme, setTheme, themeOptions } = useTheme();
  const user = authService.currentUser();
  const { pathname, search } = useLocation();
  const path = pathname.toLowerCase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [manualLinkView, setManualLinkView] = useManualLinkView();
  const settingsRef = useRef<OverlayPanel>(null);
  const userMenuRef = useRef<Menu>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Header search box: Enter opens the Search page. On that page it shows the current query.
  const onSearchPage = path.startsWith('/search');
  const [query, setQuery] = useState(onSearchPage ? searchParams.get('q') ?? '' : '');
  useEffect(() => {
    if (onSearchPage) setQuery(searchParams.get('q') ?? '');
  }, [onSearchPage, searchParams]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    const types = onSearchPage ? searchParams.get('types') : null;
    navigate(`/search?q=${encodeURIComponent(q)}${types ? `&types=${encodeURIComponent(types)}` : ''}`);
  };

  const userMenu = [
    { label: user?.userName || user?.userId || '', disabled: true, className: 'header-user-menu-name' },
    { separator: true },
    { label: 'Change password', icon: 'pi pi-key', command: () => setChangePasswordOpen(true) },
    { label: 'Log out', icon: 'pi pi-sign-out', command: () => authService.logout() },
  ];

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

      <nav className="header-nav" aria-label="Main">
        {NAV_LINKS.map((link) => {
          const active = link.match(path, search);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={() => 'header-nav-link' + (active ? ' active' : '')}
              aria-current={active ? 'page' : undefined}
              title={link.label}
            >
              <i className={link.icon} aria-hidden="true" />
              <span className="header-nav-text">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <form className="header-search" role="search" onSubmit={submitSearch}>
        <i className="pi pi-search" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search…"
          aria-label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={200}
        />
      </form>

      <div className="header-right">
        {actions && <div className="header-actions">{actions}</div>}
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
            <span className="setting-label" id="theme-label">Theme</span>
            <Dropdown
              value={theme}
              options={themeOptions}
              onChange={(e) => setTheme(e.value)}
              optionLabel="label"
              optionValue="value"
              className="theme-selector"
              aria-labelledby="theme-label"
              appendTo="self"
            />
          </div>
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
          <button
            type="button"
            className="header-user-button"
            onClick={(e) => userMenuRef.current?.toggle(e)}
            aria-haspopup="menu"
            title="Account"
          >
            <span className="header-avatar" aria-hidden="true">{initials(user?.userName)}</span>
            <span className="header-user-name">
              {user?.userName ?? ''}
              {ENV_LABEL && <span className="env-badge">{ENV_LABEL}</span>}
            </span>
            <i className="pi pi-angle-down header-user-caret" aria-hidden="true" />
          </button>
          <Menu model={userMenu} popup ref={userMenuRef} className="header-user-menu" />
          <button
            type="button"
            className="header-logout"
            onClick={() => authService.logout()}
            title="Log out"
          >
            <i className="pi pi-sign-out" aria-hidden="true" />
            <span className="header-logout-text">Log out</span>
          </button>
        </div>
      </div>
      <ChangePasswordDialog visible={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </header>
  );
};

export default PageHeader;
