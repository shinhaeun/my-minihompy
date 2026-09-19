import { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import type { TastePostSummary } from '../../shared/types';
import { Highlight, useSearchable } from '../common/Highlight';
import { CategoryChip } from './CategoryChip';

function dateLabel(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

function TastePostCard({ post, onOpen }: { post: TastePostSummary; onOpen: () => void }) {
  useSearchable(`taste-${post.id}`, 'taste', `${post.category?.name ?? ''} ${post.title} ${post.excerpt}`);
  return (
    <div className="taste-post" onClick={onOpen}>
      <div className="taste-post-main">
        <h3>
          {post.category && <CategoryChip category={post.category} />}
          <Highlight id={`taste-${post.id}`} text={post.title} />
          {post.visibility === 'private' && <span className="taste-private-badge">비공개</span>}
        </h3>
        <div className="date">{dateLabel(post.createdAt)}</div>
        {post.excerpt && <p>{post.excerpt}</p>}
      </div>
      {post.thumbUrl && (
        <div className="taste-post-thumb">
          <img src={post.thumbUrl} alt="" />
        </div>
      )}
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
  const [filter, setFilter] = useState<string | null>(null);

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

  // 필터 버튼은 실제로 글이 달려 있는 카테고리만 (이름 기준으로 중복 제거)
  const categories = [...new Map(
    posts.filter((p) => p.category).map((p) => [p.category!.id, p.category!]),
  ).values()];
  const visible = filter ? posts.filter((p) => p.category?.id === filter) : posts;

  return (
    <div className="taste-list">
      {isOwner && (
        <button type="button" className="taste-new-btn" onClick={onOpenWrite}>
          ✎ 새 글 쓰기
        </button>
      )}

      {categories.length > 0 && (
        <div className="taste-filter-row">
          <button
            type="button"
            className={`taste-filter-btn${filter === null ? ' active' : ''}`}
            onClick={() => setFilter(null)}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`taste-filter-btn${filter === category.id ? ' active' : ''}`}
              onClick={() => setFilter(filter === category.id ? null : category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {visible.map((post) => (
        <TastePostCard key={post.id} post={post} onOpen={() => onOpenRead(post.id)} />
      ))}
      {visible.length === 0 && (
        <p className="taste-empty">
          {filter ? '이 카테고리에 글이 없어요.' : '아직 올라온 글이 없어요.'}
        </p>
      )}
    </div>
  );
}
