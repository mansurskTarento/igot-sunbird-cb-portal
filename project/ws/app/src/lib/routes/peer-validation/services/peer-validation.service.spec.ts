import { of } from 'rxjs'
import { PeerValidationService } from '../services/peer-validation.service'

describe('PeerValidationService', () => {
  let service: PeerValidationService
  let httpMock: { get: jest.Mock; post: jest.Mock; patch: jest.Mock }
  let configSvcMock: any

  beforeEach(() => {
    httpMock = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    }
    configSvcMock = {
      userProfile: { rootOrgId: 'testOrgId', firstName: 'John', lastName: 'Doe' },
    }
    service = new PeerValidationService(httpMock as any, configSvcMock)
  })

  // ─── getAllUsers ─────────────────────────────────────────────────────────────

  describe('getAllUsers', () => {
    it('should POST to SEARCH_USERS with provided rootOrgId and query', (done) => {
      httpMock.post.mockReturnValue(of({ result: [] }))
      service.getAllUsers('customOrg', 'test query').subscribe(() => {
        expect(httpMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/user/v1/search',
          { request: { query: 'test query', filters: { rootOrgId: 'customOrg' } } }
        )
        done()
      })
    })

    it('should fall back to configSvc rootOrgId when not supplied', (done) => {
      httpMock.post.mockReturnValue(of({}))
      service.getAllUsers().subscribe(() => {
        expect(httpMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/user/v1/search',
          { request: { query: '', filters: { rootOrgId: 'testOrgId' } } }
        )
        done()
      })
    })
  })

  // ─── getUserById ─────────────────────────────────────────────────────────────

  describe('getUserById', () => {
    it('should GET the correct user endpoint', (done) => {
      httpMock.get.mockReturnValue(of({ result: { response: { id: 'u1' } } }))
      service.getUserById('u1').subscribe(res => {
        expect(res).toEqual({ result: { response: { id: 'u1' } } })
        expect(httpMock.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read/u1')
        done()
      })
    })
  })

  // ─── getAllUsersBySurveyCreator ───────────────────────────────────────────────

  describe('getAllUsersBySurveyCreator', () => {
    it('should use result.response.rootOrgId from user response', (done) => {
      httpMock.get.mockReturnValue(of({ result: { response: { rootOrgId: 'orgA' } } }))
      httpMock.post.mockReturnValue(of({}))
      service.getAllUsersBySurveyCreator('creator1').subscribe(() => {
        expect(httpMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/user/v1/search',
          { request: { query: '', filters: { rootOrgId: 'orgA' } } }
        )
        done()
      })
    })

    it('should fall back to result.rootOrgId', (done) => {
      httpMock.get.mockReturnValue(of({ result: { rootOrgId: 'orgB' } }))
      httpMock.post.mockReturnValue(of({}))
      service.getAllUsersBySurveyCreator('creator2').subscribe(() => {
        expect(httpMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/user/v1/search',
          { request: { query: '', filters: { rootOrgId: 'orgB' } } }
        )
        done()
      })
    })

    it('should fall back to configSvc rootOrgId', (done) => {
      httpMock.get.mockReturnValue(of({ result: {} }))
      httpMock.post.mockReturnValue(of({}))
      service.getAllUsersBySurveyCreator('creator3').subscribe(() => {
        expect(httpMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/user/v1/search',
          { request: { query: '', filters: { rootOrgId: 'testOrgId' } } }
        )
        done()
      })
    })
  })

  // ─── getSurveyQuestions ──────────────────────────────────────────────────────

  describe('getSurveyQuestions', () => {
    it('should throw with errMsg when params.status is failed', (done) => {
      httpMock.get.mockReturnValue(of({ params: { status: 'failed', errMsg: 'Form not found' } }))
      service.getSurveyQuestions('form1').subscribe({
        error: err => { expect(err.message).toBe('Form not found'); done() },
      })
    })

    it('should throw default message when errMsg is absent', (done) => {
      httpMock.get.mockReturnValue(of({ params: { status: 'failed' } }))
      service.getSurveyQuestions('form1').subscribe({
        error: err => { expect(err.message).toBe('Failed to load survey form.'); done() },
      })
    })

    it('should map numericRating field correctly', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              {
                fieldType: 'numericRating', id: 'q1', label: 'Rate it', isRequired: true,
                values: [{ value: '1' }, { value: '2' }, { value: '3' }],
                minLabel: 'Low', maxLabel: 'High'
              },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => {
          expect(qs.length).toBe(1)
          expect(qs[0].type).toBe('numericRating')
          expect(qs[0].ratingCount).toBe(3)
          expect(qs[0].required).toBe(true)
          expect(qs[0].minLabel).toBe('Low')
          expect(qs[0].maxLabel).toBe('High')
          done()
        },
      })
    })

    it('should map rating field type to numericRating', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'rating', id: 'q1', label: 'Rating', values: [{ value: '1' }, { value: '2' }] },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('numericRating'); expect(qs[0].ratingCount).toBe(2); done() },
      })
    })

    it('should map range field type to numericRating', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'range', id: 'q1', label: 'Range', values: [{ value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }] },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('numericRating'); expect(qs[0].ratingCount).toBe(4); done() },
      })
    })

    it('should map textarea field to textArea type', (done) => {
      httpMock.get.mockReturnValue(of({
        result: { response: { fields: [{ fieldType: 'textarea', id: 'q1', label: 'Comment', maxLength: 500 }] } },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('textArea'); expect(qs[0].maxLength).toBe(500); done() },
      })
    })

    it('should map text field to textArea type', (done) => {
      httpMock.get.mockReturnValue(of({
        result: { response: { fields: [{ fieldType: 'text', id: 'q1', label: 'Text Q' }] } },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('textArea'); done() },
      })
    })

    it('should map radio field with values to radio type', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              {
                fieldType: 'radio', id: 'q1', label: 'Radio Q',
                values: [{ value: 'Option A' }, { key: 'optB' }]
              },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => {
          expect(qs[0].type).toBe('radio')
          expect(qs[0].options).toEqual(['Option A', 'optB'])
          done()
        },
      })
    })

    it('should map dropdown field to radio type', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'dropdown', id: 'q1', label: 'Drop', values: [{ value: 'V1' }, { value: 'V2' }] },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('radio'); done() },
      })
    })

    it('should map single-select field to radio type', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'single-select', id: 'q1', label: 'Single', values: [{ value: 'A' }] },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('radio'); done() },
      })
    })

    it('should map checkbox field', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'checkbox', id: 'q1', label: 'Check Q', values: [{ value: 'X' }, { value: 'Y' }] },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('checkbox'); expect(qs[0].options).toEqual(['X', 'Y']); done() },
      })
    })

    it('should map multi-select field to checkbox', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'multi-select', id: 'q1', label: 'Multi', values: [{ value: 'A' }, { value: 'B' }] },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('checkbox'); done() },
      })
    })

    it('should filter out separator and heading fields', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'separator', id: 'sep', label: 'Sep' },
              { fieldType: 'heading', id: 'h', label: 'Heading' },
              { fieldType: 'text', id: 'q1', label: 'Q1' },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs.length).toBe(1); done() },
      })
    })

    it('should use field.options when field.values is absent or empty', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              {
                fieldType: 'text', id: 'q1', label: 'Q1',
                options: [{ label: 'A' }, { value: 'B' }, 'C']
              },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].options).toEqual(['A', 'B', 'C']); done() },
      })
    })

    it('should return empty array when result is null', (done) => {
      httpMock.get.mockReturnValue(of(null))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs).toEqual([]); done() },
      })
    })

    it('should use empty string for formId when undefined', () => {
      httpMock.get.mockReturnValue(of({ result: { response: { fields: [] } } }))
      service.getSurveyQuestions(undefined as any).subscribe()
      expect(httpMock.get).toHaveBeenCalledWith('/apis/proxies/v8/forms/v2/getFormById?formId=')
    })

    it('should use field.name as id/text fallback when label and id are missing', (done) => {
      httpMock.get.mockReturnValue(of({
        result: { response: { fields: [{ fieldType: 'text', name: 'myField' }] } },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => {
          expect(qs[0].id).toBe('myField')
          expect(qs[0].text).toBe('myField')
          done()
        },
      })
    })

    it('should use Q{index+1} as id when name and id are absent', (done) => {
      httpMock.get.mockReturnValue(of({
        result: { response: { fields: [{ fieldType: 'text', label: 'Some Q' }] } },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].id).toBe('Q1'); done() },
      })
    })

    it('should default ratingCount to 5 when values are absent', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'numericRating', id: 'q1', label: 'Q1' },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].ratingCount).toBe(5); done() },
      })
    })
  })

  // ─── uploadDocument ──────────────────────────────────────────────────────────

  describe('uploadDocument', () => {
    it('should return IUploadedDocument on success', (done) => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      httpMock.post.mockReturnValue(of({ result: { url: 'http://cdn.test/file.pdf' } }))
      service.uploadDocument(file, 'form1').subscribe({
        next: doc => {
          expect(doc.name).toBe('test.pdf')
          expect(doc.url).toBe('http://cdn.test/file.pdf')
          expect(doc.type).toBe('application/pdf')
          expect(doc.size).toBe(file.size)
          expect(doc.uploadedAt).toBeInstanceOf(Date)
          done()
        },
      })
    })

    it('should throw when params.status is failed', (done) => {
      const file = new File(['x'], 'x.pdf', { type: 'application/pdf' })
      httpMock.post.mockReturnValue(of({ params: { status: 'failed', errmsg: 'Upload error' } }))
      service.uploadDocument(file, 'form1').subscribe({
        error: err => { expect(err.message).toBe('Upload error'); done() },
      })
    })

    it('should throw default message when params.err is set but errmsg is absent', (done) => {
      const file = new File(['x'], 'x.pdf', { type: 'application/pdf' })
      httpMock.post.mockReturnValue(of({ params: { err: 'Something' } }))
      service.uploadDocument(file, 'form1').subscribe({
        error: err => { expect(err.message).toBe('Upload failed.'); done() },
      })
    })
  })

  // ─── submitSurvey ────────────────────────────────────────────────────────────

  describe('submitSurvey', () => {
    it('should POST to SUBMIT_SURVEY endpoint', (done) => {
      const submission = { formId: 'f1' } as any
      httpMock.post.mockReturnValue(of({ result: 'ok' }))
      service.submitSurvey(submission).subscribe(res => {
        expect(res).toEqual({ result: 'ok' })
        expect(httpMock.post).toHaveBeenCalledWith('/apis/proxies/v8/forms/peersurvey/submit', submission)
        done()
      })
    })
  })

  // ─── getDashboardData ────────────────────────────────────────────────────────

  describe('getDashboardData', () => {
    const baseFilters = { search: '', sortBy: 'oldest', dateFilter: 'all', pageIndex: 0, pageSize: 10 }

    it('should fetch PEER_EVALUATION_ASSIGNED for tab 0', (done) => {
      httpMock.get.mockReturnValue(of({ result: { notifications: [{ notification_id: 'n1' }], totalCount: 1 } }))
      service.getDashboardData({ ...baseFilters, tab: 0 }).subscribe({
        next: res => {
          expect(res.count).toBe(1)
          expect(res.data).toEqual([{ notification_id: 'n1' }])
          done()
        },
      })
      expect(httpMock.get).toHaveBeenCalledWith(expect.stringContaining('PEER_EVALUATION_ASSIGNED'))
    })

    it('should fetch PEER_REVIEW_ASSIGNED for tab 1', (done) => {
      httpMock.get.mockReturnValue(of({ result: { notifications: [], totalCount: 5 } }))
      service.getDashboardData({ ...baseFilters, tab: 1 }).subscribe({
        next: res => { expect(res.count).toBe(5); done() },
      })
      expect(httpMock.get).toHaveBeenCalledWith(expect.stringContaining('PEER_REVIEW_ASSIGNED'))
    })

    it('should return count 0 and empty data on missing result', (done) => {
      httpMock.get.mockReturnValue(of({}))
      service.getDashboardData({ ...baseFilters, tab: 0 }).subscribe({
        next: res => { expect(res.count).toBe(0); expect(res.data).toEqual([]); done() },
      })
    })
  })

  // ─── markNotificationIgnored ─────────────────────────────────────────────────

  describe('markNotificationIgnored', () => {
    it('should PATCH with IGNORED status', (done) => {
      httpMock.patch.mockReturnValue(of({}))
      service.markNotificationIgnored('notif1', '2024-01-01T00:00:00Z').subscribe(() => {
        expect(httpMock.patch).toHaveBeenCalledWith(
          '/apis/proxies/v8/v1/notifications/v2/read',
          {
            request: {
              type: 'individual',
              ids: ['notif1'],
              created_at: '2024-01-01T00:00:00Z',
              status: 'IGNORED',
            },
          }
        )
        done()
      })
    })
  })

  // ─── getDashboardCounts ──────────────────────────────────────────────────────

  describe('getDashboardCounts', () => {
    it('should combine pending and incoming counts', (done) => {
      httpMock.get
        .mockReturnValueOnce(of({ result: { totalCount: 4 } }))
        .mockReturnValueOnce(of({ result: { totalCount: 6 } }))
      service.getDashboardCounts().subscribe({
        next: counts => {
          expect(counts.pending).toBe(4)
          expect(counts.incoming).toBe(6)
          expect(counts.all).toBe(10)
          done()
        },
      })
    })

    it('should default to 0 when totalCount is missing', (done) => {
      httpMock.get
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({}))
      service.getDashboardCounts().subscribe({
        next: counts => {
          expect(counts.pending).toBe(0)
          expect(counts.incoming).toBe(0)
          expect(counts.all).toBe(0)
          done()
        },
      })
    })
  })

  // ─── getSubmission ───────────────────────────────────────────────────────────

  describe('getSubmission', () => {
    it('should return null for empty content array', (done) => {
      httpMock.post.mockReturnValue(of({ result: { response: { content: [] } } }))
      service.getSubmission('u1', 'f1', 'c1').subscribe({
        next: data => { expect(data).toBeNull(); done() },
      })
    })

    it('should return null when content is absent', (done) => {
      httpMock.post.mockReturnValue(of({ result: { response: {} } }))
      service.getSubmission('u1', 'f1', 'c1').subscribe({
        next: data => { expect(data).toBeNull(); done() },
      })
    })

    it('should map submission content to IReviewRequest', (done) => {
      const item = {
        submissionId: 'sub1', formId: 'f1', submittedBy: 'user1',
        fullName: 'Alice Bob', contextName: 'My Course',
        submittedDate: '2024-06-15T08:00:00Z',
        contextId: 'ctx1', contextOrgId: 'org1', status: 'PENDING',
        responses: [{ questionId: 'q1', question: 'Q?', answer: 'Ans', answerType: 'textarea', isRequired: true }],
        attachments: ['http://cdn.test/doc.pdf'],
      }
      httpMock.post.mockReturnValue(of({ result: { response: { content: [item] } } }))
      service.getSubmission('user1', 'f1', 'ctx1').subscribe({
        next: data => {
          expect(data).not.toBeNull()
          expect(data!.submissionId).toBe('sub1')
          expect(data!.learnerName).toBe('Alice Bob')
          expect(data!.courseName).toBe('My Course')
          expect(data!.responses.length).toBe(1)
          expect(data!.attachments).toEqual(['http://cdn.test/doc.pdf'])
          done()
        },
      })
    })

    it('should return empty completionDate when submittedDate is absent', (done) => {
      httpMock.post.mockReturnValue(of({
        result: {
          response: {
            content: [
              { submissionId: 's2', formId: 'f2', responses: [], attachments: [] },
            ]
          }
        }
      }))
      service.getSubmission('u2', 'f2', 'c2').subscribe({
        next: data => { expect(data!.completionDate).toBe(''); done() },
      })
    })

    it('should map response isRequired default to false when absent', (done) => {
      const item = {
        submissionId: 's3', formId: 'f3',
        responses: [{ questionId: 'q1', question: 'Q1', answer: 'A', answerType: 'text' }],
        attachments: [],
      }
      httpMock.post.mockReturnValue(of({ result: { response: { content: [item] } } }))
      service.getSubmission('u3', 'f3', 'c3').subscribe({
        next: data => { expect(data!.responses[0].isRequired).toBe(false); done() },
      })
    })
  })

  // ─── submitReview ────────────────────────────────────────────────────────────

  describe('submitReview', () => {
    it('should POST review to SUBMIT_SURVEY endpoint', (done) => {
      const review = { actionType: 'REVIEW', submissionId: 's1', reviewStatus: 'APPROVED', notificationId: 'n1', createdAt: '' } as any
      httpMock.post.mockReturnValue(of({ success: true }))
      service.submitReview(review).subscribe(res => {
        expect(res).toEqual({ success: true })
        expect(httpMock.post).toHaveBeenCalledWith('/apis/proxies/v8/forms/peersurvey/submit', review)
        done()
      })
    })
  })

  // ─── dashboardRefresh$ ───────────────────────────────────────────────────────

  describe('dashboardRefresh$', () => {
    it('should emit when next() is called', (done) => {
      service.dashboardRefresh$.subscribe(() => done())
      service.dashboardRefresh$.next()
    })

    it('should allow multiple subscribers', () => {
      const results: number[] = []
      service.dashboardRefresh$.subscribe(() => results.push(1))
      service.dashboardRefresh$.subscribe(() => results.push(2))
      service.dashboardRefresh$.next()
      expect(results).toEqual([1, 2])
    })
  })

  // ─── getSurveyQuestions – additional branch coverage ────────────────────────

  describe('getSurveyQuestions – branch coverage additions', () => {
    it('should keep type as textArea when fieldType does not match any condition', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'fileUpload', id: 'q1', label: 'Upload' },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].type).toBe('textArea'); done() },
      })
    })

    it('should leave options undefined when field has no values and no options', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'textArea', id: 'q1', label: 'Text', values: [], options: null },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].options).toBeUndefined(); done() },
      })
    })

    it('should use key fallback when v.value is absent in values array', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              {
                fieldType: 'radio', id: 'q1', label: 'Radio',
                values: [{ key: 'opt1' }, { value: 'opt2' }]
              },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].options).toEqual(['opt1', 'opt2']); done() },
      })
    })

    it('should use opt.value fallback when opt.label is absent in field.options', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              {
                fieldType: 'text', id: 'q1', label: 'T',
                options: [{ value: 'val1' }, 'str2']
              },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs[0].options).toEqual(['val1', 'str2']); done() },
      })
    })

    it('should filter out separator and heading fields', (done) => {
      httpMock.get.mockReturnValue(of({
        result: {
          response: {
            fields: [
              { fieldType: 'separator', id: 's1', label: 'Sep' },
              { fieldType: 'heading', id: 'h1', label: 'Head' },
              { fieldType: 'textArea', id: 'q1', label: 'Real Q' },
            ]
          }
        },
      }))
      service.getSurveyQuestions('form1').subscribe({
        next: qs => { expect(qs.length).toBe(1); expect(qs[0].id).toBe('q1'); done() },
      })
    })
  })
})
