import { useEffect, useRef, useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { useSession } from '../../context/SessionContext';

// 질문 문구는 비밀이 아님(답변/PIN만 서버에서 해시로 검증) — 원본과 동일하게 고정 표시
const OWNER_SECURITY_QUESTION = '좋아하는 것은?';

export function OwnerLoginModal() {
  const { resolveOwnerLogin, alert: showAlert } = useModal();
  const { login } = useSession();
  const [answer, setAnswer] = useState('');
  const [pin, setPin] = useState('');
  const answerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => answerRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  async function submit() {
    const ok = await login(answer.trim(), pin.trim());
    resolveOwnerLogin(ok);
    if (!ok) await showAlert('주인장이 아니에옹');
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit();
    else if (e.key === 'Escape') resolveOwnerLogin(false);
  }

  return (
    <div className="modal-overlay show">
      <div className="modal-box">
        <p>주인장 인증</p>
        <p className="owner-login-question">{OWNER_SECURITY_QUESTION}</p>
        <input
          ref={answerRef}
          type="text"
          className="modal-input"
          placeholder="인증 질문 답변"
          autoComplete="off"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <input
          type="password"
          className="modal-input"
          placeholder="인증 번호"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="modal-actions">
          <button type="button" className="modal-ok" onClick={submit}>
            확인
          </button>
          <button type="button" className="modal-cancel" onClick={() => resolveOwnerLogin(false)}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
