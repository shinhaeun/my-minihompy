import { useSearchable } from '../common/Highlight';

const LINE1 = '취향정보 기능은 다음 단계에서 만들 거예요.';
const LINE2 = '내 취향에 대해 자유롭게 쓸 수 있는 공간이 여기 들어와요.';

export function TastePage({ active }: { active: boolean }) {
  useSearchable('taste-placeholder', 'taste', `${LINE1} ${LINE2}`);
  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="page-placeholder">
        <span className="big">❖</span>
        {LINE1}
        <br />
        {LINE2}
      </div>
    </div>
  );
}
