import { toast } from "react-toastify";

export const notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  warning: (message) => toast.warning(message),
  info: (message) => toast.info(message),
  loading: (message) => toast.loading(message),
  dismiss: (toastId) => toast.dismiss(toastId),
};
