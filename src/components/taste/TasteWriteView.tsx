import { useEffect, useRef, useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import type {
  TasteBlockInput,
  TasteCategory,
  TasteImageAlign,
  TasteImageSize,
  TasteVisibility,
} from '../../shared/types';
import { CategoryChip } from './CategoryChip';
import { CategoryPicker } from './CategoryPicker';

const VISIBILITY_OPTIONS: { value: TasteVisibility; label: string }[] = [
  { value: 'public', label: '공개' },
  { value: 'private', label: '비공개' },
];

// 편집 중에는 각 블록에 고정 key가 있어야 타이핑 도중 textarea가 다시 만들어지지 않는다
type EditorBlock =
  | { key: string; type: 'text'; text: string }
  | {
      key: string;
      type: 'image';
      path: string;
      url: string;
      size: TasteImageSize;
      align: TasteImageAlign;
      caption: string;
    };

const SIZE_OPTIONS: { value: TasteImageSize; label: string }[] = [
  { value: 'small', label: '작게' },
  { value: 'medium', label: '보통' },
  { value: 'large', label: '크게' },
];

const ALIGN_OPTIONS: { value: TasteImageAlign; label: string; icon: string }[] = [
  { value: 'left', label: '왼쪽', icon: '◧' },
  { value: 'center', label: '가운데', icon: '▣' },
  { value: 'right', label: '오른쪽', icon: '◨' },
];

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
  onFocus,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onFocus: () => void;
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
      onFocus={onFocus}
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
  // 사진을 어느 블록 뒤에 넣을지 — 마지막으로 커서가 있던 블록 기준
  const focusedIndexRef = useRef<number>(0);

  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<TasteCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [blocks, setBlocks] = useState<EditorBlock[]>([emptyText()]);
  const [visibility, setVisibility] = useState<TasteVisibility>('public');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.taste
      .categories()
      .then(setCategories)
      .catch(() => {
        // 목록을 못 받아도 글은 쓸 수 있어야 하므로 빈 채로 둔다
      });
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.taste.get(id).then((post) => {
      if (cancelled || !post) return;
      setTitle(post.title);
      setCategoryId(post.category?.id ?? null);
      setVisibility(post.visibility);
      const loaded: EditorBlock[] = post.blocks.map((b) =>
        b.type === 'text'
          ? { key: nextKey(), type: 'text', text: b.text }
          : {
              key: nextKey(),
              type: 'image',
              path: b.path,
              url: b.url,
              size: b.size,
              align: b.align,
              caption: b.caption,
            },
      );
      setBlocks(loaded.length > 0 ? loaded : [emptyText()]);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const selected = categories.find((c) => c.id === categoryId) ?? null;

  function updateText(key: string, text: string) {
    setBlocks((prev) => prev.map((b) => (b.key === key && b.type === 'text' ? { ...b, text } : b)));
  }

  function updateImage(key: string, patch: Partial<Extract<EditorBlock, { type: 'image' }>>) {
    setBlocks((prev) =>
      prev.map((b) => (b.key === key && b.type === 'image' ? { ...b, ...patch } : b)),
    );
  }

  function removeBlock(key: string) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.key !== key);
      return next.some((b) => b.type === 'text') ? next : [...next, emptyText()];
    });
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
          const at = Math.min(focusedIndexRef.current + 1, prev.length);
          const image: EditorBlock = {
            key: nextKey(),
            type: 'image',
            path,
            url,
            size: 'medium',
            align: 'center',
            caption: '',
          };
          // 사진 뒤에는 바로 이어서 쓸 수 있도록 빈 글 블록을 같이 넣어준다
          const next = [...prev.slice(0, at), image, emptyText(), ...prev.slice(at)];
          focusedIndexRef.current = at + 1;
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
        b.type === 'text'
          ? { type: 'text', text: b.text.trim() }
          : {
              type: 'image',
              path: b.path,
              size: b.size,
              align: b.align,
              caption: b.caption.trim(),
            },
      );

    setSaving(true);
    try {
      const patch = { title: trimmedTitle, categoryId, blocks: payload, visibility };
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
        <div className="taste-category-field">
          <button
            type="button"
            className="taste-category-btn"
            onClick={() => setPickerOpen((v) => !v)}
          >
            {selected ? <CategoryChip category={selected} /> : <span>＋ 카테고리</span>}
          </button>
          {pickerOpen && (
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
              onCategoriesChange={setCategories}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
        <input
          type="text"
          className="taste-title-input"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="taste-editor-toolbar">
        <button
          type="button"
          className="taste-insert-btn"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? '올리는 중…' : '＋ 사진 넣기'}
        </button>
        <span className="taste-editor-hint">커서가 있는 문단 뒤에 들어가요</span>
      </div>

      <div className="taste-blocks">
        {blocks.map((block, i) => (
          <div key={block.key} className="taste-block">
            {block.type === 'text' ? (
              <AutoTextarea
                value={block.text}
                placeholder={i === 0 ? '좋아하는 것에 대해 자유롭게 써보세요' : undefined}
                onFocus={() => {
                  focusedIndexRef.current = i;
                }}
                onChange={(v) => updateText(block.key, v)}
              />
            ) : (
              <div className="taste-block-image">
                <figure className={`taste-figure size-${block.size} align-${block.align}`}>
                  <img src={block.url} alt="" />
                  <button
                    type="button"
                    className="taste-block-image-remove"
                    title="사진 삭제"
                    onClick={() => removeBlock(block.key)}
                  >
                    ✕
                  </button>
                </figure>

                <div className="taste-image-controls">
                  <div className="taste-image-group">
                    {SIZE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`taste-image-btn${block.size === opt.value ? ' active' : ''}`}
                        onClick={() => updateImage(block.key, { size: opt.value })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="taste-image-group">
                    {ALIGN_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.label}
                        className={`taste-image-btn${block.align === opt.value ? ' active' : ''}`}
                        onClick={() => updateImage(block.key, { align: opt.value })}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  className="taste-caption-input"
                  placeholder="사진 설명 (선택)"
                  maxLength={200}
                  value={block.caption}
                  onChange={(e) => updateImage(block.key, { caption: e.target.value })}
                />
              </div>
            )}
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
          저장
        </button>
      </div>
    </div>
  );
}
