import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { Outfit } from "next/font/google";
import ErrorBoundary from "@/components/common/ErrorBoundary";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
