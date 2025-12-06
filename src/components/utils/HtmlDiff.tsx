import React from 'react';
import htmldiff from 'htmldiff-js';
import './HtmlDiff.scss';

interface HtmlDiffProps {
  oldHtml: string;
  newHtml: string;
}

const HtmlDiff: React.FC<HtmlDiffProps> = ({ oldHtml, newHtml }) => {
  const diff = htmldiff.execute(oldHtml, newHtml);
  return <div className="htmldiff-container" dangerouslySetInnerHTML={{ __html: diff }} />;
};

export default HtmlDiff;
