import { of } from 'rxjs'
import { SimpleChange } from '@angular/core'
import { UserSearchTableComponent } from './user-search-table.component'

const makeUser = (id: string, firstName = 'User', lastName = 'Test') => ({
  id,
  userId: id,
  firstName,
  lastName,
  profileDetails: { professionalDetails: [{ designation: 'Engineer' }] },
})

describe('UserSearchTableComponent', () => {
  let component: UserSearchTableComponent
  let peerValidationServiceMock: any
  let configSvcMock: any

  beforeEach(() => {
    peerValidationServiceMock = {
      getAllUsers: jest.fn().mockReturnValue(of({
        result: { response: { content: [makeUser('u1'), makeUser('u2', 'Bob', 'Smith')] } },
      })),
    }
    configSvcMock = {
      userProfile: { userId: 'currentUser' },
    }
    component = new UserSearchTableComponent(null, peerValidationServiceMock, configSvcMock)
  })

  afterEach(() => {
    try { component.ngOnDestroy() } catch { /* ignore */ }
  })

  // ─── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should set currentUserId from configSvc', () => {
      expect(component.currentUserId).toBe('currentUser')
    })

    it('should set selectedUserIds from MAT_DIALOG_DATA when data is provided', () => {
      const comp = new UserSearchTableComponent(
        { selectedUserIds: ['x1', 'x2'] },
        peerValidationServiceMock,
        configSvcMock
      )
      expect(comp.selectedUserIds).toEqual(['x1', 'x2'])
    })

    it('should default selectedUserIds to empty array when data is null', () => {
      expect(component.selectedUserIds).toEqual([])
    })
  })

  // ─── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should fetch users on init', () => {
      component.ngOnInit()
      expect(peerValidationServiceMock.getAllUsers).toHaveBeenCalledWith(undefined, '')
      expect(component.filteredUsers.length).toBe(2)
    })

    it('should use contextOrgId when provided', () => {
      component.contextOrgId = 'org1'
      component.ngOnInit()
      expect(peerValidationServiceMock.getAllUsers).toHaveBeenCalledWith('org1', '')
    })
  })

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      component.ngOnInit()
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  // ─── ngOnChanges ──────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should NOT re-fetch on the first change of searchQuery', () => {
      component.ngOnInit()
      const callCountBefore = peerValidationServiceMock.getAllUsers.mock.calls.length
      component.ngOnChanges({
        searchQuery: new SimpleChange(undefined, 'hello', true), // firstChange = true
      })
      expect(peerValidationServiceMock.getAllUsers.mock.calls.length).toBe(callCountBefore)
    })

    it('should debounce and fetch on subsequent searchQuery changes', () => {
      jest.useFakeTimers()
      component.ngOnInit()
      // Set the @Input property to the new value before triggering ngOnChanges
      component.searchQuery = 'angular'
      component.ngOnChanges({
        searchQuery: new SimpleChange('', 'angular', false),
      })
      jest.runAllTimers()
      expect(peerValidationServiceMock.getAllUsers).toHaveBeenCalledWith(undefined, 'angular')
      jest.useRealTimers()
    })
  })

  // ─── fetchUsers ───────────────────────────────────────────────────────────

  describe('fetchUsers', () => {
    it('should populate filteredUsers from result.response.content', () => {
      component.fetchUsers('')
      expect(component.filteredUsers.length).toBe(2)
    })

    it('should fall back to result.content', () => {
      peerValidationServiceMock.getAllUsers.mockReturnValue(of({ result: { content: [makeUser('u3')] } }))
      component.fetchUsers('')
      expect(component.filteredUsers[0].id).toBe('u3')
    })

    it('should fall back to raw array response', () => {
      peerValidationServiceMock.getAllUsers.mockReturnValue(of([makeUser('u4')]))
      component.fetchUsers('')
      expect(component.filteredUsers[0].id).toBe('u4')
    })

    it('should set filteredUsers to [] on error', () => {
      peerValidationServiceMock.getAllUsers.mockImplementation(() => ({
        subscribe: ({ error }: any) => error(new Error('Network error')),
      }))
      component.filteredUsers = [makeUser('u1')]
      component.fetchUsers('')
      expect(component.filteredUsers).toEqual([])
    })
  })

  // ─── toggleUser ───────────────────────────────────────────────────────────

  describe('toggleUser', () => {
    beforeEach(() => { component.ngOnInit() })

    it('should emit userToggled for a non-current, non-max user', () => {
      const emitSpy = jest.spyOn(component.userToggled, 'emit')
      const u = makeUser('u1')
      component.toggleUser(u)
      expect(emitSpy).toHaveBeenCalledWith(u)
    })

    it('should NOT emit when user is the current user', () => {
      const emitSpy = jest.spyOn(component.userToggled, 'emit')
      const u = makeUser('currentUser')
      component.toggleUser(u)
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('should NOT emit when max is reached and user is not already selected', () => {
      component.selectedUserIds = ['a', 'b', 'c']
      component.maxSelect = 3
      const emitSpy = jest.spyOn(component.userToggled, 'emit')
      component.toggleUser(makeUser('new'))
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('should emit when already selected (deselect), even when at max', () => {
      component.selectedUserIds = ['u1', 'u2', 'u3']
      component.maxSelect = 3
      const emitSpy = jest.spyOn(component.userToggled, 'emit')
      component.toggleUser(makeUser('u1'))
      expect(emitSpy).toHaveBeenCalled()
    })

    it('should call event.stopPropagation when event is passed', () => {
      const fakeEvent = { stopPropagation: jest.fn() } as any
      component.toggleUser(makeUser('u1'), fakeEvent)
      expect(fakeEvent.stopPropagation).toHaveBeenCalled()
    })
  })

  // ─── isSelected ───────────────────────────────────────────────────────────

  describe('isSelected', () => {
    it('should return true when user id is in selectedUserIds', () => {
      component.selectedUserIds = ['u1']
      expect(component.isSelected(makeUser('u1'))).toBe(true)
    })

    it('should return false when user id is not in selectedUserIds', () => {
      component.selectedUserIds = ['u2']
      expect(component.isSelected(makeUser('u1'))).toBe(false)
    })
  })

  // ─── isCurrentUser ────────────────────────────────────────────────────────

  describe('isCurrentUser', () => {
    it('should return true when user id matches currentUserId', () => {
      expect(component.isCurrentUser(makeUser('currentUser'))).toBe(true)
    })

    it('should return false for a different user', () => {
      expect(component.isCurrentUser(makeUser('u1'))).toBe(false)
    })
  })

  // ─── isDisabled ───────────────────────────────────────────────────────────

  describe('isDisabled', () => {
    it('should return true for current user', () => {
      expect(component.isDisabled(makeUser('currentUser'))).toBe(true)
    })

    it('should return true when at max and user is not selected', () => {
      component.selectedUserIds = ['a', 'b', 'c']
      component.maxSelect = 3
      expect(component.isDisabled(makeUser('new'))).toBe(true)
    })

    it('should return false when at max but user is already selected', () => {
      component.selectedUserIds = ['u1', 'b', 'c']
      component.maxSelect = 3
      expect(component.isDisabled(makeUser('u1'))).toBe(false)
    })

    it('should return false when below max and user is not current', () => {
      component.selectedUserIds = ['u2']
      component.maxSelect = 3
      expect(component.isDisabled(makeUser('u1'))).toBe(false)
    })
  })

  // ─── getUserFullName ──────────────────────────────────────────────────────

  describe('getUserFullName', () => {
    it('should combine firstName and lastName', () => {
      expect(component.getUserFullName({ firstName: 'Alice', lastName: 'Smith' })).toBe('Alice Smith')
    })

    it('should fall back to user.name', () => {
      expect(component.getUserFullName({ name: 'Bob Jones' })).toBe('Bob Jones')
    })

    it('should return "Unknown" when all fields absent', () => {
      expect(component.getUserFullName({})).toBe('Unknown')
    })
  })

  // ─── getUserInitials ──────────────────────────────────────────────────────

  describe('getUserInitials', () => {
    it('should combine first chars of firstName and lastName', () => {
      expect(component.getUserInitials({ firstName: 'Alice', lastName: 'Smith' })).toBe('AS')
    })

    it('should return first 2 chars of firstName when lastName absent', () => {
      expect(component.getUserInitials({ firstName: 'Alice' })).toBe('AL')
    })

    it('should derive initials from user.name', () => {
      expect(component.getUserInitials({ name: 'Bob Jones' })).toBe('BJ')
    })

    it('should return first 2 chars for single-word name', () => {
      expect(component.getUserInitials({ name: 'Zara' })).toBe('ZA')
    })

    it('should return "U" when nothing is present', () => {
      expect(component.getUserInitials({})).toBe('U')
    })
  })

  // ─── getUserDesignation ───────────────────────────────────────────────────

  describe('getUserDesignation', () => {
    it('should return designation from profileDetails', () => {
      const u = makeUser('u1')
      expect(component.getUserDesignation(u)).toBe('Engineer')
    })

    it('should return "--" when profileDetails is absent', () => {
      expect(component.getUserDesignation({})).toBe('--')
    })

    it('should return "--" when professionalDetails is empty', () => {
      expect(component.getUserDesignation({ profileDetails: { professionalDetails: [] } })).toBe('--')
    })
  })

  // ─── constructor – userProfile undefined branch ───────────────────────────

  describe('constructor – configSvc.userProfile undefined', () => {
    it('should default currentUserId to empty string when userProfile is undefined', () => {
      const configSvcNoProfile = { userProfile: undefined }
      const comp = new UserSearchTableComponent(null, peerValidationServiceMock, configSvcNoProfile as any)
      expect(comp.currentUserId).toBe('')
    })

    it('should default currentUserId to empty string when userProfile.userId is undefined', () => {
      const configSvcNoUserId = { userProfile: {} }
      const comp = new UserSearchTableComponent(null, peerValidationServiceMock, configSvcNoUserId as any)
      expect(comp.currentUserId).toBe('')
    })
  })

  // ─── fetchUsers – console.error branch ───────────────────────────────────

  describe('fetchUsers – error logs to console', () => {
    it('should call console.error with the error when fetch fails', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
      const err = new Error('fetch failed')
      peerValidationServiceMock.getAllUsers.mockImplementation(() => ({
        subscribe: ({ error }: any) => error(err),
      }))
      component.fetchUsers('query')
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching users:', err)
      consoleSpy.mockRestore()
    })
  })
})
