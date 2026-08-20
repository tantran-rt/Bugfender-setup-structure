"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";

import "./textField.css";

interface InputProps {
  name: string;
  type: string;
  placeholder: string;
  value: number | string;
  startIcon?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  endIcon?: boolean;
  errors: string | null;
  touched: boolean;
  readonly?: boolean;
  autoFocus?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const TextInput = ({
  type,
  placeholder,
  value,
  startIcon,
  endIcon,
  name,
  errors,
  touched,
  readonly,
  inputMode,
  autoFocus,
  onChange
}: InputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      const isMobile =
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);
      if (!isMobile) {
        inputRef.current?.focus();
      }
    }
  }, [autoFocus]);

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div>
      <div className={`input-container ${isFocused ? "focused" : ""}`}>
        {/* <label className="placeholder" htmlFor={name}>
                    {isFocused ? placeholder.toUpperCase() : ""}
                </label> */}
        {startIcon && <div className="icon start-icon">{startIcon}</div>}
        <input
          ref={inputRef}
          className="app-input"
          id={name}
          name={name}
          type={showPassword ? "text" : type}
          inputMode={inputMode}
          placeholder={isFocused ? "" : placeholder}
          value={value}
          style={{
            paddingLeft: startIcon ? "50px" : undefined,
            paddingRight: endIcon ? "30px" : undefined
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={readonly}
          autoComplete="true"
          onChange={onChange}
        />
        {endIcon && (
          <div
            className="icon end-icon"
            onClick={handleTogglePasswordVisibility}
          >
            {showPassword ? (
              <Image
                src="/icons/eye-close.svg"
                alt="image"
                width={24}
                height={24}
                loading="lazy"
              />
            ) : (
              <Image
                src="/icons/eye-open.svg"
                alt="image"
                width={24}
                height={24}
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>
      {errors && touched && <p className="error">{errors}</p>}
    </div>
  );
};

export default TextInput;
