import type { TasteCategory } from '../../shared/types';
import { categoryColor } from './categoryColor';

export function CategoryChip({ category }: { category: TasteCategory }) {
  const { bg, fg } = categoryColor(category.color);
  return (
    <span className="taste-category-chip" style={{ background: bg, color: fg }}>
      {category.name}
    </span>
  );
}
