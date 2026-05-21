export type SvgChartPoint = {
  x: number
  y: number
}

export function buildSmoothPath(points: SvgChartPoint[]) {
  if (!points.length) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const controlX = previous.x + (point.x - previous.x) / 2
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
  }, "")
}

export function buildAreaPath(points: SvgChartPoint[], baselineY: number) {
  const linePath = buildSmoothPath(points)
  if (!points.length || !linePath) return ""

  return `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
}

export function formatShortDay(offsetFromToday: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetFromToday)
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}
