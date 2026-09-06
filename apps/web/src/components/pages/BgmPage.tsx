import { useSearchable } from '../common/Highlight';

const LINE1 = 'BGM 기능은 다음 단계에서 만들 거예요.';
const LINE2 = '내가 고른 음악을 재생할 수 있는 공간이 여기 들어와요.';

export function BgmPage({ active }: { active: boolean }) {
  useSearchable('bgm-placeholder', 'bgm', `${LINE1} ${LINE2}`);
  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="page-placeholder">
        <span className="big">♪</span>
        {LINE1}
        <br />
        {LINE2}
      </div>
    </div>
  );
}
