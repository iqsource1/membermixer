import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WhopProvider } from "@/components/providers/whop-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Member Mixer - Connect with Your Community",
  description: "1:1 chat matching for Whop communities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WhopProvider>
          {children}
        </WhopProvider>
      </body>
    </html>
  );
}

