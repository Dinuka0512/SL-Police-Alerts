export const PROTECTED_ADMIN_EMAIL = "admin@police.lk";

export function isProtectedAdmin(email: string): boolean {
  return email.toLowerCase() === PROTECTED_ADMIN_EMAIL;
}
