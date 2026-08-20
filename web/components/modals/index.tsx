"use client";
import { useRef } from "react";
import "./modal.css";
interface ModalProps {
  children: JSX.Element | JSX.Element[];
  show: boolean;
  onClose?: () => void;
}

const Modal = ({ children, show, onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: any) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose && onClose();
    }
  };
  return (
    <>
      {show && (
        <div className="modal" onClick={handleClickOutside}>
          <div ref={modalRef}>{children}</div>
        </div>
      )}
    </>
  );
};

export default Modal;
