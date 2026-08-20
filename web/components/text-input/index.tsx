import { CSSProperties } from 'react';
import './text-input.css';

interface TextInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    style?: CSSProperties | undefined;
    textareaLabel?: string;
}

const TextAreaField = ({ value, onChange, placeholder, style }: TextInputProps) => {
    return (
        <div className="textarea-wrap">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={5}
                style={style}
            />
        </div>
    );
};

export default TextAreaField;
