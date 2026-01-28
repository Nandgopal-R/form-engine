"use client"
import * as React from "react"
import {
  LayoutDashboard,
  FileEdit,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Editor",
      url: "/editor",
      icon: FileEdit,
      items: [
        {
          title: "New Form",
          url: "/editor/new",
        },
        {
          title: "My Forms",
          url: "/editor/forms",
        },
        {
          title: "Templates",
          url: "/editor/templates",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      items: [
        {
          title: "Overview",
          url: "/analytics/overview",
        },
        {
          title: "Responses",
          url: "/analytics/responses",
        },
        {
          title: "Reports",
          url: "/analytics/reports",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Plus className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Form Builder</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {/* Future user profile*/}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
