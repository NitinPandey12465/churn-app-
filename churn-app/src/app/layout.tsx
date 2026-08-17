import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Backdrop, SiteFooter, TopNav } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://retention-engine.vercel.app"),
  title: {
    default: "Retention Engine — Churn Prediction & Revenue Rescue Platform",
    template: "%s · Retention Engine",
  },
  description:
    "A live, end-to-end churn intelligence platform: PostgreSQL star schema, logistic regression at AUC 0.84, SHAP explainability, Kaplan-Meier survival analysis and a prescriptive retention playbook protecting $60K MRR.",
  keywords: [
    "churn prediction",
    "customer retention",
    "data science portfolio",
    "SHAP",
    "Kaplan-Meier",
    "PostgreSQL",
    "machine learning",
    "Nitin Pandey",
  ],
  authors: [{ name: "Nitin Pandey" }],
  openGraph: {
    title: "Retention Engine — Predict churn before it happens",
    description:
      "7,043 customers scored in real time. AUC 0.84 · 75.7% of churners caught · $60K/month protected.",
    type: "website",
    images: ["/og.jpg"],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#eaf3fb",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-700 antialiased">
        <Backdrop />
        <TopNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
