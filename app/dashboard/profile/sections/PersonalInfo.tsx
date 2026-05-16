import Input from "@/app/components/ui/Input"
import Image from "next/image"
import { MdPerson } from "react-icons/md"
import SectionCard from "../components/SectionCard"
import { en } from "@/app/messages/en"

interface Props {
  data: {
    displayName: string
    email: string
    photoURL: string
    phone: string
    alternateEmail: string
  }
  onChange: (field: string, value: string) => void
}

export default function PersonalInfo({ data, onChange }: Props) {
  return (
    <SectionCard title={en.profile.personalDetails} icon={<MdPerson />} iconColor="text-blue-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 md:col-span-2 mb-2">
          {data.photoURL ? (
            <Image src={data.photoURL} alt={en.common.profileAlt} width={64} height={64} unoptimized className="w-16 h-16 rounded-full border-2 border-[var(--border-card)]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">
              {data.displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <p className="text-sm text-[var(--text-muted)]">{en.profile.googleAccount}</p>
            <p className="font-semibold text-[var(--text-primary)]">{data.displayName}</p>
            <p className="text-xs text-[var(--text-secondary)]">{data.email}</p>
          </div>
        </div>

        <Input label={en.profile.phoneNumber} type="tel" placeholder={en.profile.phonePlaceholder} value={data.phone} onChange={(e) => onChange("phone", e.target.value)} />

        <Input label={en.profile.alternateEmailOptional} type="email" placeholder={en.profile.emailPlaceholder} value={data.alternateEmail} onChange={(e) => onChange("alternateEmail", e.target.value)} />
      </div>
    </SectionCard>
  )
}
