"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="top-right"
      richColors
      toastOptions={{
        style:
          resolvedTheme === "light"
            ? {
                background: "#ffffff",
                border:     "1px solid rgba(0,0,0,0.08)",
                color:      "#0f0f1a",
              }
            : {
                background: "#131320",
                border:     "1px solid rgba(255,255,255,0.08)",
                color:      "#f4f4f8",
              },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      themes={["dark", "light"]}
      disableTransitionOnChange={false}
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
