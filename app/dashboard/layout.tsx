"use client"

import { ProtectedRoute, Sidebar, Header } from "@/app/components/client/useClient"
import { useEffect, useState } from "react"
import { Toaster, toast } from "sonner"
import { autoSyncToDrive } from "../lib/autoSync.service"
import { getGoogleDriveAccessToken } from "../lib/auth.service"
import DriveReconnectModal from "@/app/components/reuseModule/DriveReconnectModal"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showReconnectModal, setShowReconnectModal] = useState(false)

  // ✅ Initial + online sync
  useEffect(() => {
    autoSyncToDrive()

    const handleOnline = () => {
      autoSyncToDrive()
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  // ✅ Background sync every 5 min
  useEffect(() => {
    const interval = setInterval(() => {
      autoSyncToDrive()
    }, 300000)
    return () => clearInterval(interval)
  }, [])

  // ✅ Check for Drive disconnect every 5 sec
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const isConnected = localStorage.getItem("drive_connected")
      if (!isConnected || !navigator.onLine) {
        setShowReconnectModal(true)
      }
    }, 5000)
    return () => clearInterval(checkInterval)
  }, [])

  // ✅ Handle reconnect button click
  const handleReconnect = async () => {
    try {
      const token = await getGoogleDriveAccessToken()
      if (!token) throw new Error("Connection failed")
      localStorage.setItem("drive_connected", "true")
      setShowReconnectModal(false)
      toast.success("Drive reconnected ✅")

      // Resume auto sync immediately
      autoSyncToDrive()
    } catch (err) {
      toast.error(`Connection failed ❌`)
    }
  }

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
        <Header onMenuClick={() => setIsOpen(true)} />
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
          <div className="flex-1 px-3 py-4 lg:relative absolute lg:p-6 overflow-y-auto">
            {children}
            <Toaster richColors position="top-right" />
          </div>
        </div>

        {/* ✅ Drive reconnect modal */}
        <DriveReconnectModal
          isOpen={showReconnectModal}
          onClose={() => setShowReconnectModal(false)}
          onConnect={handleReconnect}
        />
      </div>
    </ProtectedRoute>
  )
}