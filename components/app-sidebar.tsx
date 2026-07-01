"use client";

import {
  Crosshair,
  ShieldCheck,
  GraduationCap,
  Users,
  Bell,
  Bot,
  LayoutDashboard,
  Map,
  Settings,
  LogOut,
  Radio,
  Sun,
  Moon,
  Cctv,
  Car,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const data = {
  navMain: [
    {
      title: "Command Center",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
  ],
  modules: [
    {
      title: "Surveillance",
      url: "/dashboard/surveillance",
      icon: Cctv,
      badge: "LIVE",
    },
    {
      title: "Vehicle Access",
      url: "/dashboard/vehicles",
      icon: Car,
    },
    {
      title: "QRF Response",
      url: "/dashboard/qrf",
      icon: Crosshair,
    },
    {
      title: "Perimeter Map",
      url: "/dashboard/perimeter-map",
      icon: Map,
    },
    {
      title: "Guard Compliance",
      url: "/dashboard/compliance",
      icon: ShieldCheck,
    },
    {
      title: "Training Mgmt",
      url: "/dashboard/training",
      icon: GraduationCap,
    },
    {
      title: "Deployment",
      url: "/dashboard/deployment",
      icon: Users,
    },
    {
      title: "Alert System",
      url: "/dashboard/alerts",
      icon: Bell,
    },
    {
      title: "Threat Intel",
      url: "/dashboard/analytics",
      icon: AlertTriangle,
    },
    {
      title: "AI Assistant",
      url: "/dashboard/ai-assistant",
      icon: Bot,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-accent/40">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-white border border-border/80 overflow-hidden shrink-0 p-0.5 shadow-sm">
                  <img src="/islamabad-airport-logo.png" alt="Islamabad Airport Logo" className="w-full h-full object-contain" />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold text-foreground font-sans text-xs tracking-tight">
                    Islamabad Airport
                  </span>
                  <span className="truncate text-[9px] text-tactical-cyan font-mono tracking-wider font-bold uppercase">
                    Security C2 System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em] text-muted-foreground font-mono transition-opacity duration-300 ease-in-out">
            OVERVIEW
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-mono text-xs tracking-wide">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em] text-muted-foreground font-mono transition-opacity duration-300 ease-in-out">
            MODULES
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {data.modules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url} className="relative">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="font-mono text-xs tracking-wide group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      {"badge" in item && item.badge && (
                        <span className="ml-auto text-[9px] font-mono font-bold tracking-wider text-tactical-green bg-tactical-green/10 px-1.5 py-0.5 rounded border border-tactical-green/30 blink">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-md border border-tactical-green/30">
                    <AvatarFallback className="rounded-md bg-tactical-green/10 text-tactical-green font-mono text-xs font-bold">
                      OP
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold font-mono text-xs">
                      Operator-01
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground font-mono">
                      ops@issm.pk
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-md border border-tactical-green/30">
                      <AvatarFallback className="rounded-md bg-tactical-green/10 text-tactical-green font-mono text-xs font-bold">
                        OP
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold font-mono text-xs">
                        Operator-01
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground font-mono">
                        ops@issm.pk
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-tactical-red"
                  onClick={() => router.push("/")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
