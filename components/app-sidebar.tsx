'use client'

import { usePathname } from 'next/navigation'

import * as Icons from '@/components/icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from '@/data/data'

const Logo = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M22 13L16.2933 15.8534C14.7191 16.6405 13.932 17.034 13.1064 17.1889C12.3752 17.3261 11.6248 17.3261 10.8936 17.1889C10.068 17.034 9.28094 16.6405 7.70675 15.8534L2 13M22 18L16.2933 20.8534C14.7191 21.6405 13.932 22.034 13.1064 22.1889C12.3752 22.3261 11.6248 22.3261 10.8936 22.1889C10.068 22.034 9.28094 21.6405 7.70675 20.8534L2 18M5.72433 9.86217L9.13783 11.5689C10.1873 12.0936 10.712 12.356 11.2624 12.4593C11.7499 12.5507 12.2501 12.5507 12.7376 12.4593C13.288 12.356 13.8127 12.0936 14.8622 11.5689L18.2757 9.86217C20.1181 8.94095 21.0393 8.48035 21.3349 7.85705C21.5922 7.31464 21.5922 6.68536 21.3349 6.14295C21.0393 5.51965 20.1181 5.05905 18.2757 4.13783L14.8622 2.43108C13.8127 1.90635 13.288 1.64399 12.7376 1.54073C12.2501 1.44927 11.7499 1.44927 11.2624 1.54073C10.712 1.64399 10.1873 1.90635 9.13783 2.43108L5.72433 4.13783C3.88191 5.05905 2.96069 5.51965 2.66508 6.14295C2.40782 6.68536 2.40782 7.31464 2.66508 7.85705C2.96069 8.48035 3.88191 8.94095 5.72433 9.86217Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-ring text-sidebar-primary-foreground">
                  <Logo className="size-4" />
                </div>
                <div className="leading-none">
                  <span className="font-semibold">seeds</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => {
                  const Icon = Icons[subItem.icon]
                  return (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === subItem.url}
                      >
                        <a href={subItem.url}>
                          {Icon && <Icon className="mr-2 size-4" />}
                          {subItem.title}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {/* Move SidebarFooter here */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#">Footer Content</a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
