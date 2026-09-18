import { useEffect, useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import type { TasteVisibility } from '../../shared/types';

const VISIBILITY_OPTIONS: { value: TasteVisibility; label: string }[] = [
  { value: 'public', label: '공개' },
  { value: 'private', label: '비공개' },
];

interface TasteWriteViewProps {
  /** null이면 새 글, 값이 있으면 그 글을 불러와 수정 */
  id: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export function TasteWriteView({ id, onBack, onSaved }: TasteWriteViewProps) {
  const { alert: showAlert } = useModal();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<TasteVisibility>('public');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.taste.get(id).then((post) => {
      if (cancelled || !post) return;
      setTitle(post.title);
      setContent(post.content);
      setVisibility(post.visibility);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      await showAlert('제목을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const patch = { title: trimmedTitle, content: content.trim(), visibility };
      if (id) await api.taste.update(id, patch);
      else await api.taste.create(patch);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="taste-write">
      <div className="taste-view-header">
        <button type="button" className="diary-back-btn" onClick={onBack}>
          ◀ 목록으로
        </button>
        <span className="diary-write-date">{id ? '글 수정' : '새 글 쓰기'}</span>
      </div>

      <input
        type="text"
        className="taste-title-input"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="diary-write-textarea taste-write-textarea"
        placeholder="좋아하는 것에 대해 자유롭게 써보세요"
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
