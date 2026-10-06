import { NotificationsService } from './notifications.service'
import { of } from 'rxjs'

// NotificationsService uses plain constructor injection, so it can be
// instantiated directly with mocked dependencies — no TestBed needed.
describe('NotificationsService', () => {
  let service: NotificationsService
  let mockHttp: any
  let mockRouter: any
  let mockConfigSvc: any
  let mockSnackBar: any
  let openSpy: jest.SpyInstance

  const environment = {
    portalsForNotifications: {
      cbp: 'https://cbp.example.com',
      mdo: 'https://mdo.example.com',
    },
  }

  const buildNotification = (subCategory: string) => ({
    category: 'CONTENT',
    sub_category: subCategory,
    message: { data: { id: 'do_123', batchId: 'batch_1' } },
  })

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    }
    mockRouter = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn().mockReturnValue(Promise.resolve(true)),
    }
    mockConfigSvc = {
      unMappedUser: { profileDetails: { employmentDetails: { departmentName: 'Org A' } } },
    }
    mockSnackBar = { open: jest.fn() }

    service = new NotificationsService(mockHttp, mockRouter, mockConfigSvc)
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined and set orgName from the user profile', () => {
    expect(service).toBeDefined()
    expect(service.orgName).toBe('Org A')
  })

  describe('handleRedirection - Live content', () => {
    const mockContent = (content: any) => {
      jest.spyOn(service, 'getContentData').mockReturnValue(of({ status: 'Live', ...content }))
    }

    it('should open the MDO comprehensive assessment preview for CONTENT_PUBLISHED with Comprehensive Assessment category', () => {
      mockContent({ courseCategory: 'Comprehensive Assessment' })

      service.handleRedirection(buildNotification('CONTENT_PUBLISHED'), environment, [], mockSnackBar)

      expect(service.getContentData).toHaveBeenCalledWith('do_123')
      expect(openSpy).toHaveBeenCalledWith(
        'https://mdo.example.com/app/home/comprehensive-assessment/edit/do_123?mode=view&preview=true&editMode=true&pathUrl=live&step=preview',
        '_blank'
      )
    })

    it('should open the CBP overview for CONTENT_PUBLISHED when category is not Comprehensive Assessment', () => {
      mockContent({ courseCategory: 'Course' })

      service.handleRedirection(buildNotification('CONTENT_PUBLISHED'), environment, [], mockSnackBar)

      expect(openSpy).toHaveBeenCalledWith(
        'https://cbp.example.com/author/content-detail/do_123/overview-v2?isStandaloneResource=false',
        '_blank'
      )
    })

    it('should open the CBP overview for other sub categories even when category is Comprehensive Assessment', () => {
      mockContent({ courseCategory: 'Comprehensive Assessment' })

      service.handleRedirection(buildNotification('CONTENT_REVIEWED'), environment, [], mockSnackBar)

      expect(openSpy).toHaveBeenCalledWith(
        'https://cbp.example.com/author/content-detail/do_123/overview-v2?isStandaloneResource=false',
        '_blank'
      )
    })

    it('should open the batch assignments page for BP_ASSIGNMENT_SUBMIT', () => {
      mockContent({ courseCategory: 'Blended Program' })

      service.handleRedirection(buildNotification('BP_ASSIGNMENT_SUBMIT'), environment, [], mockSnackBar)

      expect(openSpy).toHaveBeenCalledWith(
        'https://cbp.example.com/author/content-detail/do_123/batches/batch_1/assignments',
        '_blank'
      )
    })

    it('should pass isStandaloneResource=true for standalone learning resources', () => {
      mockContent({ primaryCategory: 'Learning Resource', resourceCategory: 'Video' })

      service.handleRedirection(buildNotification('CONTENT_PUBLISHED'), environment, [], mockSnackBar)

      expect(openSpy).toHaveBeenCalledWith(
        'https://cbp.example.com/author/content-detail/do_123/overview-v2?isStandaloneResource=true',
        '_blank'
      )
    })
  })

  describe('handleRedirection - non-Live content', () => {
    it('should show a snackbar when content is retired', () => {
      jest.spyOn(service, 'getContentData').mockReturnValue(of({ status: 'Retired' }))

      service.handleRedirection(buildNotification('CONTENT_PUBLISHED'), environment, [], mockSnackBar)

      expect(openSpy).not.toHaveBeenCalled()
      expect(mockSnackBar.open).toHaveBeenCalledWith('This content is retired.')
    })

    it('should open my-content list for retire related sub categories without fetching content', () => {
      const getContentSpy = jest.spyOn(service, 'getContentData')

      service.handleRedirection(buildNotification('RETIRE_APPROVED'), environment, [], mockSnackBar)

      expect(getContentSpy).not.toHaveBeenCalled()
      expect(openSpy).toHaveBeenCalledWith('https://cbp.example.com/author/cbp/me?status=live', '_blank')
    })
  })
})
