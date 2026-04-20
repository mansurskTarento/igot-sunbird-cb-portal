import { PeerSelectionComponent } from './peer-selection.component'

const makeUser = (id: string, firstName = 'User', lastName = 'Test') => ({
  id,
  userId: id,
  firstName,
  lastName,
})

describe('PeerSelectionComponent', () => {
  let component: PeerSelectionComponent

  beforeEach(() => {
    component = new PeerSelectionComponent()
  })

  // ─── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should initialise empty lists when selectedPeers is undefined', () => {
      component.ngOnInit()
      expect(component.selectedPeersList).toEqual([])
      expect(component.selectedPeerIds).toEqual([])
    })

    it('should restore peers from selectedPeers input', () => {
      const u1 = makeUser('u1', 'Alice', 'Smith')
      const u2 = makeUser('u2', 'Bob', 'Jones')
      component.selectedPeers = { peers: [u1, u2], isValid: true }
      component.ngOnInit()
      expect(component.selectedPeersList).toEqual([u1, u2])
      expect(component.selectedPeerIds).toEqual(['u1', 'u2'])
    })

    it('should handle selectedPeers.peers as empty array', () => {
      component.selectedPeers = { peers: [], isValid: false }
      component.ngOnInit()
      expect(component.selectedPeersList).toEqual([])
    })

    it('should fall back to userId when id is absent', () => {
      const user = { userId: 'uid1', firstName: 'X', lastName: 'Y' }
      component.selectedPeers = { peers: [user], isValid: false }
      component.ngOnInit()
      expect(component.selectedPeerIds).toContain('uid1')
    })
  })

  // ─── toggleTable ──────────────────────────────────────────────────────────

  describe('toggleTable', () => {
    it('should open the table when closed', () => {
      component.isTableOpen = false
      component.toggleTable()
      expect(component.isTableOpen).toBe(true)
    })

    it('should close the table when open', () => {
      component.isTableOpen = true
      component.toggleTable()
      expect(component.isTableOpen).toBe(false)
    })
  })

  // ─── onSearchInput ────────────────────────────────────────────────────────

  describe('onSearchInput', () => {
    it('should open the table when it is closed', () => {
      component.isTableOpen = false
      component.onSearchInput()
      expect(component.isTableOpen).toBe(true)
    })

    it('should keep the table open when already open', () => {
      component.isTableOpen = true
      component.onSearchInput()
      expect(component.isTableOpen).toBe(true)
    })
  })

  // ─── onUserToggled (add) ──────────────────────────────────────────────────

  describe('onUserToggled – adding a peer', () => {
    it('should add user to selectedPeersList and selectedPeerIds', () => {
      const u = makeUser('u1')
      component.onUserToggled(u)
      expect(component.selectedPeersList).toContain(u)
      expect(component.selectedPeerIds).toContain('u1')
    })

    it('should emit peersChanged with correct payload', () => {
      const emitSpy = jest.spyOn(component.peersChanged, 'emit')
      const u = makeUser('u1')
      component.onUserToggled(u)
      expect(emitSpy).toHaveBeenCalledWith({ peers: [u], isValid: false })
    })

    it('should mark isValid true when exactly minPeers (2) are selected', () => {
      const emitSpy = jest.spyOn(component.peersChanged, 'emit')
      component.onUserToggled(makeUser('u1'))
      component.onUserToggled(makeUser('u2'))
      const lastCall = emitSpy.mock.calls[emitSpy.mock.calls.length - 1][0]
      expect(lastCall.isValid).toBe(true)
    })

    it('should NOT add a peer beyond maxPeers (3)', () => {
      component.onUserToggled(makeUser('u1'))
      component.onUserToggled(makeUser('u2'))
      component.onUserToggled(makeUser('u3'))
      component.onUserToggled(makeUser('u4'))
      expect(component.selectedPeerIds.length).toBe(3)
    })

    it('should prefer user.id over user.userId', () => {
      const u = { id: 'id1', userId: 'uid1' }
      component.onUserToggled(u)
      expect(component.selectedPeerIds).toContain('id1')
    })
  })

  // ─── onUserToggled (remove) ───────────────────────────────────────────────

  describe('onUserToggled – removing a peer', () => {
    it('should remove user when already in list', () => {
      const u = makeUser('u1')
      component.onUserToggled(u)   // add
      component.onUserToggled(u)   // remove
      expect(component.selectedPeersList).not.toContain(u)
      expect(component.selectedPeerIds).not.toContain('u1')
    })

    it('should emit after removal', () => {
      const u = makeUser('u1')
      component.onUserToggled(u)
      const emitSpy = jest.spyOn(component.peersChanged, 'emit')
      component.onUserToggled(u)
      expect(emitSpy).toHaveBeenCalledWith({ peers: [], isValid: false })
    })
  })

  // ─── removePeer ───────────────────────────────────────────────────────────

  describe('removePeer', () => {
    it('should remove peer by id and emit', () => {
      const u = makeUser('u1')
      component.selectedPeersList = [u]
      component.selectedPeerIds = ['u1']
      const emitSpy = jest.spyOn(component.peersChanged, 'emit')
      component.removePeer(u)
      expect(component.selectedPeersList).toEqual([])
      expect(component.selectedPeerIds).toEqual([])
      expect(emitSpy).toHaveBeenCalledWith({ peers: [], isValid: false })
    })

    it('should use userId fallback when id is absent', () => {
      const u = { userId: 'uid1', firstName: 'X', lastName: 'Y' }
      component.selectedPeersList = [u]
      component.selectedPeerIds = ['uid1']
      component.removePeer(u)
      expect(component.selectedPeerIds).toEqual([])
    })
  })

  // ─── isValid getter ───────────────────────────────────────────────────────

  describe('isValid', () => {
    it('should be false with 0 peers', () => {
      expect(component.isValid).toBe(false)
    })

    it('should be false with 1 peer', () => {
      component.onUserToggled(makeUser('u1'))
      expect(component.isValid).toBe(false)
    })

    it('should be true with 2 peers', () => {
      component.onUserToggled(makeUser('u1'))
      component.onUserToggled(makeUser('u2'))
      expect(component.isValid).toBe(true)
    })

    it('should be true with 3 peers (maxPeers)', () => {
      component.onUserToggled(makeUser('u1'))
      component.onUserToggled(makeUser('u2'))
      component.onUserToggled(makeUser('u3'))
      expect(component.isValid).toBe(true)
    })
  })

  // ─── getUserFullName ──────────────────────────────────────────────────────

  describe('getUserFullName', () => {
    it('should combine firstName and lastName', () => {
      expect(component.getUserFullName({ firstName: 'Alice', lastName: 'Smith' })).toBe('Alice Smith')
    })

    it('should fall back to name when firstName/lastName are absent', () => {
      expect(component.getUserFullName({ name: 'Bob Jones' })).toBe('Bob Jones')
    })

    it('should return "Unknown" when all name fields are absent', () => {
      expect(component.getUserFullName({})).toBe('Unknown')
    })

    it('should trim trailing space when lastName is absent', () => {
      expect(component.getUserFullName({ firstName: 'Alice' })).toBe('Alice')
    })
  })

  // ─── getUserInitials ──────────────────────────────────────────────────────

  describe('getUserInitials', () => {
    it('should combine first chars of firstName and lastName', () => {
      expect(component.getUserInitials({ firstName: 'Alice', lastName: 'Smith' })).toBe('AS')
    })

    it('should return first 2 chars of firstName when lastName is absent', () => {
      expect(component.getUserInitials({ firstName: 'Alice' })).toBe('AL')
    })

    it('should derive initials from name when firstName/lastName absent', () => {
      expect(component.getUserInitials({ name: 'Bob Jones' })).toBe('BJ')
    })

    it('should return first 2 chars of single-word name', () => {
      expect(component.getUserInitials({ name: 'Zara' })).toBe('ZA')
    })

    it('should return "U" when no name fields are present', () => {
      expect(component.getUserInitials({})).toBe('U')
    })
  })
})
