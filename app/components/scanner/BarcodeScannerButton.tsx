"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import type { IScannerControls } from "@zxing/browser"
import { Camera, Keyboard, ScanBarcode, ShieldAlert, Square } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import { incrementUsage } from "@/app/lib/subscription/subscription.service"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { notify as toast } from "@/app/lib/notifications"
import { normalizeBarcodeValue } from "@/app/lib/barcode/barcode.utils"
import { en } from "@/app/messages/en"

type BarcodeScannerButtonProps = {
  onDetected: (code: string) => void
  buttonTitle?: string
  disabled?: boolean
  className?: string
  variant?: "primary" | "secondary" | "outline" | "soft-primary" | "ghost"
}

type DetectedBarcode = {
  rawValue?: string
  format?: string
}

type BrowserBarcodeDetector = {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}

type BarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): BrowserBarcodeDetector
  getSupportedFormats?: () => Promise<string[]>
}

type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor
}

const REQUESTED_FORMATS = [
  "qr_code",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "itf",
  "codabar",
  "data_matrix",
]

export default function BarcodeScannerButton({
  onDetected,
  buttonTitle = en.scanner.openScanner,
  disabled = false,
  className = "",
  variant = "outline",
}: BarcodeScannerButtonProps) {
  const featureGate = useFeatureGate("barcodeScanner")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const detectorRef = useRef<BrowserBarcodeDetector | null>(null)
  const fallbackControlsRef = useRef<IScannerControls | null>(null)
  const scanningRef = useRef(false)
  const detectedRef = useRef(false)

  const [open, setOpen] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [cameraActive, setCameraActive] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [cameraError, setCameraError] = useState("")

  const stopCamera = useCallback(() => {
    scanningRef.current = false
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    fallbackControlsRef.current?.stop()
    fallbackControlsRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    detectorRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  const closeScanner = useCallback(() => {
    stopCamera()
    setOpen(false)
    setCameraError("")
  }, [stopCamera])

  const completeDetection = useCallback((rawCode: string) => {
    const code = normalizeBarcodeValue(rawCode)
    if (!code) {
      toast.error(en.scanner.emptyCode)
      return
    }

    detectedRef.current = true
    stopCamera()
    setManualCode("")
    setCameraError("")
    setOpen(false)
    toast.success(en.scanner.codeDetected.replace("{code}", code))
    onDetected(code)
  }, [onDetected, stopCamera])

  const scanFrame = useCallback(async function scanFrameLoop() {
    if (!scanningRef.current || detectedRef.current) return

    const video = videoRef.current
    const detector = detectorRef.current
    if (video && detector && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        const results = await detector.detect(video)
        const code = results.find((result) => result.rawValue?.trim())?.rawValue
        if (code) {
          completeDetection(code)
          return
        }
      } catch (error) {
        console.error("Barcode scan failed", error)
        setCameraError(en.scanner.scanFailed)
        toast.error(en.scanner.scanFailed)
        stopCamera()
        return
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      void scanFrameLoop()
    })
  }, [completeDetection, stopCamera])

  const startCamera = useCallback(async () => {
    if (!featureGate.allowed) {
      toast.warning(en.scanner.scannerLocked)
      return
    }

    const userId = getUserIdentityFromAuthUser(auth?.currentUser)
    if (userId) {
      void incrementUsage(userId, "barcodeScanner").catch((error) => {
        console.warn("Barcode usage tracking failed", error)
      })
    }

    const browserWindow = window as WindowWithBarcodeDetector
    const BarcodeDetectorClass = browserWindow.BarcodeDetector

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(en.scanner.cameraUnsupported)
      toast.warning(en.scanner.cameraUnsupported)
      return
    }

    try {
      setStartingCamera(true)
      setCameraError("")
      detectedRef.current = false
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      if (BarcodeDetectorClass) {
        const supportedFormats = BarcodeDetectorClass.getSupportedFormats
          ? await BarcodeDetectorClass.getSupportedFormats()
          : []
        const formats = supportedFormats.length
          ? REQUESTED_FORMATS.filter((format) => supportedFormats.includes(format))
          : []
        detectorRef.current = formats.length
          ? new BarcodeDetectorClass({ formats })
          : new BarcodeDetectorClass()

        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        scanningRef.current = true
        setCameraActive(true)
        toast.info(en.scanner.scannerReady)
        animationFrameRef.current = window.requestAnimationFrame(scanFrame)
        return
      }

      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromConstraints(
        constraints,
        videoRef.current ?? undefined,
        (result) => {
          const code = result?.getText?.()
          if (code) completeDetection(code)
        },
      )

      fallbackControlsRef.current = controls
      scanningRef.current = true
      setCameraActive(true)
      toast.info(en.scanner.scannerReady)
    } catch (error) {
      console.error("Camera start failed", error)
      const message = isPermissionError(error) ? en.scanner.permissionDenied : en.scanner.cameraStartFailed
      setCameraError(message)
      toast.error(message)
      stopCamera()
    } finally {
      setStartingCamera(false)
    }
  }, [completeDetection, featureGate.allowed, scanFrame, stopCamera])

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    completeDetection(manualCode)
  }

  useEffect(() => stopCamera, [stopCamera])

  const locked = !featureGate.loading && !featureGate.allowed
  const buttonDisabled = disabled || featureGate.loading || locked

  return (
    <>
      <Button
        type="button"
        variant={variant}
        title={locked ? en.scanner.scannerLocked : buttonTitle}
        icon={<ScanBarcode size={16} aria-hidden="true" />}
        onClick={() => setOpen(true)}
        disabled={buttonDisabled}
        className={className}
      />

      <Modal
        open={open}
        title={en.scanner.title}
        description={en.scanner.description}
        titleIcon={<ScanBarcode size={22} aria-hidden="true" />}
        onClose={closeScanner}
        size="lg"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              title={en.common.cancel}
              onClick={closeScanner}
              className="w-full sm:w-auto"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {cameraActive ? (
                <Button
                  type="button"
                  variant="soft-danger"
                  title={en.scanner.stopCamera}
                  icon={<Square size={15} aria-hidden="true" />}
                  onClick={stopCamera}
                  className="w-full sm:w-auto"
                />
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  title={en.scanner.startCamera}
                  icon={<Camera size={16} aria-hidden="true" />}
                  onClick={startCamera}
                  loading={startingCamera}
                  disabled={startingCamera || locked}
                  className="w-full sm:w-auto"
                />
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-[var(--border-card)] bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-[4/3] w-full object-cover"
              aria-label={en.scanner.cameraPreview}
            />
          </div>

          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">
            <p className="font-semibold text-[var(--text-primary)]">{en.scanner.howItWorksTitle}</p>
            <p className="mt-1">{en.scanner.howItWorksDescription}</p>
          </div>

          {locked ? (
            <div className="flex gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-600" role="alert">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{en.scanner.scannerLocked}</span>
            </div>
          ) : null}

          {cameraError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-600" role="alert">
              {cameraError}
            </div>
          ) : null}

          <form onSubmit={handleManualSubmit} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Keyboard size={16} aria-hidden="true" />
              <span>{en.scanner.manualFallbackTitle}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder={en.scanner.manualCodePlaceholder}
                aria-label={en.scanner.manualCodeLabel}
              />
              <Button type="submit" title={en.scanner.useCode} className="w-full sm:w-auto" />
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{en.scanner.noLookupApiHelp}</p>
          </form>
        </div>
      </Modal>
    </>
  )
}

function isPermissionError(error: unknown) {
  return error instanceof DOMException && ["NotAllowedError", "SecurityError", "PermissionDeniedError"].includes(error.name)
}
