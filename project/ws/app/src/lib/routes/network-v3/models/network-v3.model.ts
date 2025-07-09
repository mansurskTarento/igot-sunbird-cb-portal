export interface routesData {
  name: string
  navigationUrl: string
  routeId: string
  icon?: string
  imageUrl?: string
  queryParams?: any
}

export interface PageChangeEmitter {
  currentPage: number;
  previousPage: number;
  limit: number;
}

export interface tabDetails {
  lable: string;
  key: string;
  recordsCount: number;
}