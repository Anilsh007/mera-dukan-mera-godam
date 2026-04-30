"use client"

import { ProtectedRoute, Sidebar, Header } from "@/app/components/client/useClient"
import { useState } from "react"
import { Toaster } from "sonner"
import SupabaseSyncManager from "../lib/dataSyncManager"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <ProtectedRoute>

      <div className="min-h-screen flex flex-col bg-transparent w-full">
        <div className="flex flex-1 overflow-hidden w-full">
          <Sidebar
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />

          <main
            className={`flex-1 w-full min-w-0 overflow-y-auto transition-all duration-300 ${
              isSidebarCollapsed ? "lg:ml-12" : "lg:ml-[228px]"
            }`}
          >
            <Header onMenuClick={() => setIsOpen(true)} />
            <div className="mx-auto w-full max-w-[1600px] px-3 pb-4 pt-20 sm:px-4 sm:pb-5 sm:pt-24 lg:px-5 lg:pt-5 xl:px-6">
              {children}
            </div>
          </main>
        </div>
        <Toaster richColors position="top-right" />
        <SupabaseSyncManager />
      </div>
    </ProtectedRoute>
  )
}
