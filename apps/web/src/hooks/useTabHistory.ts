import { useCallback, useRef, useState } from 'react';
import type { Page } from '../shared/types';

// 원본의 tabHistory/tabHistoryIndex 로직을 그대로 포팅.
// goTo()는 현재 인덱스 이후를 잘라내고 새 페이지를 push, back/forward는 인덱스만 이동(새 기록을 추가하지 않음).
// 브라우저 URL과는 무관하게 동작(원본도 history.pushState를 쓰지 않음).
export function useTabHistory(initial: Page) {
  const historyRef = useRef<Page[]>([initial]);
  const indexRef = useRef(0);
  const [current, setCurrent] = useState<Page>(initial);
  const [, forceRender] = useState(0);

  const goTo = useCallback((page: Page) => {
    const history = historyRef.current.slice(0, indexRef.current + 1);
    history.push(page);
    historyRef.current = history;
    indexRef.current = history.length - 1;
    setCurrent(page);
    forceRender((n) => n + 1);
  }, []);

  const back = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current -= 1;
    setCurrent(historyRef.current[indexRef.current]);
    forceRender((n) => n + 1);
  }, []);

  const forward = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    indexRef.current += 1;
    setCurrent(historyRef.current[indexRef.current]);
    forceRender((n) => n + 1);
  }, []);

  return {
    current,
    goTo,
    back,
    forward,
    canBack: indexRef.current > 0,
    canForward: indexRef.current < historyRef.current.length - 1,
  };
}
