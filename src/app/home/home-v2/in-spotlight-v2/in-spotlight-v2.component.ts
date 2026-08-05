import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { SbUicSpotlightCardsV2Component } from '@sunbird-cb/consumption'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import _ from 'lodash'
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
  private readonly configSvc = inject(ConfigurationsService)
  private readonly destroy$ = new Subject<void>()

  ngOnInit() {
    this.translate.stream([
      'home.inSpotlight',
      'home.spotlightCards.iGOTMarketplace',
      'home.spotlightCards.iGOTSpecialisations',
      'home.spotlightCards.mdoChannel',
      'home.spotlightCards.amritGyaanKosh',
      'home.spotlightCards.bharatKalp',
    ]).pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.spotlightCards = [
        // Bharat Kalp: only show the card when the user is a BharatKalp member
        ...(this.isBharatKalpMember()
          ? [{ iconUrl: '/assets/icons/home-v2/bharat-kalp.png', label: t['home.spotlightCards.bharatKalp'], redirectionUrl: 'app/learn/bharat-kalp' }]
          : []),
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

  private isBharatKalpMember(): boolean {
    const val = _.get(
      this.configSvc,
      'unMappedUser.profileDetails.additionalProperties.isBharatKalpMember'
    )
    return val === true || val === 'true'
  }
}
