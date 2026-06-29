import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'

interface SeeAllCard {
  name: string
  identifier?: string
  posterImage?: string
  duration?: string
  category?: string
  org?: string
  orgLogo?: string
  rating?: string
  type?: string
}

const ALL_WEEKS = 0

@Component({
  selector: 'ws-app-bharat-kalp-see-all',
  templateUrl: './bharat-kalp-see-all.component.html',
  styleUrls: ['./bharat-kalp-see-all.component.scss'],
  standalone: false,
})
export class BharatKalpSeeAllComponent implements OnInit {
  readonly ALL_WEEKS = ALL_WEEKS

  weeks: number[] = []
  currentWeek = 1
  selectedWeek: number = ALL_WEEKS
  private _prevWeek: number = ALL_WEEKS

  selectedTab = 'All Content'
  searchText = ''
  itemsPerPage = 10
  currentPage = 0
  readonly itemsPerPageOptions = [10, 20, 50, 100]
  readonly pills = ['All Content', 'Courses', 'Programs', 'Events', 'Assessment']

  allCards: SeeAllCard[] = []
  weekProgress: any = null
  bkConfig: any = {}

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const formData = this.route.snapshot.data?.['formData']?.data?.result?.form?.data
    if (formData) {
      this.weekProgress = formData.individualSection?.weekProgress
      this.bkConfig = formData.bkConfig || {}
    }

    const totalWeeks = this.weekProgress?.totalWeeks || 16
    this.weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)
    this.currentWeek = this._computeCurrentWeek()

    const qWeek = this.route.snapshot.queryParams?.['week']
    // Default to current week if navigated from "Show all", else All Weeks
    this.selectedWeek = qWeek ? +qWeek : ALL_WEEKS
    this._prevWeek = this.selectedWeek

    this._buildCards()
  }

  private _computeCurrentWeek(): number {
    const startDate = this.bkConfig?.startDate
    if (!startDate) return 1
    const start = new Date(startDate)
    const now = new Date()
    if (now < start) return 1
    const diff = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
    return Math.min(Math.floor(diff / 7) + 1, this.weeks.length)
  }

  isWeekStarted(week: number): boolean {
    return week <= this.currentWeek
  }

  _buildCards(): void {
    const strips: any[] = this.weekProgress?.contentStrips || []
    this.allCards = []

    if (this.selectedWeek === ALL_WEEKS) {
      // Aggregate cards from ALL strips / ALL tabs
      strips.forEach((strip: any) => {
        ;(strip.tabs || []).forEach((tab: any) => {
          ;(tab.cards || []).forEach((card: any) => {
            this.allCards.push({ ...card, type: tab.label })
          })
        })
      })
    } else {
      // Exact match only — no fallback so the filter visibly applies
      const strip = strips.find((s: any) => s.weekNumber === this.selectedWeek)
      if (strip) {
        ;(strip.tabs || []).forEach((tab: any) => {
          ;(tab.cards || []).forEach((card: any) => {
            this.allCards.push({ ...card, type: tab.label })
          })
        })
      }
    }
    this.currentPage = 0
  }

  onWeekChange(val: any): void {
    const week = +val

    if (week !== ALL_WEEKS && !this.isWeekStarted(week)) {
      // Revert to previous selection on next tick (after ngModel has settled)
      const prev = this._prevWeek
      setTimeout(() => { this.selectedWeek = prev }, 0)
      this.snackBar.open('This week has not started yet', 'Dismiss', {
        duration: 3000,
        panelClass: ['wp-snack'],
      })
      return
    }

    this._prevWeek = week
    this._buildCards()
  }

  onPillSelect(pill: string): void {
    this.selectedTab = pill
    this.currentPage = 0
  }

  onSearch(): void {
    this.currentPage = 0
  }

  onItemsPerPageChange(event: Event): void {
    this.itemsPerPage = +(event.target as HTMLSelectElement).value
    this.currentPage = 0
  }

  get filteredCards(): SeeAllCard[] {
    let cards = this.allCards
    if (this.selectedTab !== 'All Content') {
      cards = cards.filter(c => c.type === this.selectedTab)
    }
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase()
      cards = cards.filter(c => c.name?.toLowerCase().includes(q))
    }
    return cards
  }

  get pagedCards(): SeeAllCard[] {
    const start = this.currentPage * this.itemsPerPage
    return this.filteredCards.slice(start, start + this.itemsPerPage)
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCards.length / this.itemsPerPage) || 1
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages
    const cur = this.currentPage
    if (total <= 7) return Array.from({ length: total }, (_, i) => i)
    const pages: (number | string)[] = []
    pages.push(0)
    if (cur > 2) pages.push('...')
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i)
    if (cur < total - 3) pages.push('...')
    pages.push(total - 1)
    return pages
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number') this.currentPage = page
  }

  navigateToCard(card: SeeAllCard): void {
    if (card?.identifier) this.router.navigate(['/app/toc', card.identifier, 'overview'])
  }

  goHome(): void { this.router.navigate(['/page/home']) }
  goBharatKalp(): void { this.router.navigate(['/app/learn/kalp/bharat-kalp']) }
}
