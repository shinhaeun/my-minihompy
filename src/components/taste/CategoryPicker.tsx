import { useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import type { TasteCategory, TasteColor } from '../../shared/types';
import { CATEGORY_COLORS, categoryColor } from './categoryColor';

interface CategoryPickerProps {
  categories: TasteCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCategoriesChange: (categories: TasteCategory[]) => void;
  onClose: () => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  onCategoriesChange,
  onClose,
}: CategoryPickerProps) {
  const { alert: showAlert, confirm } = useModal();
  const [name, setName] = useState('');
  const [color, setColor] = useState<TasteColor>('pink');
  const [busy, setBusy] = useState(false);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const created = await api.taste.createCategory(trimmed, color);
      onCategoriesChange([...categories, created]);
      onSelect(created.id);
      setName('');
      onClose();
    } catch (err) {
      await showAlert(err instanceof Error ? err.message : '카테고리를 만들지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: TasteCategory) {
    const ok = await confirm(`'${category.name}' 카테고리를 지울까요?\n이 카테고리로 쓴 글은 그대로 남아요.`);
    if (!ok) return;
    await api.taste.removeCategory(category.id);
    onCategoriesChange(categories.filter((c) => c.id !== category.id));
    if (selectedId === category.id) onSelect(null);
  }

  return (
    <>
      <div className="taste-picker-backdrop" onClick={onClose} />
      <div className="taste-picker">
        <div className="taste-picker-title">카테고리 선택</div>

        <div className="taste-picker-list">
          <button
            type="button"
            className={`taste-picker-item${selectedId === null ? ' selected' : ''}`}
            onClick={() => {
              onSelect(null);
              onClose();
            }}
          >
            <span className="taste-picker-none">없음</span>
          </button>

          {categories.map((category) => {
            const { bg, fg } = categoryColor(category.color);
            return (
              <div
                key={category.id}
                className={`taste-picker-item${selectedId === category.id ? ' selected' : ''}`}
              >
                <button
                  type="button"
                  className="taste-picker-pick"
                  onClick={() => {
                    onSelect(category.id);
                    onClose();
                  }}
                >
                  <span className="taste-category-chip" style={{ background: bg, color: fg }}>
                    {category.name}
                  </span>
                </button>
                <button
                  type="button"
                  className="taste-picker-remove"
                  title="카테고리 삭제"
                  onClick={() => remove(category)}
                >
                  ✕
                </button>
              </div>
            );
          })}
          {categories.length === 0 && (
            <p className="taste-picker-empty">아직 만든 카테고리가 없어요.</p>
          )}
        </div>

        <div className="taste-picker-new">
          <div className="taste-picker-new-label">새 카테고리</div>
          <div className="taste-picker-swatches">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                className={`taste-swatch${color === c.key ? ' selected' : ''}`}
                style={{ background: c.bg, borderColor: c.fg }}
                onClick={() => setColor(c.key)}
              />
            ))}
          </div>
          <div className="taste-picker-new-row">
            <input
              type="text"
              className="taste-picker-input"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') create();
                else if (e.key === 'Escape') onClose();
              }}
            />
            <button type="button" className="taste-picker-add" disabled={busy} onClick={create}>
              만들기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
