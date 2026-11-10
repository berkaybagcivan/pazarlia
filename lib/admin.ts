import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Yönetici değilse sayfanın var olduğu bile belli olmaz (404 görür)
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (user.role !== "ADMIN") notFound();
  return user;
}