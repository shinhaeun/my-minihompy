// 카테고리는 주인장이 자유롭게 만들기 때문에 색을 미리 정해둘 수 없다.
// 이름을 해시해서 파스텔 팔레트 중 하나에 고정 배정 — 같은 카테고리는 항상 같은 색으로 보인다.
const PALETTE = [
  { bg: '#FBE2EC', fg: '#A63A66' }, // 핑크
  { bg: '#E8E0F7', fg: '#5B3A9E' }, // 보라
  { bg: '#DDE8FA', fg: '#2F5A9E' }, // 파랑
  { bg: '#DDF0E4', fg: '#2F7048' }, // 초록
  { bg: '#FBEFD6', fg: '#8A5A16' }, // 노랑
  { bg: '#FADFD6', fg: '#A04A2E' }, // 주황
  { bg: '#D9EFF0', fg: '#1F6B70' }, // 청록
] as const;

export function categoryColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
