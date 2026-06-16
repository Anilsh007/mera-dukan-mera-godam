import type { ReactNode } from "react"
import Header from "@/app/components/layout/Header"
import Footer from "@/app/components/layout/Footer"
import JsonLd from "@/app/components/seo/JsonLd"
import { createPageSchema } from "@/app/lib/seo/schema"

type PublicPageShellProps = {
  path: string
  children: ReactNode
  language?: string
  schemaData?: Record<string, unknown>
}

export default function PublicPageShell({ path, children, language = "en", schemaData }: PublicPageShellProps) {
  return (
    <>
      <JsonLd
        id={`page-schema-${path.replace(/[^a-z0-9]/gi, "-") || "home"}`}
        data={schemaData || createPageSchema(path, language)}
      />
      <Header />
      <div id="main-content" className="public-content pt-14 lg:pt-0">{children}</div>
      <Footer />
    </>
  )
}
