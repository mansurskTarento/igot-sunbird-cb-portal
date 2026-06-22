import { Component } from '@angular/core'
import { NsCarouselBannerV2, SbUicCarouselBannerV2Component } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-home-carousel-banner-v2',
  templateUrl: './home-carousel-banner-v2.component.html',
  styleUrls: ['./home-carousel-banner-v2.component.scss'],
  standalone: true,
  imports: [SbUicCarouselBannerV2Component],
})
export class HomeCarouselBannerV2Component {
  // @Input() banners: NsCarouselBannerV2.IBannerItem[] = []

  banners: NsCarouselBannerV2.IBannerItem[] = [
    {
      bannerUrl: 'https://picsum.photos/seed/cb1/1200/480',
      redirectionUrl: '',
      altText: 'Empower yourself with Knowledge',
      title: 'Empower Yourself with Knowledge, Skills, and Competencies',
      subtitle: 'All in One Place.',
      ctaLabel: 'Discover All',
    },
    {
      bannerUrl: 'https://picsum.photos/seed/cb2/1200/480',
      redirectionUrl: '',
      altText: 'Explore Programs',
      title: 'Explore Learning Programs',
      subtitle: 'Curated pathways for every role and skill level.',
      ctaLabel: 'Browse Programs',
    },
    {
      bannerUrl: 'https://picsum.photos/seed/cb2/1200/480',
      redirectionUrl: '',
      altText: 'Explore Programs',
      title: 'Explore Learning Programs',
      subtitle: 'Curated pathways for every role and skill level.',
      ctaLabel: 'Browse Programs',
    }
  ]
}
