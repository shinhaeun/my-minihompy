import { useSearchable } from '../common/Highlight';

// 주의: nav-tab의 'calendar' 페이지는 플레이스홀더일 뿐, 실제 캘린더는 DiaryPage 안에 있음.
const LINE1 = '캘린더 기능은 다음 단계에서 만들 거예요.';
const LINE2 = '날짜별로 일정을 등록하고 볼 수 있는 공간이 여기 들어와요.';

export function CalendarTabPage({ active }: { active: boolean }) {
  useSearchable('calendar-placeholder', 'calendar', `${LINE1} ${LINE2}`);
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
