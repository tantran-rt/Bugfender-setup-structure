// import { useParams, usePathname } from "next/navigation";
import { ToastContainer, ToastPosition } from "react-toastify";

interface Props {
  toastifyPosition: ToastPosition;
}
const Toastify = ({ toastifyPosition }: Props) => {
  //   const pathname = usePathname();

  return (
    <ToastContainer
      position={toastifyPosition}
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={true}
      limit={1}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      closeOnClick
      theme="dark"
      style={{ zIndex: "10001" }}
    />
  );
};

export default Toastify;
