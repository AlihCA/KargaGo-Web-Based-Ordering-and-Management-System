import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminModeContextValue = {
  adminMode: boolean;
  setAdminMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleAdminMode: () => void;
};

const AdminModeContext = createContext<AdminModeContextValue | undefined>(
  undefined
);

const ADMIN_MODE_STORAGE_KEY = "adminModeEnabled";

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem(ADMIN_MODE_STORAGE_KEY);
    if (storedValue !== null) {
      setAdminMode(storedValue === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ADMIN_MODE_STORAGE_KEY, adminMode ? "true" : "false");
  }, [adminMode]);

  const value = useMemo(
    () => ({
      adminMode,
      setAdminMode,
      toggleAdminMode: () => setAdminMode((previous) => !previous),
    }),
    [adminMode]
  );

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within an AdminModeProvider");
  }
  return context;
}
