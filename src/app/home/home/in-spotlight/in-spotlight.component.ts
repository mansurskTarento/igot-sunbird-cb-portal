import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'ws-in-spotlight',
  templateUrl: './in-spotlight.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InSpotlightComponent implements OnInit, OnDestroy {

  spotlightCards: { iconUrl: string; label: string; redirectionUrl: string }[] = []

  private destroy$ = new Subject<void>()

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.translate.stream([
      'home.inSpotlight',
      'home.spotlightCards.iGOTMarketplace',
      'home.spotlightCards.iGOTSpecialisations',
      'home.spotlightCards.mdoChannel',
      'home.spotlightCards.amritGyaanKosh',
    ]).pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.spotlightCards = [
        { iconUrl: '/assets/icons/spotlight/shopping-bag.svg', label: t['home.spotlightCards.iGOTMarketplace'], redirectionUrl: '/app/seeAll?key=karmaTracks&tabSelected=Providers' },
        { iconUrl: '/assets/icons/spotlight/books.svg', label: t['home.spotlightCards.iGOTSpecialisations'], redirectionUrl: '/app/seeAll/new?key=forYou&tabSelected=igotSpecializations&pillSelected=programs' },
        { iconUrl: '/assets/icons/spotlight/Frame.svg', label: t['home.spotlightCards.mdoChannel'], redirectionUrl: '/app/learn/mdo-channels/all-channels' },
        { iconUrl: '/assets/icons/spotlight/Group.svg', label: t['home.spotlightCards.amritGyaanKosh'], redirectionUrl: 'app/amrit-gyaan-kosh/all' },
      ]
      this.cdr.markForCheck()
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
