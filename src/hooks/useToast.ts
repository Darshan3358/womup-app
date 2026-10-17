import { useToastContext } from '../context/ToastContext';

/**
 * Global toast hook for triggering in-app toast feedback matching WormUp Notification SRS.
 *
 * Example:
 * const toast = useToast();
 * toast.showSuccess('Welcome to WormUp! ₹2,000 Shopping Coins added');
 * toast.showError('Payment failed. Please retry.');
 * toast.showWarning('Prices updated for new area');
 * toast.showInfo('Order placed! Arriving in 9 mins');
 * const loadId = toast.showLoading('Uploading documents...');
 * // later:
 * toast.hide(loadId);
 */
export const useToast = () => {
  return useToastContext();
};
