import { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import type { TastePost } from '../../shared/types';

function dateLabel(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

interface TasteReadViewProps {
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}

export function TasteReadView({ id, onBack, onEdit, onDeleted }: TasteReadViewProps) {
  const { isOwner } = useSession();
  const { confirm } = useModal();
  const [post, setPost] = useState<TastePost | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.taste.get(id).then((p) => {
      if (!cancelled) setPost(p);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function remove() {
    const ok = await confirm('이 글을 삭제할까요?');
    if (!ok) return;
    await api.taste.remove(id);
    onDeleted();
  }

  return (
    <div className="taste-read">
      <div className="taste-view-header">
        <button type="button" className="diary-back-btn" onClick={onBack}>
          ◀ 목록으로
        </button>
        {isOwner && post && (
          <div className="taste-owner-actions">
            <button type="button" className="diary-back-btn" onClick={onEdit}>
              수정
            </button>
            <button type="button" className="diary-back-btn taste-delete-btn" onClick={remove}>
              삭제
            </button>
          </div>
        )}
      </div>

      {post && (
        <>
          <h3 className="taste-read-title">{post.title}</h3>
          <div className="taste-read-meta">
            <span>{dateLabel(post.createdAt)}</span>
            {post.visibility === 'private' && <span className="taste-private-badge">비공개</span>}
          </div>
          <p className="taste-read-content">{post.content || '(내용 없음)'}</p>
        </>
      )}
    </div>
  );
}
