import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { Observable } from 'rxjs'
import { NSPeerValidation } from '../../../../models/peer-validation.model'
import { PeerValidationService } from '../../../../services/peer-validation.service'

@Component({
  selector: 'ws-app-peer-selection',
  templateUrl: './peer-selection.component.html',
  styleUrls: ['./peer-selection.component.scss'],
})
export class PeerSelectionComponent implements OnInit {
  @Input() selectedPeers: any
  @Output() peersChanged = new EventEmitter<any>()

  reportingOfficerControl = new FormControl()
  peerControl = new FormControl()
  subordinateControl = new FormControl()

  reportingOfficerOptions!: Observable<NSPeerValidation.IPeerInfo[]>
  peerOptions!: Observable<NSPeerValidation.IPeerInfo[]>
  subordinateOptions!: Observable<NSPeerValidation.IPeerInfo[]>

  constructor(
    private peerValidationService: PeerValidationService,
  ) { }

  // Visibility flags for search tables
  showReportingOfficerSearch = false
  showPeerSearch = false
  showSubordinateSearch = false

  ngOnInit() {
    // Load all peers initially
    this.reportingOfficerOptions = this.peerValidationService.searchPeers('')
    this.peerOptions = this.peerValidationService.searchPeers('')
    this.subordinateOptions = this.peerValidationService.searchPeers('')

    // Listen to changes
    this.reportingOfficerControl.valueChanges.subscribe(value => {
      this.selectedPeers.reportingOfficer = value
      this.peersChanged.emit(this.selectedPeers)
    })

    this.peerControl.valueChanges.subscribe(value => {
      this.selectedPeers.peer = value
      this.peersChanged.emit(this.selectedPeers)
    })

    this.subordinateControl.valueChanges.subscribe(value => {
      this.selectedPeers.subordinate = value
      this.peersChanged.emit(this.selectedPeers)
    })
  }

  toggleSearch(roleType: 'reportingOfficer' | 'peer' | 'subordinate') {
    if (roleType === 'reportingOfficer') {
      this.showReportingOfficerSearch = !this.showReportingOfficerSearch
      // Close others
      if (this.showReportingOfficerSearch) {
        this.showPeerSearch = false
        this.showSubordinateSearch = false
      }
    } else if (roleType === 'peer') {
      this.showPeerSearch = !this.showPeerSearch
      if (this.showPeerSearch) {
        this.showReportingOfficerSearch = false
        this.showSubordinateSearch = false
      }
    } else {
      this.showSubordinateSearch = !this.showSubordinateSearch
      if (this.showSubordinateSearch) {
        this.showReportingOfficerSearch = false
        this.showPeerSearch = false
      }
    }
  }

  onUserSelected(user: any, roleType: 'reportingOfficer' | 'peer' | 'subordinate') {
    this.selectUserForRole(user, roleType)
    // Hide the table after selection
    if (roleType === 'reportingOfficer') this.showReportingOfficerSearch = false
    if (roleType === 'peer') this.showPeerSearch = false
    if (roleType === 'subordinate') this.showSubordinateSearch = false
  }

  private selectUserForRole(user: any, roleType: 'reportingOfficer' | 'peer' | 'subordinate') {
    if (roleType === 'reportingOfficer') {
      this.reportingOfficerControl.setValue(user)
    } else if (roleType === 'peer') {
      this.peerControl.setValue(user)
    } else {
      this.subordinateControl.setValue(user)
    }
  }

  getExcludedIds(currentRole: 'reportingOfficer' | 'peer' | 'subordinate'): string[] {
    const ids: string[] = []

    // Add other selected users to exclusion list
    if (currentRole !== 'reportingOfficer') {
      const ro = this.reportingOfficerControl.value
      if (ro && (ro.id || ro.userId)) ids.push(ro.id || ro.userId)
    }

    if (currentRole !== 'peer') {
      const peer = this.peerControl.value
      if (peer && (peer.id || peer.userId)) ids.push(peer.id || peer.userId)
    }

    if (currentRole !== 'subordinate') {
      const sub = this.subordinateControl.value
      if (sub && (sub.id || sub.userId)) ids.push(sub.id || sub.userId)
    }

    return ids
  }

  getDisplayName(user: any): string {
    if (!user) return ''
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }
    return user.name || ''
  }

  comparePeers(o1: any, o2: any): boolean {
    return (o1 && o2) ? (o1.id === o2.id || o1.userId === o2.userId) : o1 === o2
  }
}
