export function buildWeeklyClapsData(weeklyClaps: any): any {
  const weekKeys = ['week1', 'week2', 'week3', 'week4']
  const weekLabels = ['W1', 'W2', 'W3', 'W4']
  const now = new Date()
  const startDate = weeklyClaps && weeklyClaps.startDate ? new Date(weeklyClaps.startDate) : null
  const endDate = weeklyClaps && weeklyClaps.endDate ? new Date(weeklyClaps.endDate) : null
  const periodMs = (startDate && endDate) ? (endDate.getTime() - startDate.getTime()) / 4 : 0

  const weekList = weekKeys.map((key, i) => {
    let activeWeek = false
    if (startDate && periodMs) {
      const wStart = new Date(startDate.getTime() + i * periodMs)
      const wEnd = new Date(startDate.getTime() + (i + 1) * periodMs)
      activeWeek = now >= wStart && now < wEnd
    }
    return { label: weekLabels[i], key, activeWeek }
  })
  return { enableCard: true, weekList }
}
