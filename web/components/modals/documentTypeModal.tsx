'use client';

import './documentTypeModal.css';

interface ModalProps {
    onClose: () => void;
    setImageName: (name: string) => void;
    triggerCameraFileUpload: () => void;
}

const typeOfImages = [
    { id: 1, title: 'Lab Report' },
    { id: 2, title: 'Chain of Custody' },
    { id: 3, title: 'Rapid Test Device' }
];

const DocumentTypeModal = ({ onClose, setImageName, triggerCameraFileUpload }: ModalProps) => {
    const handleItemClick = (title: string) => {
        setImageName(title);
        triggerCameraFileUpload();
        onClose();
    };

    return (
        <div className="modal-overlay-document-type" onClick={onClose}>
            <div className="modal-content-document-type" onClick={(e) => e.stopPropagation()}>
                <h1>Type of Image</h1>
                <br />
                {typeOfImages.map(item => (
                    <div
                        key={item.id}
                        className="wrap-modal-items"
                        onClick={() => handleItemClick(item.title)}
                    >
                        <p>{item.title}</p>
                        <div className="line-b"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentTypeModal;
