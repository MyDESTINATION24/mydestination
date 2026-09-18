import React from 'react';

// Homepage card rows (Blogs, Articles, CMS sections). The grid used to be a
// fixed three columns, so when an admin set "cards shown on homepage" to 4 the
// fourth card wrapped onto a lonely second row. Columns now follow the card
// count: up to four sit in one row on desktop; more than four become a single
// horizontally scrolling row instead of wrapping.
const CardRow = ({ count, children }) => {
  const n = Math.max(1, Number(count) || 1);

  if (n <= 4) {
    return (
      <div
        className="grid grid-cols-1 gap-6 md:gap-8 md:[grid-template-columns:repeat(var(--cols-md),minmax(0,1fr))] lg:[grid-template-columns:repeat(var(--cols-lg),minmax(0,1fr))]"
        style={{ '--cols-md': n === 4 ? 2 : n, '--cols-lg': n }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 [&>*]:shrink-0 [&>*]:snap-start [&>*]:w-[82%] sm:[&>*]:w-[46%] lg:[&>*]:w-[calc((100%-4.5rem)/4)]">
      {children}
    </div>
  );
};

export default CardRow;
