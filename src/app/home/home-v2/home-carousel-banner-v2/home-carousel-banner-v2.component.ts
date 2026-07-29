import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { NsCarouselBannerV2, SbUicCarouselBannerV2Component } from '@sunbird-cb/consumption'
import { ValueService } from '@sunbird-cb/utils-v2'
import { Subscription } from 'rxjs'

const PEEK_PERCENT_DESKTOP = 25
const PEEK_PERCENT_MOBILE = 0

interface ISliderDataItem {
  active: boolean
  banners: {
    l: string
    m: string
    s: string
    xl: string
    xs: string
    xxl: string
  }
  redirectUrl: string
  openInNewTab?: boolean
  queryParams?: Record<string, any>
  title: string
}

@Component({
  selector: 'ws-home-carousel-banner-v2',
  templateUrl: './home-carousel-banner-v2.component.html',
  styleUrls: ['./home-carousel-banner-v2.component.scss'],
  standalone: true,
  imports: [SbUicCarouselBannerV2Component],
})
export class HomeCarouselBannerV2Component implements OnInit, OnDestroy {
  banners: NsCarouselBannerV2.IBannerItem[] = []
  // No peek on mobile - the next banner's sliver crowds an already narrow viewport
  peekPercent = PEEK_PERCENT_DESKTOP
  private screenSizeSubscription?: Subscription

  constructor(
    private activatedRoute: ActivatedRoute,
    private valueSvc: ValueService,
  ) { }

  ngOnInit(): void {
    this.loadSliderData()
    this.screenSizeSubscription = this.valueSvc.isXSmall$.subscribe((isXSmall: boolean) => {
      this.peekPercent = isXSmall ? PEEK_PERCENT_MOBILE : PEEK_PERCENT_DESKTOP
    })
  }

  ngOnDestroy(): void {
    this.screenSizeSubscription?.unsubscribe()
  }

  private loadSliderData(): void {
    try {
      const sliderData: ISliderDataItem[] = this.activatedRoute.snapshot.data?.home?.data?.sliderData || []

      if (Array.isArray(sliderData) && sliderData.length > 0) {
        this.banners = sliderData
          .filter((item: ISliderDataItem) => item.active)
          .map((item: ISliderDataItem) => this.transformBannerData(item))
      }
    } catch (error) {
      console.error('Error loading slider data:', error)
      this.banners = []
    }
  }

  private transformBannerData(item: ISliderDataItem): NsCarouselBannerV2.IBannerItem {
    let redirectionUrl = item.redirectUrl || ''

    // Build URL with query params if they exist
    // if (item.queryParams && Object.keys(item.queryParams).length > 0) {
    //   const queryString = new URLSearchParams(item.queryParams).toString()
    //   redirectionUrl = redirectionUrl
    //   + (redirectionUrl.includes('?') ? '&' : '?') + queryString
    // }

    return {
      bannerUrl: item.banners.l || item.banners.xl,
      redirectionUrl: redirectionUrl,
      altText: item.title || '',
      title: item.title || '',
      subtitle: '',
      ctaLabel: '',
    }
  }
}
