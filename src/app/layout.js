import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Mineral Agent — Task Board",
  description: "Kanban task dashboard integrated with Hermes Agent",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const storageKey = "mineral-theme";
                  const root = document.documentElement;
                  const stored = window.localStorage.getItem(storageKey);
                  const theme = stored === "light" || stored === "dark" ? stored : "dark";
                  root.classList.toggle("dark", theme === "dark");
                  root.style.colorScheme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
