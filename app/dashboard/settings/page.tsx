"use client"

import { useEffect, useState } from "react"
import { getGoogleDriveAccessToken } from "@/app/lib/auth.service"
import { toast } from "sonner"
import Button from "@/app/components/utility/Button"

export default function SettingsPage() {
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        async function checkConnection() {
            try {
                const token = await getGoogleDriveAccessToken()

                if (token) {
                    setIsConnected(true)
                    localStorage.setItem("drive_connected", "true")
                } else {
                    throw new Error("No token")
                }
            } catch {
                setIsConnected(false)
                localStorage.setItem("drive_connected", "false")
            }
        }

        checkConnection()
    }, [])

    async function connectDrive() {
        try {
            const token = await getGoogleDriveAccessToken()

            if (!token) throw new Error()

            localStorage.setItem("drive_connected", "true")
            setIsConnected(true)

            toast.success("Drive connected ✅")
        } catch {
            localStorage.setItem("drive_connected", "false")
            setIsConnected(false)

            toast.error("Connection failed ❌")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">

            <div className="w-full bg-[var(--bg-card)] max-w-md rounded-2xl shadow-lg p-6 space-y-6">

                {/* Title */}
                <h2 className="text-2xl font-semibold">Backup Settings</h2>

                {/* Status */}
                <div className="flex items-center bg-[var(--bg-sidebar)] justify-between p-4 rounded-lg">
                    <span className="font-medium">Google Drive Status</span>

                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{isConnected ? "Connected" : "Not Connected"}</span>
                </div>

                {/* Button */}
                {!isConnected && (
                    <Button onClick={connectDrive} variant="primary" title="Connect Google Drive" className="w-full" />
                )}

                {/* Info text */}
                <p className="text-sm text-[var(--text-muted)] text-center">
                    Your data will automatically sync to Google Drive after connection.
                </p>

            </div>
        </div>
    )
}