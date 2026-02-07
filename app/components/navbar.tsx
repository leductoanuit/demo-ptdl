"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Trang chủ" },
    { href: "/dashboard", label: "Bảng điều khiển" },
    { href: "/predict", label: "Dự đoán giá" },
  ];

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Phân Tích Giá Căn Hộ TP.HCM
          </h1>
          <div className="flex gap-8">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-4 text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActive
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
