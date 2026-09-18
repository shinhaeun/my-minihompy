import type { TasteColor } from '../../shared/types';

// 주인장이 카테고리를 만들 때 고르는 색. 키는 서버의 COLOR_VALUES와 같아야 한다.
export const CATEGORY_COLORS: { key: TasteColor; label: string; bg: string; fg: string }[] = [
  { key: 'pink', label: '분홍', bg: '#FBE2EC', fg: '#A63A66' },
  { key: 'purple', label: '보라', bg: '#E8E0F7', fg: '#5B3A9E' },
  { key: 'blue', label: '파랑', bg: '#DDE8FA', fg: '#2F5A9E' },
  { key: 'green', label: '초록', bg: '#DDF0E4', fg: '#2F7048' },
  { key: 'yellow', label: '노랑', bg: '#FBEFD6', fg: '#8A5A16' },
  { key: 'orange', label: '주황', bg: '#FADFD6', fg: '#A04A2E' },
  { key: 'teal', label: '청록', bg: '#D9EFF0', fg: '#1F6B70' },
];

export function categoryColor(key: TasteColor) {
  return CATEGORY_COLORS.find((c) => c.key === key) ?? CATEGORY_COLORS[0];
}
