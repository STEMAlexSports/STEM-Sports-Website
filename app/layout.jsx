import './globals.css';

export const metadata = {
  title: 'STEM Sports Platform',
  description: 'Official Sports Committee Portal for STEM High School',
  icons: {
    icon: '/logo.png', // Path relative to your public/ directory
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
