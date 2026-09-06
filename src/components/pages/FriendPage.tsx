import { useSearchable } from '../common/Highlight';

const LINE1 = '친구(일촌) 기능은 다음 단계에서 만들 거예요.';
const LINE2 = '친구를 맺고 목록을 볼 수 있는 공간이 여기 들어와요.';

export function FriendPage({ active }: { active: boolean }) {
  useSearchable('friend-placeholder', 'friend', `${LINE1} ${LINE2}`);
  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="page-placeholder">
        <span className="big">♥</span>
        {LINE1}
        <br />
        {LINE2}
      </div>
    </div>
  );
}
