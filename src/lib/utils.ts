import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUserName(member: any, currentUserId?: string | number) {
  if (!member) return 'Unassigned';
  // Use loose equality to handle string vs number mismatches
  if (currentUserId && String(member.id) == String(currentUserId)) {
    return `Me (${member.role})`;
  }
  return member.name;
}
