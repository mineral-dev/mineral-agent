import "./globals.css";
import { cookies } from "next/headers";

export const metadata = {
  title: "Mineral Agent — Task Board",
  description: "Kanban task dashboard integrated with Hermes Agent",
};

function getThemeFromCookie(cookieStore) {
  try {
    const theme = cookieStore.get("mineral-theme");
    if (theme && (theme.value === "light" || theme.value === "dark")) {
      return theme.value;
    }
  } catch (error) {}
  return null;
}

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const themeFromCookie = getThemeFromCookie(cookieStore);
  const prefersDark = true; // Default fallback, actual preference detected client-side
  const theme = themeFromCookie || (prefersDark ? "dark" : "light");
  const isDark = theme === "dark";

  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased${isDark ? " dark" : ""}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const storageKey = "mineral-theme";
                  const root = document.documentElement;
                  // Read theme from cookie (set server-side) first, then localStorage
                  const cookies = document.cookie.split(';').reduce((acc, c) => {
                    const [k, v] = c.trim().split('=');
                    acc[k] = v;
                    return acc;
                  }, {});
                  const cookieTheme = cookies[storageKey];
                  const stored = cookieTheme || window.localStorage.getItem(storageKey);
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const theme = stored === "light" || stored === "dark" ? stored : (prefersDark ? "dark" : "light");
                  root.classList.toggle("dark", theme === "dark");
                  root.style.colorScheme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
