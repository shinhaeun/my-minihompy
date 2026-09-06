import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ModalState =
  | { type: 'confirm'; message: string; resolve: (v: boolean) => void }
  | { type: 'alert'; message: string; resolve: () => void }
  | { type: 'ownerLogin'; resolve: (v: boolean) => void }
  | null;

interface ModalValue {
  modal: ModalState;
  confirm: (message: string) => Promise<boolean>;
  alert: (message: string) => Promise<void>;
  ownerLogin: () => Promise<boolean>;
  resolveConfirm: (v: boolean) => void;
  resolveAlert: () => void;
  resolveOwnerLogin: (v: boolean) => void;
}

const ModalContext = createContext<ModalValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);
  const pending = useRef<ModalState>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      const state: ModalState = { type: 'confirm', message, resolve };
      pending.current = state;
      setModal(state);
    });
  }, []);

  const alertFn = useCallback((message: string) => {
    return new Promise<void>((resolve) => {
      const state: ModalState = { type: 'alert', message, resolve };
      pending.current = state;
      setModal(state);
    });
  }, []);

  const ownerLogin = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const state: ModalState = { type: 'ownerLogin', resolve };
      pending.current = state;
      setModal(state);
    });
  }, []);

  const resolveConfirm = useCallback((v: boolean) => {
    if (pending.current?.type === 'confirm') pending.current.resolve(v);
    pending.current = null;
    setModal(null);
  }, []);

  const resolveAlert = useCallback(() => {
    if (pending.current?.type === 'alert') pending.current.resolve();
    pending.current = null;
    setModal(null);
  }, []);

  const resolveOwnerLogin = useCallback((v: boolean) => {
    if (pending.current?.type === 'ownerLogin') pending.current.resolve(v);
    pending.current = null;
    setModal(null);
  }, []);

  return (
    <ModalContext.Provider
      value={{ modal, confirm, alert: alertFn, ownerLogin, resolveConfirm, resolveAlert, resolveOwnerLogin }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
