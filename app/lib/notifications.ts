"use client"

import { toast as sonnerToast } from "sonner"

export type NotificationMessage = string
export type NotificationOptions = Parameters<typeof sonnerToast.success>[1]
export type NotificationId = string | number

export const notify = {
  loading(message: NotificationMessage, options?: NotificationOptions) {
    return sonnerToast.loading(message, options)
  },
  success(message: NotificationMessage, options?: NotificationOptions) {
    return sonnerToast.success(message, options)
  },
  error(message: NotificationMessage, options?: NotificationOptions) {
    return sonnerToast.error(message, options)
  },
  warning(message: NotificationMessage, options?: NotificationOptions) {
    return sonnerToast.warning(message, options)
  },
  info(message: NotificationMessage, options?: NotificationOptions) {
    return sonnerToast.info(message, options)
  },
  message(message: NotificationMessage, options?: NotificationOptions) {
    return sonnerToast.message(message, options)
  },
  dismiss(id?: NotificationId) {
    return sonnerToast.dismiss(id)
  },
}

export const toast = notify
