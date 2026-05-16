"use client"

import { useState, type ReactNode } from "react"
import SupabaseSyncManager from "../lib/dataSyncManager"
import ProfileCompletionNotice from "./profile/ProfileCompletionNotice"
import ProtectedRoute from "@/app/components/auth/ProtectedRoute"
import Sidebar from "@/app/components/layout/Sidebar"
import Header from "@/app/components/layout/Header"

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <ProtectedRoute>
      <div className="app-shell-gradient min-h-screen flex flex-col w-full">
        <div className="flex flex-1 overflow-hidden w-full">
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

          <main id="main-content" className={`flex-1 w-full min-w-0 overflow-y-auto transition-all duration-300 ${
              isSidebarCollapsed ? "lg:ml-12" : "lg:ml-[228px]"
            }`} >
            <Header onMenuClick={() => setIsOpen(true)} />
            <div className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pb-4 pt-20 sm:px-4 sm:pb-5 sm:pt-24 lg:px-5 lg:pt-5 xl:px-6">
              <ProfileCompletionNotice />
              {children}
            </div>
          </main>
        </div>
        <SupabaseSyncManager />
      </div>
    </ProtectedRoute>
  )
}
