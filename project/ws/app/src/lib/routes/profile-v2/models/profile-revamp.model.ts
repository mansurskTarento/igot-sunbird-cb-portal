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

export interface Theme {
  name: string;
  id: number;
}

export interface Competency {
  name: string;
  themes: Theme[];
  active?: boolean;
}

export interface achievement {
  certificateName: string,
  provider: string,
  period: string,
  certificateUrl?: string
}

export interface person {
  id: string;
  name: string;
  designation: string;
  profileImage?: string;
  connectionStatus: 'none' | 'pending' | 'connected';
}

export interface Community {
  id: string;
  name: string;
  thumbnail?: string;
  memberCount: number;
  postCount: number;
  ownerName: string;
  ownerThumbnail?: string;
}
