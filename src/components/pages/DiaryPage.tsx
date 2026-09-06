import { useState } from 'react';
import { DiaryCalendar } from '../diary/DiaryCalendar';
import { DiaryWriteView } from '../diary/DiaryWriteView';
import { DiaryReadView } from '../diary/DiaryReadView';

type View = { mode: 'calendar' } | { mode: 'write'; date: string } | { mode: 'read'; date: string };

export function DiaryPage({ active }: { active: boolean }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<View>({ mode: 'calendar' });
  const [refreshToken, setRefreshToken] = useState(0);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className={`page${active ? ' active' : ''}`}>
      {view.mode === 'calendar' && (
        <DiaryCalendar
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          onOpenWrite={(date) => setView({ mode: 'write', date })}
          onOpenRead={(date) => setView({ mode: 'read', date })}
          refreshToken={refreshToken}
        />
      )}
      {view.mode === 'write' && (
        <DiaryWriteView
          date={view.date}
          onBack={() => setView({ mode: 'calendar' })}
          onSaved={() => {
            setRefreshToken((n) => n + 1);
            setView({ mode: 'calendar' });
          }}
        />
      )}
      {view.mode === 'read' && (
        <DiaryReadView date={view.date} onBack={() => setView({ mode: 'calendar' })} />
      )}
    </div>
  );
}
