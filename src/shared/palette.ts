import type { TasteColor } from './types';

/** 카테고리 뱃지와 일정 색이 함께 쓰는 파스텔 팔레트. 키는 서버의 COLOR_VALUES와 같아야 한다. */
export const PALETTE: { key: TasteColor; label: string; bg: string; fg: string }[] = [
  { key: 'pink', label: '분홍', bg: '#FBE2EC', fg: '#A63A66' },
  { key: 'purple', label: '보라', bg: '#E8E0F7', fg: '#5B3A9E' },
  { key: 'blue', label: '파랑', bg: '#DDE8FA', fg: '#2F5A9E' },
  { key: 'green', label: '초록', bg: '#DDF0E4', fg: '#2F7048' },
  { key: 'yellow', label: '노랑', bg: '#FBEFD6', fg: '#8A5A16' },
  { key: 'orange', label: '주황', bg: '#FADFD6', fg: '#A04A2E' },
  { key: 'teal', label: '청록', bg: '#D9EFF0', fg: '#1F6B70' },
];

export function paletteColor(key: TasteColor) {
  return PALETTE.find((c) => c.key === key) ?? PALETTE[0];
}
