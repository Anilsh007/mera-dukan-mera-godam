import { useRef } from "react"
import { MdBusiness } from "react-icons/md"
import { toPng } from 'html-to-image'

interface Props {
  data: {
    business: { shopName: string; gstNumber: string; upiId: string; logoUrl?: string }
    personal: { displayName: string; phone: string; email: string }
    address: { district: string; state: string }
  }
}

export default function BusinessCard({ data }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadCard = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95 })
      const link = document.createElement('a')
      link.download = `${data.business.shopName}-card.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to download:', err)
    }
  }

  return (
    <div className="lg:sticky lg:top-6">
      <button id="download-card-btn" type="button" className="hidden" onClick={downloadCard} />
      <div ref={cardRef} className="relative aspect-[1/1.2] min-h-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-5 text-white shadow-xl sm:p-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-emerald-300 blur-3xl"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-8">

              <div className="flex items-center gap-3">

                {/* ✅ LOGO */}
                {data.business.logoUrl ? (
                  <img
                    src={data.business.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-lg bg-white/10 p-1"
                  />
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <MdBusiness size={20} />
                  </div>
                )}

                {/* Shop Info */}
                <div>
                  <p className="text-emerald-200 text-xs uppercase tracking-wider">
                    Business Card
                  </p>
                  <h4 className="text-xl font-bold">
                    {data.business.shopName}
                  </h4>
                </div>

              </div>

            </div>

            <div className="space-y-3">
              <div>
                <p className="text-emerald-200 text-xs">Owner</p>
                <p className="font-medium">{data.personal.displayName}</p>
              </div>
              <div>
                <p className="text-emerald-200 text-xs">Contact</p>
                <p className="font-medium">{data.personal.phone || data.personal.email}</p>
              </div>
              {data.business.gstNumber && (
                <div>
                  <p className="text-emerald-200 text-xs">GST</p>
                  <p className="font-mono text-sm">{data.business.gstNumber}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-emerald-200">
                <p>{data.address.district}, {data.address.state}</p>
              </div>
              {data.business.upiId && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                  UPI: {data.business.upiId.split('@')[0]}..
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-3">This card can be downloaded</p>
    </div>
  )
}
