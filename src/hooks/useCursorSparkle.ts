import { useEffect } from 'react';

// 커서를 따라다니는 반짝이 트레일. 자체 정리되는(animationend에 remove) 순수 장식 효과라
// React state 대신 DOM을 직접 조작한다 (원본 구현과 동일한 방식).
export function useCursorSparkle() {
  useEffect(() => {
    let lastSparkleTime = 0;

    function onMouseMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastSparkleTime < 90) return;
      lastSparkleTime = now;

      const el = document.createElement('span');
      el.className = 'cursor-sparkle';
      el.textContent = Math.random() > 0.5 ? '✦' : '★';
      el.style.left = e.clientX + 'px';
      el.style.top = e.clientY + 'px';
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }

    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);
}
