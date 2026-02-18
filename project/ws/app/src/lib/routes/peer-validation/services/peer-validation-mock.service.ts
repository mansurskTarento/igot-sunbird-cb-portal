import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { delay } from 'rxjs/operators'
import { NSPeerValidation } from '../models/peer-validation.model'

@Injectable({
  providedIn: 'root',
})
export class PeerValidationMockService {
  // Storage for submitted surveys (simulating backend storage)
  private submittedSurveys: Map<string, NSPeerValidation.ISurveySubmission> = new Map()
  private requestIdCounter = 1

  constructor() { }

  // Get survey questions
  getSurveyQuestions(): Observable<NSPeerValidation.ISurveyQuestion[]> {
    const questions: NSPeerValidation.ISurveyQuestion[] = [
      {
        id: 'Q1',
        text: 'How confident are you in applying the communication frameworks learned in this course to your daily workplace interactions?',
        type: 'rating',
        required: true,
      },
      {
        id: 'Q2',
        text: 'To what extent has this course improved your ability to manage difficult conversations with stakeholders?',
        type: 'rating',
        required: true,
      },
      {
        id: 'Q3',
        text: 'Which learning method did you find most effective in this course?',
        type: 'single-select',
        required: true,
        options: [
          'Video lectures',
          'Reading materials',
          'Hands-on exercises',
          'Group discussions',
          'Case studies',
        ],
      },
      {
        id: 'Q4',
        text: 'Which areas of your work have been impacted by this course? (Select all that apply)',
        type: 'multi-select',
        required: true,
        options: [
          'Team collaboration',
          'Client communication',
          'Presentation skills',
          'Written communication',
          'Conflict resolution',
          'Meeting facilitation',
        ],
      },
      {
        id: 'Q5',
        text: 'Describe a specific instance where you applied the learnings',
        type: 'text',
        required: true,
        maxLength: 300,
      },
    ]
    return of(questions).pipe(delay(500))
  }

  // Search peers for autocomplete
  searchPeers(query: string): Observable<NSPeerValidation.IPeerInfo[]> {
    const allPeers: NSPeerValidation.IPeerInfo[] = [
      { id: '1', name: 'Harshit T Rao', email: 'harshit.rao@example.com', designation: 'Manager' },
      { id: '2', name: 'Preet Bharat', email: 'preet.bharat@example.com', designation: 'Team Lead' },
      { id: '3', name: 'Satvik Mukherjee', email: 'satvik.m@example.com', designation: 'Developer' },
      { id: '4', name: 'Anjali Sharma', email: 'anjali.s@example.com', designation: 'Senior Developer' },
      { id: '5', name: 'Rahul Verma', email: 'rahul.v@example.com', designation: 'Team Lead' },
    ]

    const filtered = allPeers.filter(peer =>
      peer.name.toLowerCase().includes(query.toLowerCase())
    )
    return of(filtered).pipe(delay(300))
  }

