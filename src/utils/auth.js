import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function isAdmin(user) {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export function isSuperAdmin(user) {
  return user?.role === "SUPER_ADMIN";
}

export function isTechnician(user) {
  return user?.role === "TECHNICIAN";
}

export function canManageCompany(user) {
  return isAdmin(user);
}

export function canManageUsers(user) {
  return isAdmin(user);
}

export function canManageInventory(user) {
  return isAdmin(user) || user?.role === "USER";
}

export function canCreateInvoices(user) {
  return user?.role !== null; // All authenticated users can create invoices
}

export function canViewReports(user) {
  return isAdmin(user);
}