import PartyDetailClientPage from "./party-detail-client"

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ partyId: string }>
}) {
  const { partyId } = await params
  return <PartyDetailClientPage partyId={partyId} />
}
