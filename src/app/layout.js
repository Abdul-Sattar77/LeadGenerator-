import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import ConditionalNavbar from "@/components/ConditionalNavbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "LeadFinder — Find business leads in seconds",
  description:
    "Search any business type in any city and instantly get names, phone numbers, ratings, websites and addresses. Export to CSV in one click.",
  openGraph: {
    title: "LeadFinder — Find business leads in seconds",
    description:
      "Turn Google Maps into your lead list. Phone numbers, ratings, websites & addresses — ready to export.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <Providers>
          <ConditionalNavbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
