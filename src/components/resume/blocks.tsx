import type { CSSProperties, ReactNode } from 'react';
import type {
  Align,
  AlignOrInherit,
  CertificationItem,
  CertImagePosition,
  CertImageSize,
  GenericItem,
  ImageAsset,
  Resume,
  Section,
  TemplateId,
} from '../../types/resume';
import { DENSITY, SECTION_GAP_PX, clampPhotoSize, fontStack, templateById } from '../../lib/constants';
import { SECTION_META, isGenericType } from '../../lib/defaults';
import { dateRange, displayUrl, ensureUrl, formatMonth, isHtmlEmpty, sanitizeHtml } from '../../lib/format';
import { ContactIcon, type ContactKind } from './contactIcons';

/* ------------------------------------------------------------------ */
/* Effective settings (ATS mode overrides)                             */
/* ------------------------------------------------------------------ */

export function getEffective(r: Resume) {
  const ats = r.design.atsMode;
  const template: TemplateId = ats ? 'simple-ats' : r.design.template;
  const tdef = templateById(template);
  const columns: 1 | 2 = ats ? 1 : r.layout.columns;
  const twoColModern = template === 'two-column-modern' && columns === 2;
  return {
    ats,
    template,
    columns,
    sidebar: tdef.sidebar,
    accent: ats ? '#111827' : r.design.accentColor,
    showPhoto: !ats && r.personal.photoShape !== 'none' && !!r.personal.profileImage,
    showImages: !ats,
    splitHeader: twoColModern,
    sideBg: twoColModern,
    headingFont: ats ? 'Arial' : r.fonts.headingFont,
    bodyFont: ats ? 'Arial' : r.fonts.bodyFont,
    sectionGap: SECTION_GAP_PX[r.layout.sectionGap],
    itemGap: DENSITY[r.layout.density].item,
    paraGap: DENSITY[r.layout.density].para,
    headingGap: 7,
    headingAlign: r.layout.headingAlignment,
  };
}
export type Effective = ReturnType<typeof getEffective>;

export function docStyle(r: Resume, e: Effective): CSSProperties {
  const f = r.fonts;
  return {
    '--rf-accent': e.accent,
    '--rf-heading-font': fontStack(e.headingFont),
    '--rf-body-font': fontStack(e.bodyFont),
    '--rf-name-size': `${f.nameSize}px`,
    '--rf-heading-size': `${f.headingSize}px`,
    '--rf-heading-weight': e.ats ? 700 : f.headingWeight,
    '--rf-body-size': `${f.bodySize}px`,
    '--rf-body-weight': f.bodyWeight,
    '--rf-lh': f.lineHeight,
    '--rf-heading-align': e.headingAlign,
    '--rf-para-gap': `${e.paraGap}px`,
  } as CSSProperties;
}

export function docClassName(e: Effective) {
  return `rf-doc tpl-${e.template}${e.ats ? ' rf-ats' : ''}`;
}

/* ------------------------------------------------------------------ */
/* Block model                                                         */
/* ------------------------------------------------------------------ */

export interface Block {
  key: string;
  col: 'main' | 'side';
  el: ReactNode;
  /** space before this block when it is not first on a page */
  gap: number;
  /** keep together with the following block (headings) */
  keepWithNext?: boolean;
}

export interface BuiltDoc {
  header: ReactNode | null;
  blocks: Block[];
}

const resolveAlign = (r: Resume, ...chain: AlignOrInherit[]): Align => {
  for (const a of chain) if (a && a !== 'inherit') return a;
  return r.layout.bodyAlignment;
};

