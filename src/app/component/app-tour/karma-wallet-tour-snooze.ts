const SNOOZE_KEY = 'karmaWalletTourSnoozed'

export function snoozeKarmaWalletTour(userId: string): void {
  if (userId) {
    localStorage.setItem(SNOOZE_KEY, userId)
  }
}

export function isKarmaWalletTourSnoozed(userId: string): boolean {
  return !!userId && localStorage.getItem(SNOOZE_KEY) === userId
}

export function clearKarmaWalletTourSnooze(): void {
  localStorage.removeItem(SNOOZE_KEY)
}
