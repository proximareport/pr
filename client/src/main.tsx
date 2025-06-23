import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/themes.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <App />
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);
