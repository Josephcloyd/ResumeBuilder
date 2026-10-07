import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { PhotoShape } from '../../types/resume';
import { ImageUploadModal } from '../common/ImageUploadModal';

export const PersonalInfoEditor: React.FC = () => {
  const { resume, update } = useResumeStore();
  const { personal } = resume;
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const setPersonal = (field: keyof typeof personal, val: any) => {
    update((d) => {
      (d.personal as any)[field] = val;
    }, `personal.${field}`);
  };

  return (
    <div className="space-y-4">
      {/* Profile Photo Area */}
      <div className="bg-slate-50 border border-line rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Profile Photo</span>
          {personal.profileImage && (
            <button
              type="button"
              onClick={() => setPersonal('profileImage', null)}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Remove Photo
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            {personal.profileImage ? (
              <img
                src={personal.profileImage.src}
                alt="Profile"
                className={`size-16 object-cover border-2 border-white shadow-soft ${
                  personal.photoShape === 'circle'
                    ? 'rounded-full'
                    : personal.photoShape === 'rounded'
                    ? 'rounded-xl'
                    : 'rounded-none'
                }`}
              />
            ) : (
              <div className="size-16 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center border-2 border-dashed border-slate-300">
                <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
          </div>

          {/* Photo Actions & Shape Selector */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="btn btn-secondary btn-sm"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
                {personal.profileImage ? 'Edit / Replace Photo' : 'Upload Photo'}
              </button>
            </div>

            {/* Shape choices */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted mr-1">Style:</span>
              {(['circle', 'rounded', 'square', 'none'] as PhotoShape[]).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setPersonal('photoShape', shape)}
                  className={`px-2 py-0.5 text-[11px] rounded font-medium capitalize transition-all ${
                    personal.photoShape === shape
                      ? 'bg-brand text-white shadow-soft'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {shape === 'none' ? 'No Image' : shape}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Info Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">
          <label className="field-label">Full Name *</label>
          <input
            type="text"
            value={personal.fullName}
            onChange={(e) => setPersonal('fullName', e.target.value)}
            placeholder="e.g. Joseph Dano"
            className="input font-medium"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Professional Title</label>
          <input
            type="text"
            value={personal.professionalTitle}
            onChange={(e) => setPersonal('professionalTitle', e.target.value)}
            placeholder="e.g. Computer Engineering Student · Software Developer"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">Email</label>
          <input
            type="email"
            value={personal.email}
            onChange={(e) => setPersonal('email', e.target.value)}
            placeholder="e.g. joseph.dano@email.com"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">Phone Number</label>
          <input
            type="tel"
            value={personal.phone}
            onChange={(e) => setPersonal('phone', e.target.value)}
            placeholder="e.g. +63 912 345 6789"
            className="input"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Address / Location</label>
          <input
            type="text"
            value={personal.location}
            onChange={(e) => setPersonal('location', e.target.value)}
            placeholder="e.g. Cebu City, Philippines"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">LinkedIn</label>
          <input
            type="text"
            value={personal.linkedIn}
            onChange={(e) => setPersonal('linkedIn', e.target.value)}
            placeholder="e.g. linkedin.com/in/josephdano"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">GitHub</label>
          <input
            type="text"
            value={personal.github}
            onChange={(e) => setPersonal('github', e.target.value)}
            placeholder="e.g. github.com/josephdano"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">Portfolio Website</label>
          <input
            type="text"
            value={personal.portfolio}
            onChange={(e) => setPersonal('portfolio', e.target.value)}
            placeholder="e.g. josephdano.dev"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">Personal Website</label>
          <input
            type="text"
            value={personal.website}
            onChange={(e) => setPersonal('website', e.target.value)}
            placeholder="e.g. blog.josephdano.dev"
            className="input"
          />
        </div>
      </div>

      {/* Image Upload Modal */}
      {isPhotoModalOpen && (
        <ImageUploadModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          initialAsset={personal.profileImage}
          fixedAspect={1}
          allowAspectChange={false}
          title="Profile Photo"
          onSave={(asset) => {
            setPersonal('profileImage', asset);
            if (personal.photoShape === 'none') {
              setPersonal('photoShape', 'circle');
            }
          }}
        />
      )}
    </div>
  );
};
