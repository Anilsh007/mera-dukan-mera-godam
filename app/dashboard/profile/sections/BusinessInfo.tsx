import Input from "@/app/components/utility/CommonInput"
import { MdBusiness, MdOutlineClose } from "react-icons/md"
import SectionCard from "../components/SectionCard"
import { MdAttachFile } from "react-icons/md"
import { useRef } from "react"
import { supabase } from "@/app/lib/supabase"
import { auth } from "@/app/lib/firebase"

interface Props {
  data: {
    shopName: string
    gstNumber: string
    businessType: string
    upiId: string
    invoicePrefix: string
    logoUrl?: string
  }
  onChange: (field: string, value: string) => void
}

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "services", label: "Services" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "healthcare", label: "Healthcare" },
  { value: "construction", label: "Construction" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "real_estate", label: "Real Estate" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" }
]

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.readAsDataURL(file)

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) return reject("Canvas not supported")

      // 🔥 Resize logic
      const MAX_WIDTH = 400
      const scale = MAX_WIDTH / img.width

      canvas.width = MAX_WIDTH
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // 🔥 Compression (0.6 best balance)
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6)

      resolve(compressedBase64)
    }

    img.onerror = reject
  })
}

export async function uploadLogo(file: File, userId: string) {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}` // 🔥 folder structure

  const { data, error } = await supabase.storage
    .from("logos")
    .upload(fileName, file)

  console.log("UPLOAD RESULT:", data, error)

  if (error) {
    console.error("Upload error FULL:", error)
    alert(error.message)
    throw error
  }

  const { data: publicUrlData } = supabase.storage
    .from("logos")
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}

export default function BusinessInfo({ data, onChange }: Props) {

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const user = auth.currentUser
      console.log("CURRENT USER:", user?.email)
      if (!user) {
        alert("User not logged in")
        return
      }

      const userId = user.email || "guest"

      const url = await uploadLogo(file, userId)

      console.log("FINAL URL:", url)

      onChange("logoUrl", url)

    } catch (err) {
      console.error("Upload failed FULL:", err)
    }
  }

  const handleRemoveLogo = () => {
    onChange("logoUrl", "")
  }

  return (
    <SectionCard title="Business Details" icon={<MdBusiness />} iconColor="text-emerald-500">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Input label={<>Shop Name <span className="text-red-500">*</span></>} placeholder="Aapke dukan ka naam" value={data.shopName} onChange={(e) => onChange("shopName", e.target.value)} />

        <Input label="GST Number (Optional)" placeholder="22AAAAA0000A1Z5" value={data.gstNumber} onChange={(e) => onChange("gstNumber", e.target.value.toUpperCase())} />

        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">Business Type</label>

          <select value={data.businessType} onChange={(e) => onChange("businessType", e.target.value)} className="w-full p-2 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-400 outline-none" >
            {BUSINESS_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <Input label="UPI ID (Optional)" placeholder="yourname@upi" value={data.upiId} onChange={(e) => onChange("upiId", e.target.value)} />

        <Input label="Invoice Prefix" placeholder="INV" value={data.invoicePrefix} onChange={(e) => onChange("invoicePrefix", e.target.value)} />

        {/* ✅ LOGO SECTION */}
        {/* <div>
          <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">Business Logo (Optional)</label>
          <input ref={fileInputRef} type="file" accept="image/png, image/jpeg" onChange={handleLogoUpload} className="hidden" />

          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2" ><MdAttachFile size={18} />Upload Logo</button>

          {data.logoUrl && (
            <div className="mt-3 flex justify-end items-center gap-4">
              <img src={data.logoUrl} alt="Logo Preview" className="w-20 h-20 object-contain" />
              <button type="button" onClick={handleRemoveLogo} className="border border-[var(--border-input)] rounded-xl text-red-500 hover:underline" ><MdOutlineClose /></button>
            </div>
          )}
        </div> */}

      </div>
    </SectionCard>
  )
}