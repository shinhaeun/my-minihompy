import { useState } from 'react';
import { TasteList } from '../taste/TasteList';
import { TasteReadView } from '../taste/TasteReadView';
import { TasteWriteView } from '../taste/TasteWriteView';

type View =
  | { mode: 'list' }
  | { mode: 'read'; id: string }
  | { mode: 'write'; id: string | null };

export function TastePage({ active }: { active: boolean }) {
  const [view, setView] = useState<View>({ mode: 'list' });
  const [refreshToken, setRefreshToken] = useState(0);

  function backToList() {
    setRefreshToken((n) => n + 1);
    setView({ mode: 'list' });
  }

  return (
    <div className={`page${active ? ' active' : ''}`}>
      {view.mode === 'list' && (
        <TasteList
          refreshToken={refreshToken}
          onOpenRead={(id) => setView({ mode: 'read', id })}
          onOpenWrite={() => setView({ mode: 'write', id: null })}
        />
      )}
      {view.mode === 'read' && (
        <TasteReadView
          id={view.id}
          onBack={() => setView({ mode: 'list' })}
          onEdit={() => setView({ mode: 'write', id: view.id })}
          onDeleted={backToList}
        />
      )}
      {view.mode === 'write' && (
        <TasteWriteView
          id={view.id}
          onBack={() => setView({ mode: 'list' })}
          onSaved={backToList}
        />
      )}
    </div>
  );
}
