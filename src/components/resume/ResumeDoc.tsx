import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Resume } from '../../types/resume';
import { pageGeometry } from '../../lib/units';
import {
  type Block,
  buildDoc,
  docClassName,
  docStyle,
  getEffective,
} from './blocks';

export interface PageLayout {
  pageIndex: number;
  header: React.ReactNode | null;
  mainBlocks: Block[];
  sideBlocks: Block[];
}

interface ResumeDocProps {
  resume: Resume;
  /** When true, renders an invisible measurer to calculate exact page breaks */
  onPageCountChange?: (count: number) => void;
  /** Force all blocks onto continuous pages without measurement delays if specified */
  isMeasuring?: boolean;
}

export const ResumeDoc: React.FC<ResumeDocProps> = ({
  resume,
  onPageCountChange,
}) => {
  const effective = useMemo(() => getEffective(resume), [resume]);
  const geom = useMemo(() => pageGeometry(resume), [resume]);
  const built = useMemo(() => buildDoc(resume, effective), [resume, effective]);

  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageLayout[]>([
    {
      pageIndex: 0,
      header: built.header,
      mainBlocks: built.blocks.filter((b) => b.col === 'main'),
      sideBlocks: built.blocks.filter((b) => b.col === 'side'),
    },
  ]);

  // Layout calculation
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    // Measure header
    const headerEl = el.querySelector<HTMLElement>('[data-measurer-header]');
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;

    // Measure blocks
    const blockEls = el.querySelectorAll<HTMLElement>('[data-block-key]');
    const heightMap = new Map<string, number>();
    blockEls.forEach((b) => {
      const key = b.getAttribute('data-block-key');
      if (key) {
        heightMap.set(key, b.offsetHeight);
      }
    });

    const isTwoCol = effective.columns === 2;
    const contentH = geom.contentHeight;

    // We pack blocks into pages
    const computedPages: PageLayout[] = [];
    let curPageIndex = 0;

    let curMainHeight = 0;
    let curHeader: React.ReactNode | null = built.header;

    // Available space on current page
    const getAvailMain = (isPage0: boolean) =>
      contentH - (isPage0 && curHeader ? headerHeight + effective.sectionGap : 0);
    const getAvailSide = (isPage0: boolean) =>
      contentH - (isPage0 && !effective.splitHeader && curHeader ? headerHeight + effective.sectionGap : 0);

    let curMainBlocks: Block[] = [];
    let curSideBlocks: Block[] = [];

    // Helper to push page
    const pushCurrentPage = () => {
      computedPages.push({
        pageIndex: curPageIndex,
        header: curHeader,
        mainBlocks: curMainBlocks,
        sideBlocks: curSideBlocks,
      });
      curPageIndex++;
      curHeader = null; // only on first page
      curMainBlocks = [];
      curSideBlocks = [];
      curMainHeight = 0;
    };

    // Main blocks
    const allMain = built.blocks.filter((b) => b.col === 'main');
    const allSide = built.blocks.filter((b) => b.col === 'side');

    if (!isTwoCol) {
      for (let i = 0; i < allMain.length; i++) {
        const b = allMain[i];
        const h = heightMap.get(b.key) || 30;
        const gap = curMainBlocks.length === 0 ? 0 : b.gap;
        const needed = h + gap;

        // Check keepWithNext (for headings)
        let totalNeeded = needed;
        if (b.keepWithNext && i + 1 < allMain.length) {
          const nextB = allMain[i + 1];
          const nextH = heightMap.get(nextB.key) || 30;
          totalNeeded += nextH + nextB.gap;
        }

        const maxAvail = getAvailMain(curPageIndex === 0);

        if (curMainHeight + totalNeeded > maxAvail && curMainBlocks.length > 0) {
          pushCurrentPage();
        }

        curMainBlocks.push(b);
        curMainHeight += (curMainBlocks.length === 1 ? 0 : b.gap) + h;
      }

      pushCurrentPage();
    } else {
      // Two-column layout distribution
      // Distribute main column
      const mainPages: Block[][] = [[]];
      let pIdx = 0;
      let pHeight = 0;

      for (let i = 0; i < allMain.length; i++) {
        const b = allMain[i];
        const h = heightMap.get(b.key) || 30;
        const gap = mainPages[pIdx].length === 0 ? 0 : b.gap;
        const needed = h + gap;

        let totalNeeded = needed;
        if (b.keepWithNext && i + 1 < allMain.length) {
          const nextB = allMain[i + 1];
          const nextH = heightMap.get(nextB.key) || 30;
          totalNeeded += nextH + nextB.gap;
        }

        const maxAvail = getAvailMain(pIdx === 0);
        if (pHeight + totalNeeded > maxAvail && mainPages[pIdx].length > 0) {
          pIdx++;
          mainPages[pIdx] = [];
          pHeight = 0;
        }

        mainPages[pIdx].push(b);
        pHeight += (mainPages[pIdx].length === 1 ? 0 : b.gap) + h;
      }

      // Distribute side column
      const sidePages: Block[][] = [[]];
      let sIdx = 0;
      let sHeight = 0;

      for (let i = 0; i < allSide.length; i++) {
        const b = allSide[i];
        const h = heightMap.get(b.key) || 30;
        const gap = sidePages[sIdx].length === 0 ? 0 : b.gap;
        const needed = h + gap;

        let totalNeeded = needed;
        if (b.keepWithNext && i + 1 < allSide.length) {
          const nextB = allSide[i + 1];
          const nextH = heightMap.get(nextB.key) || 30;
          totalNeeded += nextH + nextB.gap;
        }

        const maxAvail = getAvailSide(sIdx === 0);
        if (sHeight + totalNeeded > maxAvail && sidePages[sIdx].length > 0) {
          sIdx++;
          sidePages[sIdx] = [];
          sHeight = 0;
        }

        sidePages[sIdx].push(b);
        sHeight += (sidePages[sIdx].length === 1 ? 0 : b.gap) + h;
      }

      const totalPageCount = Math.max(mainPages.length, sidePages.length, 1);
      for (let p = 0; p < totalPageCount; p++) {
        computedPages.push({
          pageIndex: p,
          header: p === 0 ? built.header : null,
          mainBlocks: mainPages[p] || [],
          sideBlocks: sidePages[p] || [],
        });
      }
    }

    setPages(computedPages);
    if (onPageCountChange) {
      onPageCountChange(computedPages.length);
    }
  }, [resume, built, geom, effective, onPageCountChange]);

  const style = useMemo(() => docStyle(resume, effective), [resume, effective]);
  const cls = useMemo(() => docClassName(effective), [effective]);

  return (
    <>
      {/* Hidden layout measurer */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className={cls}
        style={{
          ...style,
          position: 'absolute',
          left: -99999,
          top: 0,
          width: geom.width,
          padding: `${geom.margins.top}px ${geom.margins.right}px ${geom.margins.bottom}px ${geom.margins.left}px`,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {built.header && <div data-measurer-header>{built.header}</div>}
        <div style={{ display: effective.columns === 2 ? 'grid' : 'block', gridTemplateColumns: effective.columns === 2 ? (effective.sidebar === 'left' ? '32% 1fr' : '1fr 32%') : undefined, gap: 24 }}>
          {effective.columns === 2 && effective.sidebar === 'left' && (
            <div>
              {built.blocks
                .filter((b) => b.col === 'side')
                .map((b) => (
                  <div key={b.key} data-block-key={b.key} style={{ marginTop: b.gap }}>
                    {b.el}
                  </div>
                ))}
            </div>
          )}
          <div>
            {built.blocks
              .filter((b) => b.col === 'main')
              .map((b) => (
                <div key={b.key} data-block-key={b.key} style={{ marginTop: b.gap }}>
                  {b.el}
                </div>
              ))}
          </div>
          {effective.columns === 2 && effective.sidebar === 'right' && (
            <div>
              {built.blocks
                .filter((b) => b.col === 'side')
                .map((b) => (
                  <div key={b.key} data-block-key={b.key} style={{ marginTop: b.gap }}>
                    {b.el}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Rendered pages */}
      <div className="rf-pages-container flex flex-col items-center gap-8 py-6">
        {pages.map((page, idx) => (
          <div key={page.pageIndex} className="rf-page-wrapper relative group">
            {/* Page number badge */}
            <div className="absolute -top-6 left-2 text-xs font-semibold tracking-wide text-slate-500 uppercase select-none flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500 inline-block"></span>
              Page {idx + 1} of {pages.length}
            </div>

            {/* Document sheet */}
            <div
              className={`${cls} rf-page shadow-page border border-slate-200/80 bg-white transition-all`}
              data-page-index={idx}
              data-page-size={resume.layout.pageSize}
              style={{
                ...style,
                width: `${geom.width}px`,
                height: `${geom.height}px`,
                padding: `${geom.margins.top}px ${geom.margins.right}px ${geom.margins.bottom}px ${geom.margins.left}px`,
              }}
            >
              {/* Optional sidebar background for two-column template */}
              {effective.sideBg && (
                <div
                  className="rf-side-bg"
                  style={{
                    left: effective.sidebar === 'left' ? 0 : 'auto',
                    right: effective.sidebar === 'right' ? 0 : 'auto',
                    width: `calc(32% + ${effective.sidebar === 'left' ? geom.margins.left : geom.margins.right}px)`,
                  }}
                />
              )}

              {/* Page header (if any on this page) */}
              {page.header && <div className="mb-4">{page.header}</div>}

              {/* Page content */}
              {effective.columns === 1 ? (
                <div className="rf-main-col">
                  {page.mainBlocks.map((b, bIdx) => (
                    <div key={b.key} className="rf-block" style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                      {b.el}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rf-columns-grid relative z-10"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: effective.sidebar === 'left' ? '30% 1fr' : '1fr 30%',
                    gap: '24px',
                    height: '100%',
                  }}
                >
                  {effective.sidebar === 'left' ? (
                    <>
                      <div className="rf-col rf-side">
                        {page.sideBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                            {b.el}
                          </div>
                        ))}
                      </div>
                      <div className="rf-col rf-main">
                        {page.mainBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                            {b.el}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rf-col rf-main">
                        {page.mainBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                            {b.el}
                          </div>
                        ))}
                      </div>
                      <div className="rf-col rf-side">
                        {page.sideBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                            {b.el}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
