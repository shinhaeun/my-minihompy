import { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import type { GuestbookEntry } from '../../shared/types';
import { PinIcon } from '../guestbook/PinIcon';
import { Highlight, useSearchable } from '../common/Highlight';

function GuestbookEntryText({ entry }: { entry: GuestbookEntry }) {
  useSearchable(`guestbook-${entry.id}`, 'guestbook', entry.message);
  return <Highlight id={`guestbook-${entry.id}`} text={entry.message} />;
}

export function GuestbookPage({ active }: { active: boolean }) {
  const { isOwner } = useSession();
  const { confirm } = useModal();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [input, setInput] = useState('');

  async function load() {
    try {
      setEntries(await api.guestbook.list());
    } catch {
      // 조회 실패 시 목록 비워둠
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    const message = input.trim();
    if (!message) return;
    await api.guestbook.create(message);
    setInput('');
    await load();
  }

  async function togglePin(id: string) {
    await api.guestbook.pin(id);
    await load();
  }

  async function remove(id: string) {
    const ok = await confirm('정말 삭제하시겠습니까?');
    if (!ok) return;
    await api.guestbook.remove(id);
    await load();
  }

  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="diary-post guestbook">
        <h3>♥ 방명록</h3>
        <div className="entry-list">
          {entries.map((entry) => (
            <div key={entry.id} className={`entry${entry.pinned ? ' pinned' : ''}`}>
              {isOwner ? (
                <button
                  type="button"
                  className={`entry-pin-btn${entry.pinned ? ' active' : ''}`}
                  title={entry.pinned ? '고정 해제' : '고정하기'}
                  onClick={() => togglePin(entry.id)}
                >
                  <PinIcon active={entry.pinned} />
                </button>
              ) : (
                entry.pinned && <PinIcon active />
              )}
              <div className="entry-body">
                <b>{entry.name}</b>
                <GuestbookEntryText entry={entry} />
              </div>
              <span className="entry-date">{entry.date}</span>
              {isOwner && (
                <button
                  type="button"
                  className="entry-delete-btn"
                  title="삭제"
                  onClick={() => remove(entry.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="guestbook-input">
          <input
            type="text"
            placeholder="방명록을 남겨주세요 :)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
          <button type="button" onClick={submit}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
