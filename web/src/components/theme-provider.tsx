import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  dynamicThemeColor: boolean;
  setDynamicThemeColor: (v: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  dynamicThemeColor: true,
  setDynamicThemeColor: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  // Warna tema dinamis: meta theme-color mengikuti --background aplikasi.
  // Mati = jangan suntik meta apa pun (browser pakai theme_color manifest).
  // Default nyala untuk mempertahankan perilaku lama.
  const [dynamicThemeColor, setDynamicThemeColorState] = useState<boolean>(
    () => localStorage.getItem("vite-ui-theme-color-dynamic") !== "0",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    root.classList.add(resolved);

    // Update meta theme-color mengikuti mode light/dark (dibaca dari CSS var
    // --background yang sudah beda per mode). Dinamis di tab browser; PWA
    // standalone baca dari manifest (statis).
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove());
    if (!dynamicThemeColor) return;
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = getComputedStyle(root).getPropertyValue("--background").trim() || (resolved === "dark" ? "#0c0c09" : "#ffffff");
    document.head.appendChild(meta);
  }, [theme, dynamicThemeColor]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    dynamicThemeColor,
    setDynamicThemeColor: (v: boolean) => {
      localStorage.setItem("vite-ui-theme-color-dynamic", v ? "1" : "0");
      setDynamicThemeColorState(v);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
