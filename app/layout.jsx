import './globals.css';

export const metadata = {
  title: "STEM Sports Platform",
  description: "الموقع الرسمي للجنة الرياضية بمدرسة STEM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-900 text-white min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
