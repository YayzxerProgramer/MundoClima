export type Role = "ADMIN" | "CLIENTE_FINAL" | "TECNICO" | "DISTRIBUIDOR";
export type CustomerLevel = Exclude<Role, "ADMIN">;
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  document: string | null;
  company: string | null;
  active: boolean;
  createdAt: string;
}
export const nivelParaRol = (role?: Role): CustomerLevel =>
  role === "TECNICO" || role === "DISTRIBUIDOR" ? role : "CLIENTE_FINAL";
export const roleLabel: Record<Role, string> = {
  ADMIN: "Administrador",
  CLIENTE_FINAL: "Hogar y comercio",
  TECNICO: "Técnico",
  DISTRIBUIDOR: "Distribuidor",
};
