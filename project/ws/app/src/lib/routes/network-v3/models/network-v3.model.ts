export interface routesData {
  name: string
  navigationUrl: string
  routeId: string
  icon?: string
  imageUrl?: string
}

export interface PageChangeEmitter {
  currentPage: number;
  previousPage: number;
  limit: number;
}