import { Component, Input, Output, EventEmitter, OnInit, Inject, Optional } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { PeerValidationService } from '../../../../services/peer-validation.service'

@Component({
  selector: 'ws-app-user-search-table',
  templateUrl: './user-search-table.component.html',
  styleUrls: ['./user-search-table.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatButtonModule],
})
export class UserSearchTableComponent implements OnInit {
  @Input() users: any[] = []
  @Input() selectedUserId: string | null = null
  @Input() excludedIds: string[] = [] // New Input
  @Output() userSelected = new EventEmitter<any>()

  filteredUsers: any[] = []
  searchQuery = ''

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private peerValidationService: PeerValidationService
  ) {
    // If opened as dialog, use data from MAT_DIALOG_DATA
    if (data) {
      this.selectedUserId = data.selectedUserId || null
    }
  }

  ngOnInit() {
    // Fetch users when component initializes
    this.getAllUsers()
  }

  getAllUsers() {
    this.peerValidationService.getAllUsers().subscribe({
      next: (res: any) => {
        this.users = res?.result?.response?.content || res?.result?.content || res || []
        this.filterUsers() // Apply filters initially
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
      // Exclude if in excludedIds list
      const userId = user.id || user.userId
      if (this.excludedIds.includes(userId)) {
        return false
      }

      // Filter by name
      return this.getUserFullName(user).toLowerCase().includes(query)
    })
  }

  // Also update ngOnInit/getAllUsers to initial filter
  updateFilteredUsers() {
    this.filterUsers()
  }

  selectUser(user: any) {
    this.userSelected.emit(user)
  }

  isSelected(user: any): boolean {
    return (user.id || user.userId) === this.selectedUserId
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
}
