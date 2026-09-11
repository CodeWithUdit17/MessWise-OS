import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MessWise OS — Admin Dashboard",
  description:
    "Campus operational command center for hostel wardens and mess management. Real-time kitchen forecasting, maintenance SLA tracking, and broadcast operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
