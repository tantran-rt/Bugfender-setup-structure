import { TbAlertSquareRounded } from "react-icons/tb";

import "./alert.css";

interface AlertProps {
  show: boolean;
  message: string;
  position?: "center" | "right";
}

export default function Alert({
  show,
  message,
  position = "center",
}: AlertProps) {
  return (
    <>
      {show && (
        <div className={`alert alert--${position}`}>
          <TbAlertSquareRounded
            color={position === "center" ? "f9d800" : "ff0000"}
            size={20}
          />
          <p className="alert-text">{message}</p>
        </div>
      )}
    </>
  );
}
