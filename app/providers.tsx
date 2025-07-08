"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: ReactNode }) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    // In development, it's helpful to still render the app
    // and show a warning in the console.
    console.warn("PayPal client ID is not set. PayPal buttons will not render.");
    return (
      <SessionProvider>
        <Toaster />
        {children}
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <PayPalScriptProvider options={{
        clientId: paypalClientId,
        currency: "USD",
        intent: "capture"
      }}>
        <Toaster />
        {children}
      </PayPalScriptProvider>
    </SessionProvider>
  );
} 