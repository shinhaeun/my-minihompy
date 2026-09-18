import { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import type { TastePostSummary } from '../../shared/types';
import { Highlight, useSearchable } from '../common/Highlight';

function dateLabel(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

function TastePostCard({ post, onOpen }: { post: TastePostSummary; onOpen: () => void }) {
  useSearchable(`taste-${post.id}`, 'taste', `${post.title} ${post.excerpt}`);
  return (
    <div className="taste-post" onClick={onOpen}>
      <h3>
        <Highlight id={`taste-${post.id}`} text={post.title} />
        {post.visibility === 'private' && <span className="taste-private-badge">비공개</span>}
      </h3>
      <div className="date">{dateLabel(post.createdAt)}</div>
      {post.excerpt && <p>{post.excerpt}</p>}
    </div>
  );
}

interface TasteListProps {
  onOpenRead: (id: string) => void;
  onOpenWrite: () => void;
  refreshToken: number;
}

export function TasteList({ onOpenRead, onOpenWrite, refreshToken }: TasteListProps) {
  const { isOwner } = useSession();
  const [posts, setPosts] = useState<TastePostSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.taste
      .list()
      .then((list) => {
        if (!cancelled) setPosts(list);
      })
      .catch(() => {
        // 조회 실패 시 목록 비워둠
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  return (
    <div className="taste-list">
      {isOwner && (
        <button type="button" className="taste-new-btn" onClick={onOpenWrite}>
          ✎ 새 글 쓰기
        </button>
      )}
      {posts.map((post) => (
        <TastePostCard key={post.id} post={post} onOpen={() => onOpenRead(post.id)} />
      ))}
      {posts.length === 0 && <p className="taste-empty">아직 올라온 글이 없어요.</p>}
    </div>
  );
}
