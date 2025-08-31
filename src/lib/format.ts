import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('MMM DD, YYYY');
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('MMM DD, YYYY HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatPhone = (phone: string): string => {
  // Egyptian phone number formatting
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
};

export const createWhatsAppUrl = (phone: string, message?: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const baseUrl = `https://wa.me/${cleanPhone}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

export const createTelUrl = (phone: string): string => {
  return `tel:${phone.replace(/\D/g, '')}`;
};
