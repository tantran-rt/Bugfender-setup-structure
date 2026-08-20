"use client";

import { useState, ChangeEvent } from "react";
import { Field, ErrorMessage } from "formik";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import Image from "next/image";

import "./textField.css";

interface InputProps {
  name: string;
  type: string;
  placeholder: string;
  value: number | string;
  startIcon?: React.ReactNode;
  endIcon?: boolean;
  errors: any;
  touched: any;
  readonly?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const TextField = ({
  type,
  placeholder,
  value,
  startIcon,
  endIcon,
  name,
  errors,
  touched,
  readonly,
  onChange,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
        <Field
          className="app-input"
          id={name}
          name={name}
          type={showPassword ? "text" : type}
          placeholder={isFocused ? "" : placeholder.toUpperCase()}
          value={value}
          onChange={onChange}
          style={{
            paddingLeft: startIcon ? "48px" : undefined,
            paddingRight: endIcon ? "30px" : undefined,
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={readonly}
          autoComplete="true"
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
                src="/icons/eye-icon.svg"
                alt="image"
                width={24}
                height={24}
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>
      {/* {errors[`${name}`] && touched[`${name}`] && <ErrorMessage name={name} component="p" className="error" />} */}
      {errors?.[name] && touched?.[name] && (
        <ErrorMessage name={name} component="p" className="error" />
      )}
    </div>
  );
};

export default TextField;
