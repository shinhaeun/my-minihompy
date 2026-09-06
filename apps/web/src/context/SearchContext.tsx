import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { SEARCH_PAGE_ORDER, type Page } from '../shared/types';

interface SearchField {
  page: Page;
  getText: () => string;
}

interface Match {
  fieldId: string;
  query: string;
}

interface SearchValue {
  activeMatch: Match | null;
  registerField: (id: string, field: SearchField) => void;
  unregisterField: (id: string) => void;
  search: (keyword: string) => Page | null;
  clear: () => void;
}

const SearchContext = createContext<SearchValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const registry = useRef(new Map<string, SearchField>());
  const order = useRef<string[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  const registerField = useCallback((id: string, field: SearchField) => {
    if (!registry.current.has(id)) order.current.push(id);
    registry.current.set(id, field);
  }, []);

  const unregisterField = useCallback((id: string) => {
    registry.current.delete(id);
    order.current = order.current.filter((x) => x !== id);
  }, []);

  const search = useCallback((keyword: string) => {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return null;

    for (const page of SEARCH_PAGE_ORDER) {
      for (const id of order.current) {
        const field = registry.current.get(id);
        if (!field || field.page !== page) continue;
        const text = field.getText();
        if (text.toLowerCase().includes(needle)) {
          setActiveMatch({ fieldId: id, query: keyword });
          return page;
        }
      }
    }
    return null;
  }, []);

  const clear = useCallback(() => setActiveMatch(null), []);

  return (
    <SearchContext.Provider value={{ activeMatch, registerField, unregisterField, search, clear }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
