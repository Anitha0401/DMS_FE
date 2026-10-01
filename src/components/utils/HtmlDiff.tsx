import React from 'react';
import htmldiff from 'htmldiff-js';
import './HtmlDiff.scss';
import DOMPurify from 'dompurify';

interface HtmlDiffProps {
  oldHtml: string;
  newHtml: string;
}

const HtmlDiff: React.FC<HtmlDiffProps> = ({ oldHtml, newHtml }) => {
  const diff = htmldiff.execute(oldHtml, newHtml);
  return <div className="htmldiff-container" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(diff) }} />;
};

export default HtmlDiff;
