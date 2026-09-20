import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "gasgarick — дизайн и ремонт с вниманием к вам",
 description: "Три интерактивные 3D-квартиры gasgarick. Прогуляйтесь по комнатам, подберите материалы, измените расстановку мебели и посмотрите все этапы ремонта.",
 icons: {icon: "/favicon.svg",shortcut: "/favicon.svg"},
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="ru"><body className="antialiased">{children}</body></html>;
}
