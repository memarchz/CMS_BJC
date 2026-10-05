import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard & สิทธิ์ Buyer | SUPPLIER PORTAL",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  // admin.html overrides the body font stack to 'Prompt', sans-serif (no system-ui).
  return <div style={{ fontFamily: "Prompt, sans-serif" }}>{children}</div>;
}
