import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { SbUicSpotlightCardsV2Component } from '@sunbird-cb/consumption'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'ws-in-spotlight-v2',
  templateUrl: './in-spotlight-v2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, SbUicSpotlightCardsV2Component],
})
export class InSpotlightV2Component implements OnInit, OnDestroy {

  spotlightCards: { iconUrl: string; label: string; redirectionUrl: string }[] = []

  private readonly translate = inject(TranslateService)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly destroy$ = new Subject<void>()

  ngOnInit() {
    this.translate.stream([
      'home.inSpotlight',
      'home.spotlightCards.iGOTMarketplace',
      'home.spotlightCards.iGOTSpecialisations',
      'home.spotlightCards.mdoChannel',
      'home.spotlightCards.amritGyaanKosh',
    ]).pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.spotlightCards = [
        { iconUrl: '/assets/icons/home-v2/shopping-bag.svg', label: t['home.spotlightCards.iGOTMarketplace'], redirectionUrl: '/app/seeAll?key=karmaTracks&tabSelected=Providers' },
        { iconUrl: '/assets/icons/home-v2/books.svg', label: t['home.spotlightCards.iGOTSpecialisations'], redirectionUrl: '/app/seeAll/new?key=forYou&tabSelected=igotSpecializations&pillSelected=programs' },
        { iconUrl: '/assets/icons/home-v2/Frame.svg', label: t['home.spotlightCards.mdoChannel'], redirectionUrl: '/app/learn/mdo-channels/all-channels' },
        { iconUrl: '/assets/icons/home-v2/Group.svg', label: t['home.spotlightCards.amritGyaanKosh'], redirectionUrl: 'app/amrit-gyaan-kosh/all' },
      ]
      this.cdr.markForCheck()
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
