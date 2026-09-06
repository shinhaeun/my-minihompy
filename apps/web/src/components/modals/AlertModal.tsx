import { useModal } from '../../context/ModalContext';

export function AlertModal({ message }: { message: string }) {
  const { resolveAlert } = useModal();
  return (
    <div className="modal-overlay show">
      <div className="modal-box">
        <p>{message}</p>
        <div className="modal-actions single">
          <button type="button" className="modal-ok" onClick={() => resolveAlert()}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
