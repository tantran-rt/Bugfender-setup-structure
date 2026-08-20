import React, { memo, useMemo } from "react";
import Link from "next/link";

import "./button.css";

interface ButtonProps {
  blue?: boolean;
  white?: boolean;
  classname?: string;
  children:
    | string
    | React.JSX.Element
    | React.JSX.Element[]
    | (string | React.JSX.Element)[];
  type?: "submit" | "reset" | "button";
  disabled?: boolean;
  feature?: boolean;
  link?: string;
  style?: React.CSSProperties;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement> | any) => void;
  loading?: boolean;
}

const ButtonComponent = ({
  blue,
  white,
  classname,
  children,
  type = "button",
  disabled = false,
  link,
  style,
  onClick,
  loading,
}: ButtonProps) => {
  const getButtonClassName = useMemo(() => {
    if (blue) return "blue";
    if (white) return "white";
    return classname;
  }, [blue, white, classname]);

  const memoizedDisabled = useMemo(() => {
    return loading || disabled;
  }, [disabled, loading]);

  const buttonElement = (
    <button
      className={getButtonClassName}
      type={type}
      disabled={memoizedDisabled}
      onClick={onClick}
      style={style}
    >
      {loading ? <span className="loader"></span> : children}
    </button>
  );

  if (link && !memoizedDisabled) {
    return (
      <Link
        href={link}
        className={getButtonClassName}
        style={{ width: "100%", ...style }}
      >
        {children}
      </Link>
    );
  }

  return buttonElement;
};

const Button = memo(ButtonComponent);

export default Button;
