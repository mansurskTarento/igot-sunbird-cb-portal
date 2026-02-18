export namespace NSPeerValidation {
  // Survey Question Types
  export interface ISurveyQuestion {
    id: string
    text: string
    type: 'rating' | 'text' | 'single-select' | 'multi-select'
    required: boolean
    maxLength?: number
    options?: string[] // For single-select and multi-select questions
  }

  // Survey Response
  export interface ISurveyResponse {
    questionId: string
    value: number | string | string[] // Array for multi-select
  }

  // Uploaded Document
  export interface IUploadedDocument {
    id: string
    name: string
    type: string
    size: number
    url: string
    uploadedAt: Date
  }

  // Peer Information
  export interface IPeerInfo {
    id: string
    name: string
    email: string
    designation: string
  }

  // Survey Submission
  export interface ISurveySubmission {
    courseId: string
    responses: ISurveyResponse[]
    documents: IUploadedDocument[]
    reportingOfficer: IPeerInfo | null
    peer: IPeerInfo | null
    subordinate: IPeerInfo | null
  }

  // Survey Popup Data
  export interface ISurveyPopupData {
    learnerName: string
    courseName: string
    completionDate: string
    courseId: string
  }

  // Dashboard Item
  export interface IDashboardItem {
    id: string
    learnerName?: string
    courseName: string
    status: ESurveyStatus
    endDate: string
    thumbnail?: string
    type?: 'incoming' | 'outgoing' // Added for better mock filtering
  }

  // Dashboard Filters
  export interface IDashboardFilters {
    tab: number
    search: string
    sortBy: string
    dateFilter: string
    pageIndex: number
    pageSize: number
  }

  // Review Request
  export interface IReviewRequest {
    id: string
    learnerName: string
    designation: string
    courseName: string
    completionDate: string
    responses: ISurveyResponse[]
    documents: IUploadedDocument[]
    reportingOfficer: IPeerInfo
    reportingOfficerStatus: 'agreed' | 'pending' | 'rejected'
    forwardedTo?: IPeerInfo
    peer?: IPeerInfo
    subordinate?: IPeerInfo
  }

  // Review Submission
  export interface IReviewSubmission {
    requestId: string
    ratings: { questionId: string; rating: number }[]
    decision: 'approved' | 'rejected'
  }

  // Enums
  export enum ESurveyStatus {
    ACTIVE = 'Active',
    EXPIRED = 'Expired',
    COMPLETED = 'Completed', // Added COMPLETED status
  }
}
