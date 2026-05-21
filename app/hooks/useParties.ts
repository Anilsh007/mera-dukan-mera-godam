"use client"

import { useMemo } from "react"
import type { PartyRecord } from "@/app/lib/db"
import { loadParties, type PartyRoleFilter } from "@/app/lib/parties/party.service"
import useAuthLiveQuery from "./useAuthLiveQuery"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"

const EMPTY_PARTIES: PartyRecord[] = []

export default function useParties(filter: PartyRoleFilter = "all") {
  const { data: parties, loading } = useAuthLiveQuery(
    EMPTY_PARTIES,
    (userId) => loadParties(userId, filter),
    (error) => {
      console.error("Party load failed", error)
      notify.error(en.parties.loadFailed, { id: `party-load-failed-${filter}` })
    },
  )

  const typedParties = useMemo(() => parties, [parties])
  return { parties: typedParties, loading }
}
