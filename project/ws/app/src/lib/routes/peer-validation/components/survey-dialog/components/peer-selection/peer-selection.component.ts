import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'

const MIN_PEERS = 2
const MAX_PEERS = 3

@Component({
  selector: 'ws-app-peer-selection',
  templateUrl: './peer-selection.component.html',
  styleUrls: ['./peer-selection.component.scss'],
})
export class PeerSelectionComponent implements OnInit {
  @Input() selectedPeers: any
  @Output() peersChanged = new EventEmitter<any>()

  selectedPeersList: any[] = []   // Full user objects for selected peers
  selectedPeerIds: string[] = []  // IDs only – passed to the table
  searchQuery = ''
  isTableOpen = false

  readonly minPeers = MIN_PEERS
  readonly maxPeers = MAX_PEERS

  ngOnInit() {
    // Restore from parent-input if available
    if (this.selectedPeers && Array.isArray(this.selectedPeers.peers)) {
      this.selectedPeersList = [...this.selectedPeers.peers]
      this.selectedPeerIds = this.selectedPeersList.map((u: any) => u.id || u.userId)
    }
  }

  toggleTable() {
    this.isTableOpen = !this.isTableOpen
  }

  onSearchInput() {
    if (!this.isTableOpen) {
      this.isTableOpen = true
    }
  }

  onUserToggled(user: any) {
    const userId = user.id || user.userId
    const idx = this.selectedPeerIds.indexOf(userId)

    if (idx > -1) {
      // Remove
      this.selectedPeerIds = this.selectedPeerIds.filter(id => id !== userId)
      this.selectedPeersList = this.selectedPeersList.filter(
        (u: any) => (u.id || u.userId) !== userId
      )
    } else {
      // Add (guard max)
      if (this.selectedPeerIds.length >= this.maxPeers) return
      this.selectedPeerIds = [...this.selectedPeerIds, userId]
      this.selectedPeersList = [...this.selectedPeersList, user]
    }

    this.emitChange()
  }

  removePeer(peer: any) {
    const userId = peer.id || peer.userId
    this.selectedPeerIds = this.selectedPeerIds.filter(id => id !== userId)
    this.selectedPeersList = this.selectedPeersList.filter(
      (u: any) => (u.id || u.userId) !== userId
    )
    this.emitChange()
  }

  get isValid(): boolean {
    return this.selectedPeersList.length >= this.minPeers &&
      this.selectedPeersList.length <= this.maxPeers
  }

  private emitChange() {
    this.peersChanged.emit({
      peers: this.selectedPeersList,
      isValid: this.isValid,
    })
  }

  // Helpers used in template
  getUserFullName(user: any): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown'
  }

  getUserInitials(user: any): string {
    const first = user.firstName || ''
    const last = user.lastName || ''
    if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    if (first) return first.substring(0, 2).toUpperCase()
    if (user.name) {
      const parts = user.name.split(' ')
      return parts.length > 1
        ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
        : user.name.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  getUserDesignation(user: any): string {
    return user.profileDetails?.professionalDetails?.[0]?.designation || '--'
  }
}
