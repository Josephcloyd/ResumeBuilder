import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { PhotoShape } from '../../types/resume';
import { PHOTO_SIZE, clampPhotoSize } from '../../lib/constants';
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
          <div className="flex-1 min-w-0 space-y-2">
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
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted mr-1">Style:</span>
              {(['circle', 'rounded', 'square', 'none'] as PhotoShape[]).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setPersonal('photoShape', shape)}
                  className={`px-2 py-0.5 text-[11px] rounded font-medium capitalize transition-all ${
                    personal.photoShape === shape
                      ? 'bg-brand text-white shadow-soft'
                      : 'bg-surface text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {shape === 'none' ? 'No Image' : shape}
                </button>
              ))}
            </div>
          </div>
        </div>

        {personal.profileImage && personal.photoShape !== 'none' && (
          <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="profile-photo-size" className="text-xs font-medium text-slate-700">
                Photo size
              </label>
              <span className="min-w-14 text-center text-xs font-semibold text-brand bg-brand-50 border border-brand-100 rounded-md px-2 py-1">
                {clampPhotoSize(personal.photoSize)} px
              </span>
            </div>
            <input
              id="profile-photo-size"
              type="range"
              min={PHOTO_SIZE.min}
              max={PHOTO_SIZE.max}
              step={PHOTO_SIZE.step}
              value={clampPhotoSize(personal.photoSize)}
              onChange={(e) => setPersonal('photoSize', clampPhotoSize(e.target.value))}
              className="w-full accent-brand h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Profile photo size"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted">Smaller</span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Small', value: 72 },
                  { label: 'Medium', value: 96 },
                  { label: 'Large', value: 128 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPersonal('photoSize', preset.value)}
                    className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${
                      clampPhotoSize(personal.photoSize) === preset.value
                        ? 'border-brand bg-brand-50 text-brand font-semibold'
                        : 'border-slate-200 bg-surface text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted">Larger</span>
            </div>
            <p className="text-[10px] leading-4 text-muted">
              Limited to a layout-safe range so preview and PDF pages stay consistent.
            </p>
          </div>
        )}
      </div>

      {/* Main Info Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">
          <label className="field-label">Full Name *</label>
          <input
            type="text"
            value={personal.fullName}
            onChange={(e) => setPersonal('fullName', e.target.value)}
            placeholder="e.g. Alex Rivera"
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
            placeholder="e.g. alex.rivera@example.com"
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
            placeholder="e.g. linkedin.com/in/alexrivera"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">GitHub</label>
          <input
            type="text"
            value={personal.github}
            onChange={(e) => setPersonal('github', e.target.value)}
            placeholder="e.g. github.com/alexrivera"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">Portfolio Website</label>
          <input
            type="text"
            value={personal.portfolio}
            onChange={(e) => setPersonal('portfolio', e.target.value)}
            placeholder="e.g. alexrivera.dev"
            className="input"
          />
        </div>

        <div>
          <label className="field-label">Personal Website</label>
          <input
            type="text"
            value={personal.website}
            onChange={(e) => setPersonal('website', e.target.value)}
            placeholder="e.g. blog.alexrivera.dev"
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
