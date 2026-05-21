"use client"

import type { PartyDetailData } from "@/app/lib/parties/party.service"
import { getPartyDetail } from "@/app/lib/parties/party.service"
import useAuthLiveQuery from "./useAuthLiveQuery"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"

export default function usePartyDetail(partyId: string) {
  const { data, loading } = useAuthLiveQuery<PartyDetailData | null>(
    null,
    (userId) => getPartyDetail(userId, partyId),
    (error) => {
      console.error("Party detail load failed", error)
      notify.error(en.parties.detailLoadFailed, { id: `party-detail-failed-${partyId}` })
    },
  )

  return { detail: data, loading }
}
