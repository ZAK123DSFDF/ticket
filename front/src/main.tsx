import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { UIProviders } from "./providers/UIproviders.tsx";
import QueryProvider from "./providers/Query.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <UIProviders>
            <App />
          </UIProviders>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
);
