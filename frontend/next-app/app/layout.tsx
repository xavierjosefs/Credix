import "./globals.css";
import { ThemeProvider } from "@/app/src/modules/theme/components/ThemeProvider";

const themeScript = `
  (function () {
    try {
      var theme = localStorage.getItem("app-theme") || "light";
      document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    } catch (error) {
      document.documentElement.dataset.theme = "light";
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
