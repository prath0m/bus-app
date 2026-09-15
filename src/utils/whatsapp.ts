import { Linking, Alert } from 'react-native';

// Matches the Student model's contactNumber validation (10-15 digits,
// optional leading +). Bare 10-digit numbers are assumed to be Indian
// mobile numbers and get the country code prefixed for wa.me.
export const normalizePhoneForWhatsApp = (raw: string): string => {
  const digitsOnly = raw.replace(/[^\d]/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
};

export interface TemplateVars {
  name: string;
  amount: number | string;
  month: string;
  year: number | string;
  dueDate?: string;
  ownerName?: string;
}

export const fillTemplate = (template: string, vars: TemplateVars): string => {
  return template
    .replace(/{name}/g, vars.name)
    .replace(/{amount}/g, String(vars.amount))
    .replace(/{month}/g, vars.month)
    .replace(/{year}/g, String(vars.year))
    .replace(/{dueDate}/g, vars.dueDate ?? '')
    .replace(/{ownerName}/g, vars.ownerName ?? '');
};

export interface ReceiptVars {
  name: string;
  amount: number | string;
  month: string;
  year: number | string;
  paidDate?: string;
  paymentMode?: string;
  ownerName?: string;
}

export const buildReceiptMessage = (vars: ReceiptVars): string => {
  const paidDate = vars.paidDate ? new Date(vars.paidDate).toLocaleDateString() : new Date().toLocaleDateString();
  const lines = [
    '✅ Payment Receipt',
    '',
    `Student: ${vars.name}`,
    `Amount Paid: ₹${vars.amount}`,
    `For: ${vars.month} ${vars.year}`,
    `Date: ${paidDate}`,
  ];
  if (vars.paymentMode) lines.push(`Mode: ${vars.paymentMode}`);
  lines.push('', `Thank you!${vars.ownerName ? ` - ${vars.ownerName}` : ''}`);
  return lines.join('\n');
};

export const buildWhatsAppUrl = (phone: string, text: string): string => {
  return `https://wa.me/${normalizePhoneForWhatsApp(phone)}?text=${encodeURIComponent(text)}`;
};

export const sendWhatsAppReminder = async (phone: string, text: string): Promise<void> => {
  const url = buildWhatsAppUrl(phone, text);
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Failed to open WhatsApp:', error);
    Alert.alert(
      'WhatsApp not available',
      'Could not open WhatsApp on this device. Please make sure it is installed.'
    );
  }
};
