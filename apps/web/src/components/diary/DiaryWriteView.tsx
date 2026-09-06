import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { useModal } from '../../context/ModalContext';
import type { DiaryPhoto, DiaryVisibility } from '../../shared/types';

const VISIBILITY_OPTIONS: { value: DiaryVisibility; label: string }[] = [
  { value: 'public', label: '공개' },
  { value: 'private', label: '비공개' },
  { value: 'friends', label: '친구공개' },
];

function dateLabel(key: string) {
  const [y, m, d] = key.split('-');
  return `${y}.${m}.${d}`;
}

interface DiaryWriteViewProps {
  date: string;
  onBack: () => void;
  onSaved: () => void;
}

export function DiaryWriteView({ date, onBack, onSaved }: DiaryWriteViewProps) {
  const { alert: showAlert } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<DiaryVisibility>('public');
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [entryExists, setEntryExists] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.diary.get(date).then((entry) => {
      if (cancelled) return;
      if (entry) {
        setContent(entry.content);
        setVisibility(entry.visibility);
        setPhotos(entry.photos);
        setCoverPhotoId(entry.coverPhotoId);
        setEntryExists(true);
      } else {
        setContent('');
        setVisibility('public');
        setPhotos([]);
        setCoverPhotoId(null);
        setEntryExists(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  async function ensureEntryExists() {
    if (entryExists) return;
    await api.diary.save(date, { content, visibility, coverPhotoId });
    setEntryExists(true);
  }

  async function onPhotoInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = '';

    await ensureEntryExists();
    for (const file of files) {
      const uploaded = await api.diary.uploadPhoto(date, file);
      setPhotos((prev) => [...prev, uploaded]);
    }
  }

  async function removePhoto(photo: DiaryPhoto) {
    await api.diary.removePhoto(date, photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setCoverPhotoId((prev) => (prev === photo.id ? null : prev));
  }

  function toggleCover(photo: DiaryPhoto) {
    setCoverPhotoId((prev) => (prev === photo.id ? null : photo.id));
  }

  async function save() {
    const trimmed = content.trim();
    if (!trimmed && photos.length === 0) {
      await showAlert('내용이나 사진을 추가해주세요.');
      return;
    }
    setSaving(true);
    try {
      await api.diary.save(date, { content: trimmed, visibility, coverPhotoId });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="diary-write" style={{ display: 'flex' }}>
      <div className="diary-write-header">
        <button type="button" className="diary-back-btn" onClick={onBack}>
          ◀ 캘린더로
        </button>
        <span className="diary-write-date">{dateLabel(date)}</span>
      </div>

      <div className="diary-write-photos">
        {photos.map((photo) => {
          const isCover = photo.id === coverPhotoId;
          return (
            <div key={photo.id} className={`diary-photo-thumb${isCover ? ' is-cover' : ''}`}>
              <img src={photo.url} alt="" />
              <button
                type="button"
                className="diary-photo-cover-btn"
                title={isCover ? '대표사진 해제' : '대표사진으로 설정'}
                onClick={() => toggleCover(photo)}
              >
                {isCover ? '★' : '☆'}
              </button>
              <button
                type="button"
                className="diary-photo-remove"
                title="사진 삭제"
                onClick={() => removePhoto(photo)}
              >
                ✕
              </button>
            </div>
          );
        })}
        <div className="diary-photo-add" title="사진 추가" onClick={() => fileInputRef.current?.click()}>
          ＋
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPhotoInputChange}
      />

      <textarea
        className="diary-write-textarea"
        placeholder="오늘 하루를 기록해보세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="diary-write-footer">
        <div className="diary-visibility-group">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`diary-visibility-btn${visibility === opt.value ? ' active' : ''}`}
              onClick={() => setVisibility(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button type="button" className="diary-save-btn" disabled={saving} onClick={save}>
          저장
        </button>
      </div>
    </div>
  );
}
