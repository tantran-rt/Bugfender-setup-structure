'use client';
import './documentTypeModal.css';

interface IModalProps {
    onClose: () => void;
    setResult: (name: string) => void;
}

const result = [
    { id: 1, title: 'Positive' },
    { id: 2, title: 'Negative' },
    { id: 3, title: 'Inconclusive' }
];

const AlcoOraltoxResultTypeModal = ({ onClose, setResult }: IModalProps) => {
    const handleItemClick = (title: string) => {
        setResult(title);
        onClose();
    };

    return (
        <div className="modal-overlay-document-type" onClick={onClose}>
            <div className="modal-content-document-type" onClick={(e) => e.stopPropagation()}>
                <h1>Results</h1>
                <br />
                {result.map(item => (
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

export default AlcoOraltoxResultTypeModal;
