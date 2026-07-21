import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { NsCarouselBannerV2, SbUicCarouselBannerV2Component } from '@sunbird-cb/consumption'

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
export class HomeCarouselBannerV2Component implements OnInit {
  banners: NsCarouselBannerV2.IBannerItem[] = []

  constructor(private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.loadSliderData()
  }

  private loadSliderData(): void {
    try {
      const sliderData: ISliderDataItem[] = this.activatedRoute.snapshot.data.pageData?.data?.sliderData || []

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