  // Upload document
  uploadDocument(file: File): Observable<NSPeerValidation.IUploadedDocument> {
    const uploadedDoc: NSPeerValidation.IUploadedDocument = {
      id: `DOC_${Date.now()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
    }
    return of(uploadedDoc).pipe(delay(1000))
  }

  // Submit survey
  submitSurvey(submission: NSPeerValidation.ISurveySubmission): Observable<{ success: boolean, requestId: string }> {
    console.log('Survey submitted:', submission)

    // Generate a unique request ID
    const requestId = `REQ${String(this.requestIdCounter).padStart(3, '0')}`
    this.requestIdCounter++

    // Store the submission
    this.submittedSurveys.set(requestId, submission)

    return of({ success: true, requestId }).pipe(delay(800))
  }

  // Centralized Mock Data
  private allMockData: NSPeerValidation.IDashboardItem[] = [
    { id: 'REQ001', learnerName: 'Ramesh Solankar', courseName: 'Effective Communication Strategies', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-02-15', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ002', learnerName: 'Anjali Sharma', courseName: 'Leadership Development Program', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-02-20', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ003', learnerName: 'Rahul Verma', courseName: 'Data Analytics Fundamentals', status: NSPeerValidation.ESurveyStatus.EXPIRED, endDate: '2026-01-30', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ004', learnerName: 'Priya Patel', courseName: 'Agile Methodologies', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-02-25', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ005', learnerName: 'Vikram Singh', courseName: 'Project Management Professional', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-03-01', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ006', learnerName: 'Neha Gupta', courseName: 'Python for Data Science', status: NSPeerValidation.ESurveyStatus.EXPIRED, endDate: '2025-12-15', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ007', learnerName: 'Amit Kumar', courseName: 'Cloud Computing Essentials', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-02-28', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ008', learnerName: 'Sneha Reddy', courseName: 'Cyber Security Basics', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-03-05', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ009', learnerName: 'Rajesh Koothrappali', courseName: 'UX Design Principles', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-03-10', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ010', learnerName: 'Simran Jones', courseName: 'Business Intelligence', status: NSPeerValidation.ESurveyStatus.EXPIRED, endDate: '2026-01-10', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ011', learnerName: 'Arjun Das', courseName: 'Digital Marketing 101', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-03-15', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ012', learnerName: 'Kavita Krishnan', courseName: 'Machine Learning A-Z', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-03-20', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ013', learnerName: 'Devops Guy', courseName: 'Introduction to DevOps', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-03-25', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ014', learnerName: 'Crypto Fan', courseName: 'Blockchain Basics', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-04-01', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ015', learnerName: 'Excel Master', courseName: 'Advanced Excel', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-04-05', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ016', learnerName: 'Speaker One', courseName: 'Public Speaking Mastery', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-04-10', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ017', learnerName: 'Design Thinker', courseName: 'Design Thinking', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-04-15', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ018', learnerName: 'Accountant A', courseName: 'Financial Accounting', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-04-20', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    { id: 'REQ019', learnerName: 'HR Manager', courseName: 'Organizational Behavior', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-04-25', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ020', learnerName: 'CEO Potential', courseName: 'Strategic Management', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-04-30', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'outgoing' },
    // Additional Incoming Requests to reach 24
    { id: 'REQ021', learnerName: 'John Doe', courseName: 'Java Programming', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-01', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ022', learnerName: 'Jane Smith', courseName: 'Angular Fundamentals', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-02', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ023', learnerName: 'Alice Cooper', courseName: 'React Native', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-03', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ024', learnerName: 'Bob Marley', courseName: 'AWS Essentials', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-04', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ025', learnerName: 'Charlie Chaplin', courseName: 'Docker for Beginners', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-05', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ026', learnerName: 'David Beckham', courseName: 'Kubernetes Mastery', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-06', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ027', learnerName: 'Eve Polastri', courseName: 'Cyber Security Advanced', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-07', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ028', learnerName: 'Frank Sinatra', courseName: 'Music Theory', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-08', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ029', learnerName: 'Grace Hopper', courseName: 'Computer Science 101', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-09', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ030', learnerName: 'Harry Potter', courseName: 'Magic of Python', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-10', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ031', learnerName: 'Iron Man', courseName: 'Robotics Engineering', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-11', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ032', learnerName: 'Jack Sparrow', courseName: 'Navigation Skills', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-12', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ033', learnerName: 'Kate Winslet', courseName: 'Acting Masterclass', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-13', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
    { id: 'REQ034', learnerName: 'Leo DiCaprio', courseName: 'Environmental Science', status: NSPeerValidation.ESurveyStatus.ACTIVE, endDate: '2026-05-14', thumbnail: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg', type: 'incoming' },
  ]

  // Get dashboard data
  getDashboardData(filters: NSPeerValidation.IDashboardFilters): Observable<{ data: NSPeerValidation.IDashboardItem[], count: number }> {
    let filtered = [...this.allMockData]

    // 1. Filter by Tab
    if (filters.tab === 0) {
      // Pending Survey (Outgoing)
      filtered = filtered.filter(item => item.type === 'outgoing')
    } else if (filters.tab === 1) {
      // Incoming Request (Incoming and NOT completed)
      filtered = filtered.filter(item => item.type === 'incoming' && item.status !== NSPeerValidation.ESurveyStatus.COMPLETED)
    }
    // Tab 2 (All) - no filtering, return everything (including completed)

    // 2. Filter by Search
    if (filters.search) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(item =>
        item.courseName.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        (item.learnerName && item.learnerName.toLowerCase().includes(query))
      )
    }

    // 3. Filter by Date (Mock logic)
    const today = new Date()
    const msPerDay = 24 * 60 * 60 * 1000

    if (filters.dateFilter === '7days') {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.endDate)
        const diffDays = (today.getTime() - itemDate.getTime()) / msPerDay
        return Math.abs(diffDays) <= 7
      })
    } else if (filters.dateFilter === '30days') {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.endDate)
        const diffDays = (today.getTime() - itemDate.getTime()) / msPerDay
        return Math.abs(diffDays) <= 30
      })
    } else if (filters.dateFilter === '90days') {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.endDate)
        const diffDays = (today.getTime() - itemDate.getTime()) / msPerDay
        return Math.abs(diffDays) <= 90
      })
    }

    // 4. Sort
    if (filters.sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    } else if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    }

    const totalCount = filtered.length

    // 5. Pagination
    const startIndex = filters.pageIndex * filters.pageSize
    const endIndex = startIndex + filters.pageSize
    const paginatedData = filtered.slice(startIndex, endIndex)

    return of({ data: paginatedData, count: totalCount }).pipe(delay(600))
  }

  getDashboardCounts(): Observable<{ all: number, pending: number, incoming: number }> {
    const pending = this.allMockData.filter(item => item.type === 'outgoing').length
    const incoming = this.allMockData.filter(item => item.type === 'incoming' && item.status !== NSPeerValidation.ESurveyStatus.COMPLETED).length
    const all = this.allMockData.length

    return of({ all, pending, incoming }).pipe(delay(300))
  }

  // Get review request
  getReviewRequest(id: string): Observable<NSPeerValidation.IReviewRequest> {
    // Check if we have a stored submission for this ID
    const storedSubmission = this.submittedSurveys.get(id)

    if (storedSubmission) {
      // Convert the stored submission to a review request
      const reviewRequest: NSPeerValidation.IReviewRequest = {
        id,
        learnerName: 'Current User', // In real app, this would come from user session
        designation: 'Senior Developer',
        courseName: storedSubmission.courseId, // In real app, fetch course name from courseId
        completionDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        responses: storedSubmission.responses,
        documents: storedSubmission.documents,
        reportingOfficer: storedSubmission.reportingOfficer || {
          id: 'RO001',
          name: 'Not Selected',
          email: '',
          designation: '',
        },
        reportingOfficerStatus: 'agreed',
        forwardedTo: storedSubmission.peer || storedSubmission.subordinate || undefined,
        peer: storedSubmission.peer || undefined,
        subordinate: storedSubmission.subordinate || undefined,
      }
      return of(reviewRequest).pipe(delay(700))
    }

    // Fallback to default mock data if no submission found
    const mockRequest: NSPeerValidation.IReviewRequest = {
      id,
      learnerName: 'Ramesh Solankar',
      designation: 'Senior Developer',
      courseName: 'Effective Communication Strategies',
      completionDate: '08 Feb 2026',
      responses: [
        { questionId: 'Q1', value: 4 },
        { questionId: 'Q2', value: 4 },
        { questionId: 'Q3', value: 'Hands-on exercises' },
        { questionId: 'Q4', value: ['Team collaboration', 'Client communication', 'Presentation skills'] },
        { questionId: 'Q5', value: 'A comprehensive course aimed at developing leadership capabilities, communication skills, and decision-making strategies to navigate complex challenges effectively.' },
      ],
      documents: [
        {
          id: 'DOC001',
          name: 'video0011.mp4',
          type: 'video/mp4',
          size: 14 * 1024 * 1024, // 14 MB
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          uploadedAt: new Date('2026-02-07'),
        },
        {
          id: 'DOC002',
          name: 'doc0011.pdf',
          type: 'application/pdf',
          size: 4 * 1024 * 1024, // 4 MB
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          uploadedAt: new Date('2026-02-07'),
        },
      ],
      reportingOfficer: {
        id: 'RO001',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        designation: 'Senior Manager',
      },
      reportingOfficerStatus: 'agreed',
      forwardedTo: {
        id: '1',
        name: 'Harshit T Rao',
        email: 'harshit.rao@example.com',
        designation: 'Manager',
      },
    }
    return of(mockRequest).pipe(delay(700))
  }

  // Submit review
  submitReview(submission: NSPeerValidation.IReviewSubmission): Observable<{ success: boolean }> {
    console.log('Review submitted:', submission)

    // Update status in mock data
    const itemIndex = this.allMockData.findIndex(item => item.id === submission.requestId)
    if (itemIndex > -1) {
      this.allMockData[itemIndex].status = NSPeerValidation.ESurveyStatus.COMPLETED
    }

    return of({ success: true }).pipe(delay(800))
  }
}
