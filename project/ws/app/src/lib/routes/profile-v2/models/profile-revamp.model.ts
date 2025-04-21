export interface UserStats {
  state: string
  totalPoints: string
  iconUrl: string
  vewAllUrl: string
  stateInfo?: string
}

export interface profileRoutes {
  name: string
  url: string
  icon: string
  isActive: boolean
  id: string
}

export interface serviceHistory {
  designation: string,
  orgDetails: string,
  period: string,
  orgLogo: string
}

export interface educationalQualifications {
  education: string,
  instituteAndLocation: string,
  period: string,
}
