"use client"

import { Toaster } from "sonner"
import { useTheme } from "@/app/components/theme/ThemeProvider"
import { en } from "@/app/messages/en"

export default function NotificationToaster() {
  const { theme } = useTheme()

  return (
    <div data-i18n-skip>
      <Toaster
        richColors
        closeButton
        expand
        visibleToasts={5}
        position="top-right"
        theme={theme === "dark" ? "dark" : "light"}
        duration={3500}
        offset={{ top: "1rem", right: "1rem" }}
        mobileOffset={{ top: "0.75rem", right: "0.75rem", left: "0.75rem" }}
        containerAriaLabel={en.notifications.containerAriaLabel}
        toastOptions={{
          closeButton: true,
          classNames: {
            toast: "mdmg-toast",
            title: "mdmg-toast-title",
            description: "mdmg-toast-description",
            closeButton: "mdmg-toast-close",
          },
        }}
      />
    </div>
  )
}
