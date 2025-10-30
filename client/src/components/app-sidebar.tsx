import {
  Building2,
  Home,
  Users,
  Wrench,
  DollarSign,
  FileText,
  MessageSquare,
  Briefcase,
  BarChart3,
  Settings,
  ScrollText,
  Archive,
  Receipt,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

const getAllMenuItems = (userRole?: string) => {
  const baseItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      notification: 3,
      roles: ['IT', 'ADMIN', 'TENANT'],
    },
    {
      title: "Users",
      url: "/users",
      icon: ShieldCheck,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Masterlist",
      url: "/masterlist",
      icon: UserCheck,
      notification: 2,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Properties",
      url: "/properties",
      icon: Building2,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: Users,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
      notification: 5,
      roles: ['IT', 'ADMIN', 'TENANT'],
    },
    {
      title: "Communications",
      url: "/communications",
      icon: MessageSquare,
      notification: 8,
      roles: ['IT', 'ADMIN', 'TENANT'],
    },
    {
      title: "Financials",
      url: "/financials",
      icon: DollarSign,
      notification: 4,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: Receipt,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: Archive,
      roles: ['IT', 'ADMIN'],
    },
    {
      title: "Vendors",
      url: "/vendors",
      icon: Briefcase,
      roles: ['IT', 'ADMIN'],
    },
  ];

  // Filter items based on user role
  if (!userRole) return [];
  return baseItems.filter(item => item.roles.includes(userRole));
};

export function AppSidebar() {
  const [location] = useLocation();
  
  // Get current user to determine role
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });
  
  const menuItems = getAllMenuItems(currentUser?.role);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">PropertyPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.notification && (
                        <Badge className="ml-auto h-5 px-1.5 text-xs" variant="secondary">
                          {item.notification}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="link-settings">
                  <a href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}