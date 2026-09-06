import { useModal } from '../../context/ModalContext';
import { ConfirmModal } from './ConfirmModal';
import { AlertModal } from './AlertModal';
import { OwnerLoginModal } from './OwnerLoginModal';

export function ModalRoot() {
  const { modal } = useModal();
  if (!modal) return null;
  switch (modal.type) {
    case 'confirm':
      return <ConfirmModal message={modal.message} />;
    case 'alert':
      return <AlertModal message={modal.message} />;
    case 'ownerLogin':
      return <OwnerLoginModal />;
    default:
      return null;
  }
}
