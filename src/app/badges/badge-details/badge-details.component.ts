import { Component, HostListener } from '@angular/core'
import * as _ from 'lodash'
import { BadgeService } from '../../services/badge.service'
import { Router } from '@angular/router'
import jsPDF from 'jspdf'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
@Component({
  selector: 'app-badge-details',
  templateUrl: './badge-details.component.html',
  styleUrls: ['./badge-details.component.scss'],
})
export class BadgeDetailsComponent {
  constructor(private userProfileService: BadgeService, private router: Router, private badgeService: BadgeService, private configSvc: ConfigurationsService) {
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
  isTruncated(element: HTMLElement): boolean {
    return element.scrollWidth > element.clientWidth
  }
  getBadgeDetails(status: string = 'Completed'): void {

    const payload = {
      request: {
        status: status
      }
    }

    this.userProfileService.fetchBadgeDetails(payload).subscribe(
      (res: any) => {
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
              courseId: badge?.courseId,
              badgeId: detail?.badgeId
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
    this.selectedBadge = badge
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
  downloadBadgePng(badgeData: any) {
    const payload = {
      request: {
        userId: this.configSvc?.userProfile?.userId,
        courseId: badgeData.courseId,
        badgeId: badgeData.badgeId,
      },
    }
    this.badgeService.generateBadge(payload).subscribe((res: any) => {
      const dataUrl = res?.result?.printUri

      const img = new Image()
      img.src = dataUrl

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)

          const png = canvas.toDataURL('image/png')

          const a = document.createElement('a')
          a.href = png
          a.download = 'badge.png'
          a.click()
        }
      }
    })
  }

  downloadBadgeSvg(badgeData: any) {
    const payload = {
      request: {
        userId: this.configSvc?.userProfile?.userId,
        courseId: badgeData.courseId,
        badgeId: badgeData.badgeId,
      },
    }
    this.badgeService.generateBadge(payload).subscribe({
      next: (res: any) => {
        const dataUrl = res?.result?.printUri

        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'badge.svg'

        document.body.appendChild(a)
        a.click()
        a.remove()
      },
      error: (err) => {
        console.error('Download failed', err)
      },
    })
  }
  downloadBadgePdf(badgeData: any) {
    const payload = {
      request: {
        userId: this.configSvc?.userProfile?.userId,
        courseId: badgeData.courseId,
        badgeId: badgeData.badgeId,
      },
    }
    this.badgeService.generateBadge(payload).subscribe((res: any) => {
      const dataUrl = res?.result?.printUri

      const img = new Image()
      img.src = dataUrl

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width || 1920
        canvas.height = img.height || 1080

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)

          const imgData = canvas.toDataURL('image/png')

          const pdf = new jsPDF('landscape', 'px', 'a4')
          const w = pdf.internal.pageSize.getWidth()
          const h = pdf.internal.pageSize.getHeight()

          pdf.addImage(imgData, 'PNG', 0, 0, w, h)
          pdf.save('badge.pdf')
        }
      }
    })
  }
}