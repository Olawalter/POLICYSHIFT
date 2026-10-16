import "./globals.css";
import Link from "next/link";
import { WalletProvider, WalletBar } from "@/components/Wallet";

export const metadata = { title: "POLICYSHIFT", description: "Policy version lineage and validator-verified adjudication" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <header className="top">
            <strong>POLICYSHIFT</strong>
            <nav>
              <Link href="/">Overview</Link><Link href="/policies">Policies</Link><Link href="/cases">Cases</Link>
              <Link href="/cases/new">New case</Link><Link href="/settings">Settings</Link>
            </nav>
            <WalletBar />
          </header>
          <main>{children}</main>
          <footer className="muted" style={{ textAlign: "center", padding: 20, fontSize: 12 }}>
            Results are LLM-derived and validator-checked evidence with quotes, not legal determinations.
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
