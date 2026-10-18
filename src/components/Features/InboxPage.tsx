import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { SelectButton } from 'primereact/selectbutton';
import PageHeader from '../PageHeader';
import featureApi, { InboxItem, ITEM_ICONS, itemLink } from '../../services/featureApi';
import { errorMessage } from '../../services/DMSLifecycleService';
import notify from '../../services/notify';
import { formatDateTime } from '../utils/formatDate';
import { notifyInboxChanged } from './useInboxCount';
import './Features.scss';

const TYPE_OPTIONS = [
    { label: 'All types', value: null },
    { label: 'Manuals', value: 'Manual' },
    { label: 'Circulars', value: 'Circular' },
    { label: 'Alerts', value: 'Alert' },
    { label: 'Documents', value: 'Document' },
    { label: 'Certificates', value: 'Certificate' },
    { label: 'Suggestions', value: 'Suggestion' },
];

const ACTION_TEXT: Record<string, string> = {
    New: 'New',
    Updated: 'New version',
    Cancelled: 'Cancelled',
    Expiring: 'Expiring soon',
    Expired: 'Expired',
};

const actionClass = (action: string) =>
    action === 'Cancelled' || action === 'Expired' || action === 'Rejected' ? 'bad'
        : action === 'Expiring' || action === 'NeedsInfo' ? 'warn'
        : action === 'New' || action === 'Submitted' ? 'new' : 'info';

/** Feature 2: new and changed items, like an e-mail inbox. */
const InboxPage: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<InboxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState<'all' | 'unread'>('unread');
    const [itemType, setItemType] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<InboxItem | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setItems(await featureApi.inbox.list(show === 'unread', itemType, search.trim() || null));
        } catch (err) {
            notify.error(errorMessage(err), 'Could not load the inbox');
        } finally {
            setLoading(false);
        }
    }, [show, itemType, search]);

    useEffect(() => {
        const t = window.setTimeout(load, 250);
        return () => window.clearTimeout(t);
    }, [load]);

    const setRead = async (item: InboxItem, read: boolean) => {
        try {
            await featureApi.inbox.markRead(item.dmS_InboxID, read);
            setItems((list) => list.map((i) => (i.dmS_InboxID === item.dmS_InboxID ? { ...i, isRead: read } : i)));
            setSelected((s) => (s && s.dmS_InboxID === item.dmS_InboxID ? { ...s, isRead: read } : s));
            notifyInboxChanged();
        } catch (err) {
            notify.error(errorMessage(err));
        }
    };

    const open = (item: InboxItem) => {
        setSelected(item);
        if (!item.isRead) setRead(item, true);
    };

    const markAll = async () => {
        try {
            await featureApi.inbox.markAllRead();
            notifyInboxChanged();
            await load();
        } catch (err) {
            notify.error(errorMessage(err));
        }
    };

    const goTo = (item: InboxItem) => {
        const link = itemLink(item.itemType, item.itemID);
        navigate({ pathname: link.pathname, search: link.search }, { state: link.state });
    };

    const unread = useMemo(() => items.filter((i) => !i.isRead).length, [items]);

    return (
        <div className="feature-page">
            <PageHeader title="Inbox" subContent={`${unread} unread`} />
            <main className="feature-main">
                <div className="feature-toolbar">
                    <SelectButton
                        value={show}
                        options={[{ label: 'Unread', value: 'unread' }, { label: 'All', value: 'all' }]}
                        onChange={(e) => e.value && setShow(e.value)}
                    />
                    <Dropdown value={itemType} options={TYPE_OPTIONS} onChange={(e) => setItemType(e.value)} placeholder="All types" />
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search titles" />
                    </span>
                    <span className="spacer" />
                    <Button label="Mark all as read" icon="pi pi-check" outlined onClick={markAll} disabled={unread === 0} />
                    <Button icon="pi pi-refresh" text aria-label="Refresh" onClick={load} />
                </div>

                <div className="inbox-layout">
                    <div className="feature-card inbox-list" aria-busy={loading}>
                        {!loading && items.length === 0 && (
                            <div className="feature-empty">
                                <i className="pi pi-inbox" />
                                {show === 'unread' ? 'Nothing new. You are up to date.' : 'No items.'}
                            </div>
                        )}
                        {items.map((item) => (
                            <div
                                key={item.dmS_InboxID}
                                className={`inbox-row${item.isRead ? '' : ' unread'}${selected?.dmS_InboxID === item.dmS_InboxID ? ' selected' : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => open(item)}
                                onKeyDown={(e) => { if (e.key === 'Enter') open(item); }}
                            >
                                <i className={`inbox-icon ${ITEM_ICONS[item.itemType] ?? 'pi pi-file'}`} />
                                <div>
                                    <div className="inbox-title">
                                        {!item.isRead && <span className="unread-dot" aria-label="Unread" />}
                                        {item.title || `${item.itemType} ${item.itemID}`}
                                    </div>
                                    <div className="inbox-meta">
                                        {item.itemType} · <span className={`feature-tag ${actionClass(item.action)}`}>{ACTION_TEXT[item.action] ?? item.action}</span>
                                    </div>
                                </div>
                                <span className="inbox-date">{formatDateTime(item.createdOn)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="feature-card inbox-reader">
                        {!selected ? (
                            <div className="feature-empty">
                                <i className="pi pi-envelope" />
                                Select an item to read it.
                            </div>
                        ) : (
                            <>
                                <span className={`feature-tag ${actionClass(selected.action)}`}>{ACTION_TEXT[selected.action] ?? selected.action}</span>
                                <h2>{selected.title || `${selected.itemType} ${selected.itemID}`}</h2>
                                <div className="reader-meta">
                                    <span><i className={ITEM_ICONS[selected.itemType] ?? 'pi pi-file'} /> {selected.itemType}</span>
                                    <span><i className="pi pi-clock" /> {formatDateTime(selected.createdOn)}</span>
                                    {selected.vesselID > 0 && <span><i className="pi pi-flag" /> Vessel {selected.vesselID}</span>}
                                </div>
                                <div className="reader-actions">
                                    <Button label={`Open ${selected.itemType.toLowerCase()}`} icon="pi pi-external-link" onClick={() => goTo(selected)} />
                                    <Button
                                        label={selected.isRead ? 'Mark as unread' : 'Mark as read'}
                                        icon={selected.isRead ? 'pi pi-envelope' : 'pi pi-check'}
                                        outlined
                                        onClick={() => setRead(selected, !selected.isRead)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default InboxPage;
