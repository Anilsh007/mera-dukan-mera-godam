"use client"

import { FC } from "react"
import Button from "../utility/Button"

interface Props {
  isOpen: boolean
  onClose: () => void
  onConnect: () => void
}

const DriveReconnectModal: FC<Props> = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-card)] rounded-xl p-6 max-w-sm w-full text-center shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Google Drive Disconnected</h2>
        <p className="text-sm mb-6">Your app is not connected to Google Drive. Please reconnect to continue syncing your data.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={onConnect} title="Connect Drive" />
          <Button variant="secondary" onClick={onClose} title="Cancel" />
        </div>
      </div>
    </div>
  )
}

export default DriveReconnectModal