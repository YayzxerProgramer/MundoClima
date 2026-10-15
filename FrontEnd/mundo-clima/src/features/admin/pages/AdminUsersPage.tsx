import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteUser, getUser, getUsers, saveUser } from "../api/admin";
import { useSession } from "../../auth/hooks/session";
import { roleLabel, type User } from "../../auth/types";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { errorMessage } from "../../../shared/lib/api";
import { useUI } from "../../../shared/hooks/ui-store";
import { queryClient } from "../../../shared/lib/query";
const schema = z.object({
  nombre_completo: z.string().trim().min(3, "Escribe el nombre completo"),
  email: z.email("Escribe un correo válido"),
  password: z.string(),
  rol: z.enum(["ADMIN", "CLIENTE_FINAL", "TECNICO", "DISTRIBUIDOR"]),
  telefono: z.string(),
  documento_identidad: z.string(),
  nombre_empresa: z.string(),
  esta_activo: z.boolean(),
});
type Values = z.infer<typeof schema>;
function UserForm({ user, close }: { user?: User; close: () => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(
      schema.superRefine((values, context) => {
        if (!user && values.password.length < 6)
          context.addIssue({
            code: "custom",
            path: ["password"],
            message: "Usa al menos 6 caracteres",
          });
      }),
    ),
    defaultValues: {
      nombre_completo: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      rol: user?.role ?? "CLIENTE_FINAL",
      telefono: user?.phone ?? "",
      documento_identidad: user?.document ?? "",
      nombre_empresa: user?.company ?? "",
      esta_activo: user?.active ?? true,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: Values) => {
      const body: Record<string, string | boolean> = {
        nombre_completo: values.nombre_completo,
        email: values.email.trim().toLowerCase(),
        rol: values.rol,
        telefono: values.telefono,
        documento_identidad: values.documento_identidad,
        nombre_empresa: values.nombre_empresa,
        esta_activo: values.esta_activo,
      };
      if (!user) body.password = values.password;
      return saveUser(user?.id, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      useUI.getState().toast(user ? "Usuario actualizado" : "Usuario creado");
      close();
    },
  });
  const e = form.formState.errors;
  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <Field
        id="user-name"
        label="Nombre completo"
        error={e.nombre_completo?.message}
      >
        <Input id="user-name" {...form.register("nombre_completo")} />
      </Field>
      <Field
        id="user-email"
        label="Correo electrónico"
        error={e.email?.message}
      >
        <Input id="user-email" type="email" {...form.register("email")} />
      </Field>
      {!user && (
        <Field
          id="user-password"
          label="Contraseña inicial"
          error={e.password?.message}
        >
          <Input
            id="user-password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        </Field>
      )}
      <Field id="user-role" label="Rol">
        <Select id="user-role" {...form.register("rol")}>
          {Object.entries(roleLabel).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="form-grid">
        <Field id="user-phone" label="Teléfono">
          <Input id="user-phone" {...form.register("telefono")} />
        </Field>
        <Field id="user-document" label="Documento">
          <Input id="user-document" {...form.register("documento_identidad")} />
        </Field>
      </div>
      <Field id="user-company" label="Empresa">
        <Input id="user-company" {...form.register("nombre_empresa")} />
      </Field>
      <Checkbox label="Usuario activo" {...form.register("esta_activo")} />
      {mutation.isError && (
        <p className="form-error" role="alert">
          {errorMessage(mutation.error)}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-3">
        <Button variant="outline" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {user ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
function EditUser({ id, close }: { id: string; close: () => void }) {
  const query = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => getUser(id),
    staleTime: 0,
  });
  return query.isError ? (
    <ErrorState
      error={query.error}
      retry={() => void query.refetch()}
      compact
    />
  ) : query.isPending ? (
    <Skeleton className="h-80" />
  ) : (
    <UserForm user={query.data} close={close} />
  );
}
export default function AdminUsersPage() {
  const query = useQuery({ queryKey: ["admin-users"], queryFn: getUsers }),
    current = useSession((state) => state.user);
  const [edit, setEdit] = useState<string | null>(null),
    [remove, setRemove] = useState<User | null>(null),
    [search, setSearch] = useState("");
  const deletion = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRemove(null);
      useUI.getState().toast("Usuario eliminado");
    },
  });
  const users =
    query.data?.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  return (
    <>
      <SEO title="Administrar usuarios" noIndex />
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMUNIDAD MUNDO CLIMA</p>
          <h1>Usuarios</h1>
        </div>
        <Button onClick={() => setEdit("new")}>
          <Plus size={17} /> Nuevo usuario
        </Button>
      </div>
      <label className="sr-only" htmlFor="user-search">
        Buscar usuarios
      </label>
      <Input
        className="mb-6 max-w-md"
        id="user-search"
        placeholder="Buscar por nombre o correo…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-80" />
      ) : !users.length ? (
        <EmptyState
          title="No encontramos usuarios"
          description="Prueba otro nombre o correo electrónico."
        />
      ) : (
        <div className="data-table-wrap bg-surface">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong className="font-medium">{user.name}</strong>
                    <small className="mt-1 block text-muted">
                      {user.email}
                    </small>
                  </td>
                  <td>
                    <Badge tone="blue">{roleLabel[user.role]}</Badge>
                  </td>
                  <td>
                    <Badge tone={user.active ? "success" : "default"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        className="icon-btn"
                        aria-label={`Editar ${user.name}`}
                        onClick={() => setEdit(user.id)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        className="icon-btn text-danger"
                        disabled={user.id === current?.id}
                        aria-label={`Eliminar ${user.name}`}
                        onClick={() => {
                          deletion.reset();
                          setRemove(user);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={!!edit}
        title={edit === "new" ? "Crear usuario" : "Editar usuario"}
        onClose={() => setEdit(null)}
      >
        {edit === "new" ? (
          <UserForm close={() => setEdit(null)} />
        ) : (
          edit && <EditUser id={edit} close={() => setEdit(null)} />
        )}
      </Modal>
      <Modal
        open={!!remove}
        title="Eliminar usuario"
        onClose={() => {
          if (!deletion.isPending) setRemove(null);
        }}
      >
        <p className="text-sm leading-7">
          Vas a eliminar a <strong>{remove?.name}</strong> ({remove?.email}).
          Esta acción no se puede deshacer.
        </p>
        {deletion.isError && (
          <p className="form-error mt-4" role="alert">
            {errorMessage(deletion.error)}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={deletion.isPending}
            onClick={() => setRemove(null)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deletion.isPending}
            onClick={() => {
              if (remove) deletion.mutate(remove.id);
            }}
          >
            Eliminar usuario
          </Button>
        </div>
      </Modal>
    </>
  );
}
