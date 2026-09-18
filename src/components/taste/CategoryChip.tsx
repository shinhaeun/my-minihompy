import { categoryColor } from './categoryColor';

export function CategoryChip({ name }: { name: string }) {
  const { bg, fg } = categoryColor(name);
  return (
    <span className="taste-category-chip" style={{ background: bg, color: fg }}>
      {name}
    </span>
  );
}
