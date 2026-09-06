import { useEffect, useState, type ReactNode } from 'react';
import { Toolbar } from './Toolbar';
import { NavTabs } from './NavTabs';
import type { NavPage, Page } from '../../shared/types';
import { useSession } from '../../context/SessionContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';

const BG_STARS = [
  { top: '6%', left: '10%', delay: '0s', char: '✦' },
  { top: '14%', left: '82%', delay: '0.4s', char: '✧' },
  { top: '30%', left: '5%', delay: '0.8s', char: '✦' },
  { top: '42%', left: '92%', delay: '1.2s', char: '✧' },
  { top: '58%', left: '8%', delay: '1.6s', char: '✦' },
  { top: '66%', left: '88%', delay: '0.2s', char: '✧' },
  { top: '80%', left: '14%', delay: '0.6s', char: '✦' },
  { top: '88%', left: '78%', delay: '1s', char: '✧' },
  { top: '20%', left: '50%', delay: '1.4s', char: '✦' },
];

interface WindowChromeProps {
  current: Page;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onGoTo: (page: Page) => void;
  onSelectTab: (page: NavPage) => void;
  children: ReactNode;
}

export function WindowChrome({
  current,
  canBack,
  canForward,
  onBack,
  onForward,
  onGoTo,
  onSelectTab,
  children,
}: WindowChromeProps) {
  const { isOwner, logout } = useSession();
  const { ownerLogin } = useModal();
  const [visits, setVisits] = useState({ today: 0, total: 0 });

  useEffect(() => {
    api.visits.ping().then(setVisits).catch(() => {});
  }, []);

  async function onOwnerModeClick() {
    if (isOwner) {
      await logout();
      return;
    }
    await ownerLogin();
  }

  return (
    <>
      <div className="win-window">
        <div className="win-titlebar">
          <div className="win-title">OOO의 미니홈피</div>
          <div className="win-controls">
            <button>_</button>
            <button>□</button>
            <button className="close">✕</button>
          </div>
        </div>

        <Toolbar canBack={canBack} canForward={canForward} onBack={onBack} onForward={onForward} onGoTo={onGoTo} />

        <div className="win-body">
          {BG_STARS.map((s, i) => (
            <span
              key={i}
              className="bg-star"
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            >
              {s.char}
            </span>
          ))}

          <div className="frame">
            <div className="titlebar">
              <span>♡ OOO's MiniHomepage ♡</span>
              <span className="dots">
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </span>
            </div>

            <NavTabs current={current} onSelect={onSelectTab} />

            <div className="banner">
              <h1>☆*: .｡. 여기는 OOO의 미니홈피 .｡.:*☆</h1>
              <p>
                <span className="sparkle">✧</span> 놀러와줘서 고마워요! 방명록 남기고 가요{' '}
                <span className="sparkle">✧</span>
              </p>
            </div>

            <div className="counter">
              <span>
                TODAY <b>{visits.today.toLocaleString('ko-KR')}</b>
              </span>
              <span>
                TOTAL <b>{visits.total.toLocaleString('ko-KR')}</b>
              </span>
              <span>
                BGM <b>재생중인 노래 제목</b>
                <span className="eq">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </span>
            </div>

            <div className="pages">{children}</div>

            <footer>
              ⓒ 2026 OOO's MiniHomepage. Made with ♥
              <div className="visitor-badge">
                ★ 방문자 뱃지 <b>#{visits.today.toLocaleString('ko-KR')}</b>
              </div>
              <button
                type="button"
                className={`owner-mode-btn${isOwner ? ' active' : ''}`}
                onClick={onOwnerModeClick}
              >
                {isOwner ? '주인장모드 로그아웃' : '주인장모드 로그인'}
              </button>
            </footer>
          </div>
        </div>

        <div className="win-statusbar">
          <span>완료</span>
          <span>인터넷</span>
        </div>
      </div>

      <div className="crt-overlay crt-vignette" />
      <div className="crt-noise" />
      <div className="crt-overlay crt-scanlines" />
    </>
  );
}
