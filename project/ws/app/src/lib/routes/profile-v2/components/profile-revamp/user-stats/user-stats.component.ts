import { Component, Input, OnInit } from '@angular/core'
import { UserStats } from '../../../models/profile-revamp.model'
import { Router } from '@angular/router'
import { EventService, TelemetryService, UtilityService, WsEvents } from '@sunbird-cb/utils-v2'

const WALLET_BALANCE_IDENTIFIER = 'walletBalance'

@Component({
  selector: 'ws-app-user-stats',
  templateUrl: './user-stats.component.html',
  styleUrls: ['./user-stats.component.scss'],
  standalone: false
})
export class UserStatsComponent implements OnInit {

  //#region (global variables)
  @Input() userStats: UserStats[] = []
  @Input() isMobile = false
  @Input() isNotMyUserAndIgotOrg = false
  //#endregion

  constructor(
    private router: Router,
    private eventService: EventService,
    private utilitySvc: UtilityService,
    private telemetrySvc: TelemetryService
  ) { }

  ngOnInit() {
  }

  viewAll(state: UserStats) {
    if (state.identifier === WALLET_BALANCE_IDENTIFIER) {
      this.utilitySvc.setRouteData([{ module: 'Profile', pageId: 'app/person-profile/me' }])
      this.telemetrySvc.sendEmptyObjectForNextInteract()
      this.eventService.raiseInteractTelemetry(
        {
          type: WsEvents.EnumInteractTypes.CLICK,
          subType: WsEvents.EnumInteractSubTypes.PROFILE,
          id: 'wallet-balance',
        },
        {},
        {
          pageId: 'app/person-profile/me',
          module: 'Profile'
        }
      )
    }
    if (state.vewAllUrl) {
      this.router.navigateByUrl(state.vewAllUrl)
    }
  }

}
