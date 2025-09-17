"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ChevronsUpDown } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(p => p.id === "user-avatar");

  const getPageTitle = (path: string) => {
    const name = path.split("/").pop() || "dashboard";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {isMobile && <SidebarTrigger />}
      <div className="flex-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {getPageTitle(pathname)}
        </h1>
      </div>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2"
          >
            <Avatar className="h-8 w-8">
              {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" data-ai-hint={userAvatar.imageHint} />}
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-muted-foreground">user@crosspay.com</p>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 hidden lg:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
