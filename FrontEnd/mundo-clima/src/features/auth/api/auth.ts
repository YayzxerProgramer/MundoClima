import { z } from "zod";
import { api, mapUser } from "../../../shared/lib/api";
import { useSession } from "../hooks/session";
import { queryClient } from "../../../shared/lib/query";
export const getProfile = async () =>
  mapUser((await api.get<unknown>("/auth/perfil")).data);
export async function authenticate(
  path: "/auth/login" | "/auth/registro",
  body: Record<string, string>,
) {
  const { access_token: token } = z
    .object({ access_token: z.string() })
    .parse((await api.post<unknown>(path, body)).data);
  // Se consulta perfil incluso cuando registro/login devuelve un usuario resumido.
  const profile = mapUser(
    (
      await api.get<unknown>("/auth/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data,
  );
  await queryClient.cancelQueries();
  queryClient.clear();
  useSession.getState().setToken(token);
  useSession.getState().setUser(profile);
  return profile;
}
export function logout() {
  void queryClient.cancelQueries();
  queryClient.clear();
  useSession.getState().logout();
}
