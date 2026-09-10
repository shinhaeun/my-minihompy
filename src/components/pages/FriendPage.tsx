import { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import type { FavoritePerson } from '../../shared/types';
import { Highlight, useSearchable } from '../common/Highlight';

function FavoriteEntryText({ person }: { person: FavoritePerson }) {
  useSearchable(`favorite-${person.id}`, 'friend', `${person.name} ${person.note ?? ''}`);
  return (
    <div className="entry-body">
      <b>{person.name}</b>
      {person.note && <Highlight id={`favorite-${person.id}`} text={person.note} />}
    </div>
  );
}

export function FriendPage({ active }: { active: boolean }) {
  const { isOwner } = useSession();
  const { confirm } = useModal();
  const [people, setPeople] = useState<FavoritePerson[]>([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  async function load() {
    try {
      setPeople(await api.favorites.list());
    } catch {
      // 조회 실패 시 목록 비워둠
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await api.favorites.create(trimmed, note.trim());
    setName('');
    setNote('');
    await load();
  }

  async function remove(id: string) {
    const ok = await confirm('정말 삭제하시겠습니까?');
    if (!ok) return;
    await api.favorites.remove(id);
    await load();
  }

  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="diary-post favorites">
        <h3>♥ 좋아하는 사람들</h3>
        <div className="entry-list">
          {people.map((person) => (
            <div key={person.id} className="entry">
              <FavoriteEntryText person={person} />
              {isOwner && (
                <button
                  type="button"
                  className="entry-delete-btn"
                  title="삭제"
                  onClick={() => remove(person.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {people.length === 0 && <p className="favorites-empty">아직 등록된 사람이 없어요.</p>}
        </div>
        {isOwner && (
          <div className="guestbook-input favorites-input">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="한마디 (선택)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            <button type="button" onClick={submit}>
              추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
