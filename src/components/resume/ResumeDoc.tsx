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

/** Editor section a rendered block belongs to (block keys are `${sectionId}:…`; header blocks map to personal info). */
const sectionIdOfBlock = (key: string) =>
  key === 'identity' || key === 'sidecontact' ? 'personal' : key.split(':')[0];

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

  const isTwoCol = effective.columns === 2;
  const isSideBg = isTwoCol && effective.sideBg;
  const colGap = 24;

  const sidebarWidth = useMemo(
    () => (isSideBg ? Math.round(geom.width * 0.32) : Math.round(geom.contentWidth * 0.32)),
    [isSideBg, geom.width, geom.contentWidth]
  );

  const gridTemplateColumns = useMemo(
    () => (isTwoCol ? (effective.sidebar === 'left' ? `${sidebarWidth}px 1fr` : `1fr ${sidebarWidth}px`) : undefined),
    [isTwoCol, effective.sidebar, sidebarWidth]
  );

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
          padding: isSideBg
            ? 0
            : `${geom.margins.top}px ${geom.margins.right}px ${geom.margins.bottom}px ${geom.margins.left}px`,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {built.header && <div data-measurer-header>{built.header}</div>}
        <div
          style={{
            display: isTwoCol ? 'grid' : 'block',
            gridTemplateColumns,
            gap: isSideBg ? 0 : colGap,
          }}
        >
          {isTwoCol && effective.sidebar === 'left' && (
            <div
              className="rf-col rf-side"
              style={{
                paddingLeft: isSideBg ? 24 : 0,
                paddingRight: isSideBg ? 24 : 0,
                boxSizing: 'border-box',
              }}
            >
              {built.blocks
                .filter((b) => b.col === 'side')
                .map((b) => (
                  <div key={b.key} data-block-key={b.key} style={{ marginTop: b.gap }}>
                    {b.el}
                  </div>
                ))}
            </div>
          )}
          <div
            className="rf-col rf-main"
            style={{
              paddingLeft: isSideBg ? (effective.sidebar === 'left' ? 28 : geom.margins.left) : 0,
              paddingRight: isSideBg ? (effective.sidebar === 'left' ? geom.margins.right : 28) : 0,
              boxSizing: 'border-box',
            }}
          >
            {built.blocks
              .filter((b) => b.col === 'main')
              .map((b) => (
                <div key={b.key} data-block-key={b.key} style={{ marginTop: b.gap }}>
                  {b.el}
                </div>
              ))}
          </div>
          {isTwoCol && effective.sidebar === 'right' && (
            <div
              className="rf-col rf-side"
              style={{
                paddingLeft: isSideBg ? 24 : 0,
                paddingRight: isSideBg ? 24 : 0,
                boxSizing: 'border-box',
              }}
            >
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
              className={`${cls} rf-page shadow-page bg-white transition-all`}
              data-page-index={idx}
              data-page-size={resume.layout.pageSize}
              style={{
                ...style,
                width: `${geom.width}px`,
                height: `${geom.height}px`,
                padding: isSideBg
                  ? 0
                  : `${geom.margins.top}px ${geom.margins.right}px ${geom.margins.bottom}px ${geom.margins.left}px`,
              }}
            >
              {/* Page header (if any on this page) */}
              {page.header && (
                <div data-section="personal" style={{ marginBottom: effective.sectionGap }}>
                  {page.header}
                </div>
              )}

              {/* Page content */}
              {!isTwoCol ? (
                <div className="rf-main-col">
                  {page.mainBlocks.map((b, bIdx) => (
                    <div key={b.key} className="rf-block" data-section={sectionIdOfBlock(b.key)} style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                      {b.el}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rf-columns-grid relative z-10"
                  style={{
                    display: 'grid',
                    gridTemplateColumns,
                    gap: isSideBg ? 0 : `${colGap}px`,
                    width: '100%',
                    height: isSideBg ? '100%' : 'auto',
                    alignItems: 'start',
                  }}
                >
                  {effective.sidebar === 'left' ? (
                    <>
                      <div
                        className="rf-col rf-side"
                        style={{
                          background: isSideBg ? 'var(--rf-accent-soft)' : undefined,
                          paddingTop: isSideBg ? geom.margins.top : 0,
                          paddingBottom: isSideBg ? geom.margins.bottom : 0,
                          paddingLeft: isSideBg ? 24 : 0,
                          paddingRight: isSideBg ? 24 : 0,
                          boxSizing: 'border-box',
                          height: isSideBg ? '100%' : 'auto',
                        }}
                      >
                        {page.sideBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" data-section={sectionIdOfBlock(b.key)} style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                            {b.el}
                          </div>
                        ))}
                      </div>
                      <div
                        className="rf-col rf-main"
                        style={{
                          background: isSideBg ? '#ffffff' : undefined,
                          paddingTop: isSideBg ? geom.margins.top : 0,
                          paddingBottom: isSideBg ? geom.margins.bottom : 0,
                          paddingLeft: isSideBg ? 28 : 0,
                          paddingRight: isSideBg ? geom.margins.right : 0,
                          boxSizing: 'border-box',
                          height: isSideBg ? '100%' : 'auto',
                        }}
                      >
                        {page.mainBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" data-section={sectionIdOfBlock(b.key)} style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                            {b.el}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="rf-col rf-main"
                        style={{
                          background: isSideBg ? '#ffffff' : undefined,
                          paddingTop: isSideBg ? geom.margins.top : 0,
                          paddingBottom: isSideBg ? geom.margins.bottom : 0,
                          paddingLeft: isSideBg ? geom.margins.left : 0,
                          paddingRight: isSideBg ? 28 : 0,
                          boxSizing: 'border-box',
                          height: isSideBg ? '100%' : 'auto',
                        }}
                      >
                        {page.mainBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" data-section={sectionIdOfBlock(b.key)} style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
                            {b.el}
                          </div>
                        ))}
                      </div>
                      <div
                        className="rf-col rf-side"
                        style={{
                          background: isSideBg ? 'var(--rf-accent-soft)' : undefined,
                          paddingTop: isSideBg ? geom.margins.top : 0,
                          paddingBottom: isSideBg ? geom.margins.bottom : 0,
                          paddingLeft: isSideBg ? 24 : 0,
                          paddingRight: isSideBg ? 24 : 0,
                          boxSizing: 'border-box',
                          height: isSideBg ? '100%' : 'auto',
                        }}
                      >
                        {page.sideBlocks.map((b, bIdx) => (
                          <div key={b.key} className="rf-block" data-section={sectionIdOfBlock(b.key)} style={{ marginTop: bIdx === 0 ? 0 : b.gap }}>
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
