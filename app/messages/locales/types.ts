export type LocalizedSeoCopy = {
  appDescription: string
  softwareName: string
  pages: Record<string, { title: string; description: string; keywords: string[] }>
}
