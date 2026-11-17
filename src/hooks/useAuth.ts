import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import type { Session } from "@/integrations/api/types";

export function useAuth() {
  const cache = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ["auth-session"],
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const result = await api.auth.getSession();
      if (result.error) throw result.error;
      return result.data.session;
    },
  });
  const session = sessionQuery.data ?? null;
  const user = session?.user ?? null;
  const roleQuery = useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: !!user,
    staleTime: 30000,
    retry: false,
    queryFn: async () => {
      const result = await api.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (result.error) throw result.error;
      return result.data === true;
    },
  });
  useEffect(() => {
    const {
      data: { subscription },
    } = api.auth.onAuthStateChange((_event, next: Session | null) => {
      cache.setQueryData(["auth-session"], next);
      void cache.invalidateQueries({ queryKey: ["admin-role"] });
    });
    return () => subscription.unsubscribe();
  }, [cache]);
  return {
    user,
    session,
    isAdmin: !!user && roleQuery.data === true,
    loading: sessionQuery.isPending || (!!user && roleQuery.isPending),
    error: sessionQuery.error ?? (user ? roleQuery.error : null),
    retry: () => {
      void sessionQuery.refetch();
      if (user) void roleQuery.refetch();
    },
    signIn: (email: string, password: string) =>
      api.auth.signInWithPassword({ email: email.trim(), password }),
    signUp: (email: string, password: string) =>
      api.auth.signUp({ email: email.trim(), password }),
    signOut: () => api.auth.signOut(),
    resetPassword: (email: string) =>
      api.auth.resetPasswordForEmail(email.trim()),
    updatePassword: (password: string) => api.auth.updateUser({ password }),
  };
}
