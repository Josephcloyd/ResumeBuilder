import React, { useState } from 'react';
import { useResumeStore, useSection } from '../../store/resumeStore';
import type { SkillsDisplay, SkillsSection } from '../../types/resume';
import { newSkillGroup } from '../../lib/defaults';

interface SkillsEditorProps {
  sectionId: string;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ sectionId }) => {
  const section = useSection<SkillsSection>(sectionId);
  const { updateSection } = useResumeStore();
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});

  if (!section) return null;

  const groups = section.groups || [];

  const handleAddGroup = () => {
    const grp = newSkillGroup({ name: 'New Skill Category', skills: [] });
    updateSection(sectionId, (s) => {
      (s as SkillsSection).groups.push(grp);
    });
  };

  const handleUpdateGroupName = (groupId: string, name: string) => {
    updateSection(sectionId, (s) => {
      const g = (s as SkillsSection).groups.find((x) => x.id === groupId);
      if (g) g.name = name;
    }, `skill.group.${groupId}`);
  };

  const handleDeleteGroup = (groupId: string) => {
    updateSection(sectionId, (s) => {
      (s as SkillsSection).groups = (s as SkillsSection).groups.filter((x) => x.id !== groupId);
    });
  };

  const handleAddSkillToGroup = (groupId: string) => {
    const raw = (newSkillInputs[groupId] || '').trim();
    if (!raw) return;

    // Support comma-separated additions like "Python, React, TypeScript"
    const newItems = raw
      .split(/[,;]/)
      .map((x) => x.trim())
      .filter(Boolean);

    updateSection(sectionId, (s) => {
      const g = (s as SkillsSection).groups.find((x) => x.id === groupId);
      if (g) {
        g.skills = Array.from(new Set([...g.skills, ...newItems]));
      }
    });

    setNewSkillInputs((prev) => ({ ...prev, [groupId]: '' }));
  };

  const handleRemoveSkill = (groupId: string, skillIdx: number) => {
    updateSection(sectionId, (s) => {
      const g = (s as SkillsSection).groups.find((x) => x.id === groupId);
      if (g) {
        g.skills.splice(skillIdx, 1);
      }
    });
  };

  const handleDisplayChange = (display: SkillsDisplay) => {
    updateSection(sectionId, (s) => {
      (s as SkillsSection).display = display;
    });
  };

  return (
    <div className="space-y-4">
      {/* Title & Display options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <div>
          <label className="field-label">Section Title</label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection(sectionId, (s) => { s.title = e.target.value; })}
            className="input text-xs font-semibold"
          />
        </div>

        <div>
          <label className="field-label">Display Style</label>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['categories', 'tags', 'bullets', 'text'] as SkillsDisplay[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDisplayChange(d)}
                className={`flex-1 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                  section.display === d
                    ? 'bg-surface text-brand shadow-soft font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {d === 'categories' ? 'Category' : d === 'tags' ? 'Tags' : d === 'bullets' ? 'Bullets' : 'Text'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Categories */}
      {groups.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-muted mb-3">No skills added yet.</p>
          <button type="button" onClick={handleAddGroup} className="btn btn-secondary btn-sm">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            Add Skill Category
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((grp) => (
            <div key={grp.id} className="border border-line rounded-xl bg-surface p-3.5 shadow-soft space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={grp.name}
                  onChange={(e) => handleUpdateGroupName(grp.id, e.target.value)}
                  placeholder="Category Name (e.g. Programming, Web Dev)"
                  className="input h-8 text-xs font-semibold flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(grp.id)}
                  className="icon-btn size-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                  title="Delete Category"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>

              {/* Skills Tags list */}
              <div className="flex flex-wrap gap-1.5 min-h-6">
                {grp.skills.map((sk, skIdx) => (
                  <span
                    key={skIdx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-50 text-brand-dark rounded-full text-xs font-medium border border-brand-200/60"
                  >
                    <span>{sk}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(grp.id, skIdx)}
                      className="text-brand-400 hover:text-red-500 transition-colors"
                      title="Remove skill"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* Add skill input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newSkillInputs[grp.id] || ''}
                  onChange={(e) => setNewSkillInputs((prev) => ({ ...prev, [grp.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkillToGroup(grp.id);
                    }
                  }}
                  placeholder="Type skills (comma separated) and press Enter"
                  className="input h-8 text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkillToGroup(grp.id)}
                  className="btn btn-secondary btn-sm h-8"
                >
                  Add
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddGroup}
            className="btn btn-secondary btn-sm w-full"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            Add Another Category
          </button>
        </div>
      )}
    </div>
  );
};