function Rich({ html, align, className = '' }: { html: string; align: Align; className?: string }) {
  if (isHtmlEmpty(html)) return null;
  return (
    <div
      className={`rf-rich ${align === 'justify' ? 'rf-justify' : ''} ${className}`}
      style={{ textAlign: align }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

function Link({ href, children, className = 'rf-link' }: { href: string; children: ReactNode; className?: string }) {
  if (!href.trim()) return <>{children}</>;
  return (
    <a className={className} href={ensureUrl(href)} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function contactItems(r: Resume) {
  const p = r.personal;
  const items: { kind: ContactKind; label: string; href: string }[] = [];
  if (p.email) items.push({ kind: 'email', label: p.email, href: `mailto:${p.email.trim()}` });
  if (p.phone) items.push({ kind: 'phone', label: p.phone, href: `tel:${p.phone.replace(/[^\d+]/g, '')}` });
  if (p.location) items.push({ kind: 'location', label: p.location, href: '' });
  if (p.linkedIn) items.push({ kind: 'linkedin', label: displayUrl(p.linkedIn), href: ensureUrl(p.linkedIn) });
  if (p.github) items.push({ kind: 'github', label: displayUrl(p.github), href: ensureUrl(p.github) });
  if (p.portfolio) items.push({ kind: 'portfolio', label: displayUrl(p.portfolio), href: ensureUrl(p.portfolio) });
  if (p.website) items.push({ kind: 'website', label: displayUrl(p.website), href: ensureUrl(p.website) });
  return items;
}

function Photo({ r, img }: { r: Resume; img: ImageAsset }) {
  const s = clampPhotoSize(r.personal.photoSize);
  return (
    <img
      className={`rf-photo shape-${r.personal.photoShape}`}
      src={img.src}
      alt=""
      width={s}
      height={s}
      style={{ width: s, height: s }}
    />
  );
}

function Identity({ r }: { r: Resume }) {
  return (
    <>
      <h1 className="rf-name">{r.personal.fullName || 'Your Name'}</h1>
      {r.personal.professionalTitle && <div className="rf-title">{r.personal.professionalTitle}</div>}
    </>
  );
}

function FullHeader({ r, e }: { r: Resume; e: Effective }) {
  const forcedCenter = e.template === 'corporate' || e.template === 'academic';
  const align = forcedCenter ? 'center' : r.layout.headingAlignment;
  const items = contactItems(r);
  return (
    <header className="rf-header" data-align={align}>
      {e.showPhoto && r.personal.profileImage && <Photo r={r} img={r.personal.profileImage} />}
      <div className="rf-header-main">
        <Identity r={r} />
        {items.length > 0 && (
          <ul className="rf-contact">
            {items.map((c) => (
              <li key={c.kind}>
                {!e.ats && <ContactIcon kind={c.kind} />}
                {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}

function SideContact({ r, e }: { r: Resume; e: Effective }) {
  const items = contactItems(r);
  return (
    <div>
      {e.showPhoto && r.personal.profileImage && (
        <div className="rf-side-photo">
          <Photo r={r} img={r.personal.profileImage} />
        </div>
      )}
      {items.length > 0 && (
        <ul className="rf-side-contact">
          {items.map((c) => (
            <li key={c.kind}>
              <ContactIcon kind={c.kind} />
              {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Media (certificates & image-enabled sections)                       */
/* ------------------------------------------------------------------ */

function Media({
  image,
  size,
  position,
  show,
  children,
}: {
  image: ImageAsset | null;
  size: CertImageSize;
  position: CertImagePosition;
  show: boolean;
  children: ReactNode;
}) {
  if (!show || !image || size === 'hidden') return <>{children}</>;
  return (
    <div className={`rf-media pos-${position}`}>
      <img className={`rf-media-img size-${size}`} src={image.src} alt="" />
      <div className="rf-media-body">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section → blocks                                                    */
/* ------------------------------------------------------------------ */

function sectionTitle(s: Section, e: Effective) {
  if (e.ats && s.type !== 'custom') return SECTION_META[s.type].standardTitle;
  return s.title;
}

function hasContent(s: Section): boolean {
  switch (s.type) {
    case 'summary':
    case 'custom':
      return !isHtmlEmpty(s.content);
    case 'skills':
      return s.groups.some((g) => g.skills.length > 0);
    default:
      return s.items.length > 0;
  }
}

function CertBody({ c, align }: { c: CertificationItem; align: Align }) {
  const title = c.name || c.certificationName || 'Certificate';
  const meta = [c.organization, c.issueDate && `Issued ${formatMonth(c.issueDate)}`, c.expirationDate && `Expires ${formatMonth(c.expirationDate)}`]
    .filter(Boolean)
    .join(' · ');
  return (
    <>
      <div className="rf-item-title">
        <Link href={c.credentialUrl}>{title}</Link>
      </div>
      {c.name && c.certificationName && <div className="rf-item-sub">{c.certificationName}</div>}
      {meta && <div className="rf-meta">{meta}</div>}
      {c.credentialId && (
        <div className="rf-meta">
          <b>Credential ID:</b> {c.credentialId}
        </div>
      )}
      {!isHtmlEmpty(c.description) && <Rich className="rf-item-body" html={c.description} align={align} />}
      {c.credentialUrl && (
        <div className="rf-links">
          <Link href={c.credentialUrl}>View Credential ↗</Link>
        </div>
      )}
    </>
  );
}

function GenericBody({ it, s, align }: { it: GenericItem; s: Section; align: Align }) {
  const range = dateRange(it.date, it.endDate);
  const sub = [it.subtitle, it.location].filter(Boolean);
  return (
    <>
      <div className="rf-row">
        <span className="rf-item-title">{it.url ? <Link href={it.url}>{it.title || 'Untitled'}</Link> : it.title || 'Untitled'}</span>
        {range && <span className="rf-item-date">{range}</span>}
      </div>
      {sub.length > 0 && (
        <div className="rf-row">
          {it.subtitle && <span className="rf-item-sub">{it.subtitle}</span>}
          {it.location && <span className="rf-item-loc">{it.location}</span>}
        </div>
      )}
      <Rich className="rf-item-body" html={it.description} align={align} />
      {it.url && s.type === 'publications' && (
        <div className="rf-links">
          <Link href={it.url}>{displayUrl(it.url)}</Link>
        </div>
      )}
    </>
  );
}

function sectionBlocks(r: Resume, s: Section, e: Effective, col: 'main' | 'side'): Block[] {
  const blocks: Block[] = [];
  const secAlign = resolveAlign(r, s.align);
  const heading: Block = {
    key: `${s.id}:h`,
    col,
    gap: e.sectionGap,
    keepWithNext: true,
    el: (
      <h2 className="rf-heading">
        <span className="rf-heading-text">{sectionTitle(s, e)}</span>
      </h2>
    ),
  };
  blocks.push(heading);
  const push = (key: string, el: ReactNode, first: boolean) =>
    blocks.push({ key: `${s.id}:${key}`, col, gap: first ? e.headingGap : e.itemGap, el });

  switch (s.type) {
    case 'summary':
    case 'custom':
      push('c', <Rich html={s.content} align={secAlign} />, true);
      break;

    case 'experience':
      s.items.forEach((it, i) => {
        const a = resolveAlign(r, it.align, s.align);
        push(
          it.id,
          <div className="rf-item">
            <div className="rf-row">
              <span className="rf-item-title">{it.jobTitle || 'Job Title'}</span>
              <span className="rf-item-date">{dateRange(it.startDate, it.endDate, it.current)}</span>
            </div>
            {(it.company || it.location) && (
              <div className="rf-row">
                <span className="rf-item-sub">{it.company}</span>
                {it.location && <span className="rf-item-loc">{it.location}</span>}
              </div>
            )}
            <Rich className="rf-item-body" html={it.description} align={a} />
            <Rich className="rf-item-body" html={it.accomplishments} align={a} />
          </div>,
          i === 0,
        );
      });
      break;

    case 'education':
      s.items.forEach((it, i) => {
        const a = resolveAlign(r, it.align, s.align);
        const title = [it.degree, it.program].filter(Boolean).join(it.degree && it.program ? ' in ' : '');
        const years = [it.startYear, it.endYear].filter(Boolean).join(' – ');
        push(
          it.id,
          <div className="rf-item">
            <div className="rf-row">
              <span className="rf-item-title">{title || it.school || 'Degree'}</span>
              {years && <span className="rf-item-date">{years}</span>}
            </div>
            {(it.school || it.location) && title && (
              <div className="rf-row">
                <span className="rf-item-sub">{it.school}</span>
                {it.location && <span className="rf-item-loc">{it.location}</span>}
              </div>
            )}
            <Rich className="rf-item-body" html={it.description} align={a} />
          </div>,
          i === 0,
        );
      });
      break;

    case 'projects':
      s.items.forEach((it, i) => {
        const a = resolveAlign(r, it.align, s.align);
        const range = dateRange(it.startDate, it.endDate);
        push(
          it.id,
          <div className="rf-item">
            <div className="rf-row">
              <span className="rf-item-title">
                {it.url ? <Link href={it.url}>{it.name || 'Project'}</Link> : it.name || 'Project'}
                {it.role && <span className="rf-item-sub" style={{ fontWeight: 400, fontSize: '0.94em' }}> · {it.role}</span>}
              </span>
              {range && <span className="rf-item-date">{range}</span>}
            </div>
            {it.technologies && (
              <div className="rf-meta">
                <b>Technologies:</b> {it.technologies}
              </div>
            )}
            <Rich className="rf-item-body" html={it.description} align={a} />
            {(it.url || it.githubUrl) && (
              <div className="rf-links">
                {it.url && <Link href={it.url}>{displayUrl(it.url)}</Link>}
                {it.githubUrl && <Link href={it.githubUrl}>{displayUrl(it.githubUrl)}</Link>}
              </div>
            )}
          </div>,
          i === 0,
        );
      });
      break;

    case 'skills': {
      const groups = s.groups.filter((g) => g.skills.length > 0);
      const display = e.ats ? 'text' : s.display;
      if (display === 'bullets') {
        push(
          'b',
          <ul className="rf-skill-bullets">
            {groups.flatMap((g) => g.skills).map((sk, i) => (
              <li key={i}>{sk}</li>
            ))}
          </ul>,
          true,
        );
      } else {
        groups.forEach((g, i) => {
          let el: ReactNode;
          if (display === 'tags') {
            el = (
              <div>
                {g.name && (
                  <div className="rf-skill-group-name" style={{ marginBottom: 3 }}>
                    {g.name}
                  </div>
                )}
                <div className="rf-tags">
                  {g.skills.map((sk, j) => (
                    <span className="rf-tag" key={j}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            );
          } else if (display === 'categories') {
            el = (
              <div>
                {g.name && <div className="rf-skill-group-name">{g.name}</div>}
                <div style={{ color: '#334155' }}>{g.skills.join(' · ')}</div>
              </div>
            );
          } else {
            el = (
              <div>
                {g.name && <span className="rf-skill-group-name">{g.name}: </span>}
                {g.skills.join(', ')}
              </div>
            );
          }
          blocks.push({
            key: `${s.id}:${g.id}`,
            col,
            gap: i === 0 ? e.headingGap : display === 'text' ? Math.max(2, e.paraGap) : e.itemGap - 2,
            el,
          });
        });
      }
      break;
    }

    case 'certifications': {
      const mode = e.ats ? 'text' : s.displayMode;
      if (mode === 'gallery') {
        const cols = col === 'side' ? 1 : s.galleryColumns;
        for (let i = 0; i < s.items.length; i += cols) {
          const row = s.items.slice(i, i + cols);
          push(
            `g${i}`,
            <div className="rf-gallery" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {row.map((c) => (
                <div className="rf-gcard" key={c.id}>
                  {c.image && e.showImages && c.imageSize !== 'hidden' && (
                    <img className="rf-media-img" src={c.image.src} alt="" />
                  )}
                  <CertBody c={c} align={resolveAlign(r, c.align, s.align)} />
                </div>
              ))}
            </div>,
            i === 0,
          );
        }
      } else {
        s.items.forEach((c, i) => {
          push(
            c.id,
            <Media
              image={c.image}
              size={col === 'side' && c.imageSize !== 'hidden' ? 'full' : c.imageSize}
              position={col === 'side' ? 'below' : c.imagePosition}
              show={mode === 'imageText' && e.showImages}
            >
              <CertBody c={c} align={resolveAlign(r, c.align, s.align)} />
            </Media>,
            i === 0,
          );
        });
      }
      break;
    }

    default: {
      if (!isGenericType(s.type)) break;
      const meta = SECTION_META[s.type];
      const items = (s as Extract<Section, { items: GenericItem[] }>).items;
      if (meta.inline) {
        if (col === 'side' || s.type === 'languages') {
          push(
            'l',
            col === 'side' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {items.map((it) => (
                  <div className="rf-kv" key={it.id}>
                    <span>{it.title}</span>
                    {it.subtitle && <span>{it.subtitle}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rf-inline-list">
                {items.map((it, i) => (
                  <span key={it.id}>
                    {i > 0 && <span className="rf-dot">· </span>}
                    <b style={{ fontWeight: 600 }}>{it.title}</b>
                    {it.subtitle && <span style={{ color: '#64748b' }}> ({it.subtitle})</span>}
                  </span>
                ))}
              </div>
            ),
            true,
          );
        } else {
          push('l', <div>{items.map((it) => it.title).filter(Boolean).join(' · ')}</div>, true);
        }
        break;
      }
      items.forEach((it, i) => {
        const a = resolveAlign(r, it.align, s.align);
        push(
          it.id,
          <Media
            image={meta.images ? it.image : null}
            size={col === 'side' && it.imageSize !== 'hidden' ? 'full' : it.imageSize}
            position={col === 'side' ? 'below' : it.imagePosition}
            show={e.showImages}
          >
            <GenericBody it={it} s={s} align={a} />
          </Media>,
          i === 0,
        );
      });
    }
  }
  return blocks;
}

export function buildDoc(r: Resume, e: Effective): BuiltDoc {
  const blocks: Block[] = [];
  let header: ReactNode | null = null;

  if (e.splitHeader) {
    blocks.push({ key: 'identity', col: 'main', gap: 0, el: <div className="rf-header-main"><Identity r={r} /></div> });
    blocks.push({ key: 'sidecontact', col: 'side', gap: 0, el: <SideContact r={r} e={e} /> });
  } else {
    header = <FullHeader r={r} e={e} />;
  }

  for (const s of r.sections) {
    if (!s.visible || !hasContent(s)) continue;
    const col: 'main' | 'side' = e.columns === 2 ? s.column : 'main';
    blocks.push(...sectionBlocks(r, s, e, col));
  }
  return { header, blocks };
}
