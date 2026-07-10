import "./globals.css";

export const metadata = {
  title: "Waar gaan we op reis?",
  description: "De reisbestemming-poll",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
