
"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Wallet,
  History,
  Send,
  ArrowRightLeft,
  Landmark,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { AppHeader } from "@/components/header";
import { useAppDispatch } from '@/hooks/use-redux';
import { fetchExchangeRates } from '@/store/slices/rates-slice';

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: History },
  { href: "/send", label: "Send", icon: Send },
  { href: "/swap", label: "Swap", icon: ArrowRightLeft },
  { href: "/deposit", label: "Deposit", icon: Landmark },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchExchangeRates());
    const interval = setInterval(() => {
        dispatch(fetchExchangeRates());
    }, 300000); // every 3 minutes
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            {/* <CreditCard className="w-8 h-8 text-primary" /> */}
            <Image src="/favicon.ico" alt="CrossPay Logo" width={32} height={32} />
            <h1 className="text-xl font-bold">CrossPay</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
