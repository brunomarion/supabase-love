import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });
    const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", data.user.id).maybeSingle();
    if (patient) throw redirect({ to: "/paciente" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
