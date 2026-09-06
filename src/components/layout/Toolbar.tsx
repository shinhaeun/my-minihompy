import { useState } from 'react';
import { useSearch } from '../../context/SearchContext';
import { useModal } from '../../context/ModalContext';
import type { Page } from '../../shared/types';

interface ToolbarProps {
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onGoTo: (page: Page) => void;
}

export function Toolbar({ canBack, canForward, onBack, onForward, onGoTo }: ToolbarProps) {
  const { search, clear } = useSearch();
  const { alert: showAlert } = useModal();
  const [showInput, setShowInput] = useState(false);
  const [keyword, setKeyword] = useState('');

  function runSearch() {
    const page = search(keyword);
    if (!page) {
      showAlert(`"${keyword}"에 대한 검색 결과가 없어요.`);
      return;
    }
    onGoTo(page);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') runSearch();
    else if (e.key === 'Escape') {
      clear();
      setKeyword('');
      setShowInput(false);
    }
  }

  return (
    <div className="win-icontoolbar">
      <button type="button" className="tool-btn" disabled={!canBack} onClick={onBack}>
        <span className="ico">◀</span>뒤로
      </button>
      <button type="button" className="tool-btn" disabled={!canForward} onClick={onForward}>
        <span className="ico">▶</span>앞으로
      </button>
      <div className="divider" />
      <button type="button" className="tool-btn" onClick={() => onGoTo('friend')}>
        <span className="ico">♥</span>친구
      </button>
      <div className="divider" />
      <div className="tool-search">
        <button type="button" className="tool-btn" onClick={() => setShowInput((v) => !v)}>
          검색
        </button>
        <input
          type="text"
          className={`tool-search-input${showInput ? ' show' : ''}`}
          placeholder="검색어 입력 후 Enter"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
