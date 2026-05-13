import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Inject, Optional, OnChanges, SimpleChanges } from '@angular/core'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'
import { PeerValidationService } from '../../../../services/peer-validation.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
    selector: 'ws-app-user-search-table',
    templateUrl: './user-search-table.component.html',
    styleUrls: ['./user-search-table.component.scss'],
    standalone: false
})
export class UserSearchTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedUserIds: string[] = []   // Array of selected IDs (multi-select)
  @Input() maxSelect = 3
  @Input() searchQuery = ''                 // Driven by parent search input
  @Output() userToggled = new EventEmitter<any>()   // Emits user object when toggled

  filteredUsers: any[] = []
  currentUserId: string = ''

  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private peerValidationService: PeerValidationService,
    private configSvc: ConfigurationsService
  ) {
    this.currentUserId = this.configSvc.userProfile?.userId || ''
    if (data) {
      this.selectedUserIds = data.selectedUserIds || []
    }
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => this.fetchUsers(query))

    this.fetchUsers('')
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery'] && !changes['searchQuery'].firstChange) {
      this.searchSubject.next(this.searchQuery)
    }
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  fetchUsers(query: string) {
    this.peerValidationService.getAllUsers(query).subscribe({
      next: (res: any) => {
        this.filteredUsers = res?.result?.response?.content || res?.result?.content || res || []
      },
      error: (err: any) => {
        console.error('Error fetching users:', err)
        this.filteredUsers = []
      },
    })
  }

  toggleUser(user: any, event?: Event) {
    if (event) {
      event.stopPropagation()
    }
    if (this.isCurrentUser(user)) return
    const userId = user.id || user.userId
    const alreadySelected = this.selectedUserIds.includes(userId)
    if (!alreadySelected && this.selectedUserIds.length >= this.maxSelect) {
      // At max — do not allow more
      return
    }
    this.userToggled.emit(user)
  }

  isSelected(user: any): boolean {
    return this.selectedUserIds.includes(user.id || user.userId)
  }

  isCurrentUser(user: any): boolean {
    const userId = user.id || user.userId
    return userId === this.currentUserId
  }

  isDisabled(user: any): boolean {
    if (this.isCurrentUser(user)) return true
    const userId = user.id || user.userId
    return !this.selectedUserIds.includes(userId) && this.selectedUserIds.length >= this.maxSelect
  }

  getUserFullName(user: any): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown'
  }

  getUserInitials(user: any): string {
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }  if (firstName) {
      return firstName.substring(0, 2).toUpperCase()
    }  if (user.name) {
      const parts = user.name.split(' ')
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      }
      return user.name.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  getUserDesignation(user: any): string {
    return user.profileDetails?.professionalDetails?.[0]?.designation || '--'
  }
}
