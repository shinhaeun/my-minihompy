import type { NavPage } from '../../shared/types';
import { NAV_PAGES } from '../../shared/types';

const LABELS: Record<NavPage, string> = {
  profile: '프로필',
  bgm: 'BGM',
  guestbook: '방명록',
  calendar: '캘린더',
  diary: '일기장',
  taste: '취향정보',
  settings: '설정',
};

export function NavTabs({ current, onSelect }: { current: string; onSelect: (page: NavPage) => void }) {
  return (
    <div className="nav-tabs">
      {NAV_PAGES.map((page) => (
        <div
          key={page}
          className={`nav-tab${current === page ? ' active' : ''}`}
          onClick={() => onSelect(page)}
        >
          {LABELS[page]}
        </div>
      ))}
    </div>
  );
}
