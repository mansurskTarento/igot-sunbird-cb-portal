export type TKarmaTourPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface IKarmaTourStep {
  selector: string
  title: string
  body: string
  placement: TKarmaTourPlacement
  before?: () => Promise<void> | void
  onBack?: () => Promise<void> | void
  radius?: number
}

/** Which control the user pressed. 'ok' is the last step's primary, 'next' every other's. */
export type TKarmaTourAction = 'skip' | 'back' | 'next' | 'ok'

export interface IKarmaTourAction {
  /** 1-based, so it matches the "STEP n OF 6" the user is looking at */
  step: number
  action: TKarmaTourAction
}
