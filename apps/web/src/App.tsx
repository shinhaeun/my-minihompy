import { SessionProvider } from './context/SessionContext';
import { ModalProvider } from './context/ModalContext';
import { SearchProvider } from './context/SearchContext';
import { ProfileProvider } from './context/ProfileContext';
import { WindowChrome } from './components/layout/WindowChrome';
import { ModalRoot } from './components/modals/ModalRoot';
import { ProfilePage } from './components/pages/ProfilePage';
import { BgmPage } from './components/pages/BgmPage';
import { GuestbookPage } from './components/pages/GuestbookPage';
import { CalendarTabPage } from './components/pages/CalendarTabPage';
import { DiaryPage } from './components/pages/DiaryPage';
import { TastePage } from './components/pages/TastePage';
import { FriendPage } from './components/pages/FriendPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { useTabHistory } from './hooks/useTabHistory';
import { useCursorSparkle } from './hooks/useCursorSparkle';
import type { NavPage } from './shared/types';

function AppShell() {
  const { current, goTo, back, forward, canBack, canForward } = useTabHistory('profile');
  useCursorSparkle();

  function onSelectTab(page: NavPage) {
    goTo(page);
  }

  return (
    <>
      <WindowChrome
        current={current}
        canBack={canBack}
        canForward={canForward}
        onBack={back}
        onForward={forward}
        onGoTo={goTo}
        onSelectTab={onSelectTab}
      >
        <ProfilePage active={current === 'profile'} />
        <BgmPage active={current === 'bgm'} />
        <GuestbookPage active={current === 'guestbook'} />
        <CalendarTabPage active={current === 'calendar'} />
        <DiaryPage active={current === 'diary'} />
        <TastePage active={current === 'taste'} />
        <FriendPage active={current === 'friend'} />
        <SettingsPage active={current === 'settings'} />
      </WindowChrome>
      <ModalRoot />
    </>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <ProfileProvider>
        <SearchProvider>
          <ModalProvider>
            <AppShell />
          </ModalProvider>
        </SearchProvider>
      </ProfileProvider>
    </SessionProvider>
  );
}
