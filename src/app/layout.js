import "./globals.css";

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
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const theme = stored === "light" || stored === "dark" ? stored : (prefersDark ? "dark" : "light");
                  root.classList.toggle("dark", theme === "dark");
                  root.setAttribute("data-theme", theme);
                  root.style.colorScheme = theme;
                  // Set background on html element to cover full viewport before paint
                  root.style.backgroundColor = theme === "dark"
                    ? "oklch(0.145 0 0)"
                    : "oklch(1 0 0)";
                  document.body.style.backgroundColor = "transparent";
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
