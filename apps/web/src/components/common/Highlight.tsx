import { useEffect, useRef } from 'react';
import { useSearch } from '../../context/SearchContext';
import type { Page } from '../../shared/types';

// 검색 인덱스에 필드를 등록하고, 매치되면 <mark>로 감싸 표시 + 스크롤.
export function useSearchable(id: string, page: Page, text: string) {
  const { registerField, unregisterField } = useSearch();

  useEffect(() => {
    registerField(id, { page, getText: () => text });
    return () => unregisterField(id);
  }, [id, page, text, registerField, unregisterField]);
}

export function Highlight({ id, text }: { id: string; text: string }) {
  const { activeMatch } = useSearch();
  const ref = useRef<HTMLSpanElement>(null);
  const isActive = activeMatch?.fieldId === id;

  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [isActive]);

  if (!isActive || !activeMatch) return <>{text}</>;

  const query = activeMatch.query;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <span ref={ref}>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}
