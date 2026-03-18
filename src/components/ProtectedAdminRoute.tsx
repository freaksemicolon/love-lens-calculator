import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ProtectedAdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("ProtectedAdminRoute has_role error:", error);
        setAllowed(false);
      } else {
        setAllowed(data === true);
      }

      setLoading(false);
    };

    check();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">로딩 중...</p>
          <p className="text-sm text-muted-foreground">
            관리자 권한을 확인하고 있어요
          </p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
