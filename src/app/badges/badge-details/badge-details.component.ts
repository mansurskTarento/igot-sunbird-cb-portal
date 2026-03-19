import { Component, HostListener } from '@angular/core'
import * as _ from 'lodash'
import { BadgeService } from '../../services/badge.service'
import { Router } from '@angular/router'
@Component({
  selector: 'app-badge-details',
  templateUrl: './badge-details.component.html',
  styleUrls: ['./badge-details.component.scss'],
})
export class BadgeDetailsComponent {
  constructor(private userProfileService: BadgeService, private router: Router) {
  }
  activeTab: 'earned' | 'inprogress' = 'earned'
  @HostListener('document:click')
  selectedBadge: any
  showTab(tab: 'earned' | 'inprogress') {
    this.activeTab = tab

    const status = tab === 'earned' ? 'Completed' : 'In-Progress'
    this.getBadgeDetails(status)
  }
  badgeDetails: any = []
  ngOnInit(): void {
    this.getBadgeDetails('Completed')
  }

  getBadgeDetails(status: string = 'Completed'): void {

    const payload = {
      request: {
        status: status
      }
    }

    this.userProfileService.fetchBadgeDetails(payload).subscribe(
      (res: any) => {
        console.log('badgeDetails', res?.result)
        this.badgeDetails = res?.result || {}
        this.data.stats[0].value = this.badgeDetails?.summary?.totalBadgesEarned
        this.data.stats[1].value = this.badgeDetails?.summary?.courseCompleted
        this.data.stats[2].value = this.badgeDetails?.summary?.completionRate
        if (status === 'Completed') {

          const badges = res?.result?.earnedBadgesDetails?.badges || []

          this.data.earnedBadges = badges.flatMap((badge: any) =>
            (badge.badgeDetails_v1 || []).map((detail: any) => ({
              image: detail.badgeTemplate,
              courseName: `${badge.courseName}`,
              glow: 'glow-orange',
              title: detail.badgeTitle,
              level: detail.badgeSubTitle,
            }))
          )

        } else {

          const progressBadges = res?.result?.inProgressBadgesDetails?.badges || []

          this.data.inProgress = progressBadges.map((badge: any) => ({
            icon: badge?.badgeDetails_v1?.[0]?.badgeTemplate,
            badgeTitle: `${badge?.badgeDetails_v1?.[0]?.badgeTitle}`,
            courseName: `${badge.courseName}`,
            progress: badge.completionPercentage + '%',
            continue: badge.completionPercentage < 100 && badge.completionPercentage > 0,
            courseId: badge?.courseId
          }))

        }

      },
      (error) => {
        console.log('Badge API Error', error)
      }
    )

  }
  goToContent = (badge: any) => {
    const id = badge?.courseId

    if (!id) return

    if (id.startsWith('do_')) {
      this.router.navigate(['/app/toc', id, 'overview'])
    } else if (id.startsWith('ext_')) {
      this.router.navigateByUrl(`/app/toc/ext/${id}`)
    }
  }
  showModal = false

  openModal(badge: any) {
    console.log('badge', badge)
    this.selectedBadge = {
      title: 'Beginner',
      image: 'assets/icons/badges/BronzeBadge.svg',
      level: ''
    }
    this.showModal = true
  }

  closeModal() {
    this.showModal = false
  }
  breadcrumbData = {
    url: 'home',
    titles: [
      { title: 'sdadsad', url: '/app/person-profile', icon: 'person', noTranslate: true },
      { title: 'My Badges', url: 'none', icon: '', noTranslate: true }
    ]
  }
  openMenuBadge: any = null

  toggleMenu(badge: any, event: Event) {
    event.stopPropagation()
    this.openMenuBadge = this.openMenuBadge === badge ? null : badge
  }

  viewBadge(badge: any) {
    console.log('View', badge)
    this.openMenuBadge = null
  }

  downloadBadge(badge: any) {
    console.log('Download', badge)
    this.openMenuBadge = null
  }

  closeMenu() {
    this.openMenuBadge = null
  }
  data = {
    stats: [
      {
        label: 'Total Badges Earned',
        icon: 'assets/icons/badges/badge.svg',
        iconClass: 'orange',
        value: this.badgeDetails?.summary?.totalBadgesEarned,
      },
      {
        label: 'Content Completed',
        icon: 'assets/icons/badges/course.svg',
        iconClass: 'blue',
        value: this.badgeDetails?.summary?.courseCompleted,
      },
      {
        label: 'Badge Completion Rate',
        icon: 'assets/icons/badges/line_chart.svg',
        iconClass: 'yellow',
        value: `${this.badgeDetails?.summary?.completionRate}%`,
      },
    ],

    earnedBadges: [],

    inProgress: []
  }
}