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
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
