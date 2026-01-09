import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { buildApiUrl } from "../utils/api";

export function SyncUserToDb() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;

        await fetch(buildApiUrl("/api/me/sync"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Silently ignore; sync is best-effort
      }
    })();
  }, [isSignedIn, getToken]);

  return null;
}
