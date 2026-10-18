import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import PageHeader from '../PageHeader';
import featureApi, { ITEM_ICONS, itemLink, SearchHit } from '../../services/featureApi';
import { errorMessage } from '../../services/DMSLifecycleService';
import { formatDate } from '../utils/formatDate';
import './Features.scss';

const TYPES = [
    { label: 'Manuals', value: 'Manual' },
    { label: 'Circulars & alerts', value: 'Circular' },
    { label: 'Documents & certificates', value: 'Document' },
    { label: 'Suggestions', value: 'Suggestion' },
];

const GROUP_ORDER = ['Manual', 'Circular', 'Alert', 'Certificate', 'Document', 'Suggestion'];
const GROUP_TITLE: Record<string, string> = {
    Manual: 'Manuals', Circular: 'Circulars', Alert: 'Alerts', Certificate: 'Certificates', Document: 'Documents',
    Suggestion: 'Suggestions',
};

/** Feature 8 (phase 1): one search over manuals, circulars, documents, suggestions and folder files. */
const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') ?? '';
    const [text, setText] = useState(query);
    const [types, setTypes] = useState<string[]>(TYPES.map((t) => t.value));
    const [hits, setHits] = useState<SearchHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => setText(query), [query]);

    useEffect(() => {
        if (query.trim().length < 2) { setHits([]); return; }
        let alive = true;
        setLoading(true);
        setError(null);
        featureApi.search(query, types.length === TYPES.length ? null : types.join(','))
            .then((h) => { if (alive) setHits(h); })
            .catch((err) => { if (alive) setError(errorMessage(err)); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [query, types]);

    const groups = useMemo(() => GROUP_ORDER
        .map((g) => ({ type: g, items: hits.filter((h) => h.itemType === g) }))
        .filter((g) => g.items.length > 0), [hits]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams(text.trim() ? { q: text.trim() } : {});
    };

    return (
        <div className="feature-page">
            <PageHeader title="Search" />
            <main className="feature-main">
                <form className="feature-toolbar" onSubmit={submit}>
                    <span className="p-input-icon-left" style={{ flex: '1 1 320px' }}>
                        <i className="pi pi-search" />
                        <InputText value={text} onChange={(e) => setText(e.target.value)} placeholder="Search manuals, circulars, documents, files…"
                            style={{ width: '100%' }} autoFocus />
                    </span>
                    <MultiSelect value={types} options={TYPES} onChange={(e) => setTypes(e.value)} placeholder="Everything" maxSelectedLabels={2} />
                    <Button type="submit" label="Search" icon="pi pi-search" loading={loading} />
                </form>

                <div className="feature-card">
                    {error && <div className="feature-empty"><i className="pi pi-exclamation-triangle" />{error}</div>}
                    {!error && !loading && query.trim().length >= 2 && hits.length === 0 && (
                        <div className="feature-empty"><i className="pi pi-search" />Nothing found for “{query}”.</div>
                    )}
                    {!error && query.trim().length < 2 && (
                        <div className="feature-empty"><i className="pi pi-search" />Type at least two letters. Every word must match.</div>
                    )}
                    {groups.map((g) => (
                        <section key={g.type} style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: '8px 0' }}><i className={ITEM_ICONS[g.type]} /> {GROUP_TITLE[g.type]} ({g.items.length})</h3>
                            {g.items.map((h) => {
                                const link = itemLink(h.itemType, h.itemID);
                                return (
                                    <div key={`${h.itemType}-${h.itemID}`} className="search-hit">
                                        <Link to={{ pathname: link.pathname, search: link.search }} state={link.state}>
                                            {h.number ? `${h.number} – ` : ''}{h.title || `${h.itemType} ${h.itemID}`}
                                        </Link>
                                        <div className="hit-meta">
                                            {h.date && <span>{formatDate(h.date)}</span>}
                                            {h.vesselID != null && h.vesselID > 0 && <span>Vessel {h.vesselID}</span>}
                                        </div>
                                        {h.snippet && <div className="hit-snippet">{h.snippet}</div>}
                                    </div>
                                );
                            })}
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default SearchPage;
