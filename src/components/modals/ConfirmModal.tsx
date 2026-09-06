import { useModal } from '../../context/ModalContext';

export function ConfirmModal({ message }: { message: string }) {
  const { resolveConfirm } = useModal();
  return (
    <div className="modal-overlay show">
      <div className="modal-box">
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="modal-ok" onClick={() => resolveConfirm(true)}>
            확인
          </button>
          <button type="button" className="modal-cancel" onClick={() => resolveConfirm(false)}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
