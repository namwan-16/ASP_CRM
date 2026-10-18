import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AppToastContainer() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3500}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="colored"
      limit={3}
    />
  );
}
