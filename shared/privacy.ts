/** Display-time PII masking for the admin pitch toggle. Source records stay intact. */

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "••••";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const keep = local.slice(0, Math.min(1, local.length));
  return `${keep}•••@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `••• ••• ${digits.slice(-4)}`;
}

export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "••••";
  if (parts.length === 1) return `${parts[0][0]}.`;
  const first = parts[0][0];
  const last = parts[parts.length - 1];
  return `${first}. ${last}`;
}

export function maskAccountRef(value: string): string {
  return value.replace(/\d{3,}/g, "••••");
}

export function maskDob(value: string): string {
  if (!value) return "••••";
  return "••••-••-••";
}

/** Best-effort masking of emails, phone-like digit runs, and account masks in free text. */
export function maskFreeText(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => maskEmail(email))
    .replace(/Account ending \d+/gi, "Account ending ••••")
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "••• ••• ••••");
}
