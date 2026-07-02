import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-app-bharat-kalp',
  templateUrl: './bharat-kalp.component.html',
  styleUrls: ['./bharat-kalp.component.scss'],
  standalone: false,
})
export class BharatKalpPageComponent implements OnInit {
  sectionList: any[] = []
  bkConfig: any = {}
  individualSection: any = {}

  canCommPrev  = false
  canCommNext  = false
  commDotIndex = 0
  commDotCount = 0

  get communityDots(): number[] {
    return Array.from({ length: this.commDotCount }, (_, i) => i)
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public configService: ConfigurationsService,
  ) { }

  ngOnInit() {
    const formData = this.route.snapshot.data?.formData?.data?.result?.form?.data
    if (formData) {
      this.sectionList = formData.sectionList || []
      this.individualSection = formData.individualSection || {}
      this.bkConfig = formData.bkConfig || {}
    }
  }

  onCommunitiesLoaded(data: any[]): void {
    const count = (data || []).length
    this.canCommNext = count > 4
    this.commDotCount = Math.ceil(count / 4)
  }

  private _commScrollAmount(el: HTMLElement): number {
    return 4 * ((el.offsetWidth - 60) / 4 + 16)
  }

  commPrev(el: HTMLElement): void {
    el?.scrollBy({ left: -this._commScrollAmount(el), behavior: 'smooth' })
    this.commDotIndex = Math.max(0, this.commDotIndex - 1)
  }

  commNext(el: HTMLElement): void {
    el?.scrollBy({ left: this._commScrollAmount(el), behavior: 'smooth' })
    this.commDotIndex = Math.min(this.commDotCount - 1, this.commDotIndex + 1)
  }

  goToCommDot(index: number, el: HTMLElement): void {
    el?.scrollTo({ left: index * this._commScrollAmount(el), behavior: 'smooth' })
    this.commDotIndex = index
  }

  onCommScroll(el: HTMLElement): void {
    if (!el) return
    this.canCommPrev = el.scrollLeft > 0.5
    this.canCommNext = Math.ceil(el.scrollLeft) < el.scrollWidth - el.offsetWidth
    const pageWidth = this._commScrollAmount(el)
    if (pageWidth > 0) this.commDotIndex = Math.round(el.scrollLeft / pageWidth)
  }

  openCommunity(community: any): void {
    const communityId = community?.communityId || community?.identifier || community?.id
    if (communityId) {
      this.router.navigate(['/app/discussion-forum-v2/community', communityId])
    }
  }
}
