import { Component, Input, Output, EventEmitter, OnInit, Inject, Optional, OnChanges, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { PeerValidationService } from '../../../../services/peer-validation.service'

@Component({
  selector: 'ws-app-user-search-table',
  templateUrl: './user-search-table.component.html',
  styleUrls: ['./user-search-table.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatButtonModule, MatCheckboxModule],
})
export class UserSearchTableComponent implements OnInit, OnChanges {
  @Input() users: any[] = []
  @Input() selectedUserIds: string[] = []   // Array of selected IDs (multi-select)
  @Input() maxSelect = 3
  @Input() searchQuery = ''                 // Driven by parent search input
  @Output() userToggled = new EventEmitter<any>()   // Emits user object when toggled

  filteredUsers: any[] = []

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private peerValidationService: PeerValidationService
  ) {
    if (data) {
      this.selectedUserIds = data.selectedUserIds || []
    }
  }

  ngOnInit() {
    this.getAllUsers()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedUserIds'] || changes['searchQuery']) {
      this.filterUsers()
    }
  }

  getAllUsers() {
    this.peerValidationService.getAllUsers().subscribe({
      next: (res: any) => {
        this.users = res?.result?.response?.content || res?.result?.content || res || []
        this.filterUsers()
      },
      error: (err: any) => {
        console.error('Error fetching users:', err)
        this.users = []
        this.filteredUsers = []
      },
    })
  }

  filterUsers() {
    const query = this.searchQuery.toLowerCase().trim()
    this.filteredUsers = this.users.filter(user => {
      const name = this.getUserFullName(user).toLowerCase()
      const email = (
        user.profileDetails?.personalDetails?.primaryEmail ||
        user.email || ''
      ).toLowerCase()
      return name.includes(query) || email.includes(query)
    })
  }

  toggleUser(user: any, event?: Event) {
    if (event) {
      event.stopPropagation()
    }
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

  isDisabled(user: any): boolean {
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
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase()
    } else if (user.name) {
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
