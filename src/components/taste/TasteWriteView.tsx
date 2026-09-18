import { useEffect, useRef, useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import type { TasteBlockInput, TasteVisibility } from '../../shared/types';

const VISIBILITY_OPTIONS: { value: TasteVisibility; label: string }[] = [
  { value: 'public', label: '공개' },
  { value: 'private', label: '비공개' },
];

// 편집 중에는 각 블록에 고정 key가 있어야 타이핑 도중 textarea가 다시 만들어지지 않는다
type EditorBlock =
  | { key: string; type: 'text'; text: string }
  | { key: string; type: 'image'; path: string; url: string };

let keySeq = 0;
function nextKey() {
  return `b${keySeq++}`;
}

function emptyText(): EditorBlock {
  return { key: nextKey(), type: 'text', text: '' };
}

/** 내용에 맞춰 높이가 늘어나는 textarea — 여러 블록이 한 편의 글처럼 이어져 보이게 */
function AutoTextarea({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="taste-block-textarea"
      placeholder={placeholder}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

interface TasteWriteViewProps {
  /** null이면 새 글, 값이 있으면 그 글을 불러와 수정 */
  id: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export function TasteWriteView({ id, onBack, onSaved }: TasteWriteViewProps) {
  const { alert: showAlert } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 사진을 어느 블록 뒤에 끼워넣을지 — 파일 선택 대화상자가 비동기라 따로 들고 있어야 한다
  const insertAfterRef = useRef<number>(0);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<EditorBlock[]>([emptyText()]);
  const [visibility, setVisibility] = useState<TasteVisibility>('public');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.taste
      .categories()
      .then(setCategoryOptions)
      .catch(() => {
        // 추천 목록일 뿐이라 실패해도 그냥 빈 채로 둔다
      });
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.taste.get(id).then((post) => {
      if (cancelled || !post) return;
      setTitle(post.title);
      setCategory(post.category ?? '');
      setVisibility(post.visibility);
      const loaded: EditorBlock[] = post.blocks.map((b) =>
        b.type === 'text'
          ? { key: nextKey(), type: 'text', text: b.text }
          : { key: nextKey(), type: 'image', path: b.path, url: b.url },
      );
      setBlocks(loaded.length > 0 ? loaded : [emptyText()]);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function updateText(key: string, text: string) {
    setBlocks((prev) => prev.map((b) => (b.key === key && b.type === 'text' ? { ...b, text } : b)));
  }

  function removeBlock(key: string) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.key !== key);
      return next.some((b) => b.type === 'text') ? next : [...next, emptyText()];
    });
  }

  function pickImage(afterIndex: number) {
    insertAfterRef.current = afterIndex;
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const { path, url } = await api.taste.uploadImage(file);
        setBlocks((prev) => {
          const at = insertAfterRef.current + 1;
          const image: EditorBlock = { key: nextKey(), type: 'image', path, url };
          // 사진 뒤에는 바로 이어서 쓸 수 있도록 빈 글 블록을 같이 넣어준다
          const next = [...prev.slice(0, at), image, emptyText(), ...prev.slice(at)];
          insertAfterRef.current = at + 1;
          return next;
        });
      }
    } catch {
      await showAlert('사진을 올리지 못했어요.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      await showAlert('제목을 입력해주세요.');
      return;
    }

    // 저장할 때 빈 글 블록은 버린다 (편집 편의를 위해 넣어둔 것뿐이라)
    const payload: TasteBlockInput[] = blocks
      .filter((b) => b.type === 'image' || b.text.trim())
      .map((b) =>
        b.type === 'text' ? { type: 'text', text: b.text.trim() } : { type: 'image', path: b.path },
      );

    setSaving(true);
    try {
      const patch = {
        title: trimmedTitle,
        category: category.trim(),
        blocks: payload,
        visibility,
      };
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

      <div className="taste-meta-row">
        <input
          type="text"
          className="taste-category-input"
          list="taste-category-options"
          placeholder="카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="taste-category-options">
          {categoryOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <input
          type="text"
          className="taste-title-input"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="taste-blocks">
        {blocks.map((block, i) => (
          <div key={block.key} className="taste-block">
            {block.type === 'text' ? (
              <AutoTextarea
                value={block.text}
                placeholder={i === 0 ? '좋아하는 것에 대해 자유롭게 써보세요' : undefined}
                onChange={(v) => updateText(block.key, v)}
              />
            ) : (
              <div className="taste-block-image">
                <img src={block.url} alt="" />
                <button
                  type="button"
                  className="taste-block-image-remove"
                  title="사진 삭제"
                  onClick={() => removeBlock(block.key)}
                >
                  ✕
                </button>
              </div>
            )}
            <button
              type="button"
              className="taste-insert-btn"
              disabled={uploading}
              onClick={() => pickImage(i)}
            >
              ＋ 여기에 사진 넣기
            </button>
          </div>
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onFileChange} />

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
        <button type="button" className="diary-save-btn" disabled={saving || uploading} onClick={save}>
          {uploading ? '사진 올리는 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}
