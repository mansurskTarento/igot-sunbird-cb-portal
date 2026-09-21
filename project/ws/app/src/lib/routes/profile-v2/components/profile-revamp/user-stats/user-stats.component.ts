import { Component, Input, OnInit } from '@angular/core'
import { UserStats } from '../../../models/profile-revamp.model'
import { Router } from '@angular/router'
import { EventService, WsEvents } from '@sunbird-cb/utils-v2'

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
    private eventService: EventService
  ) { }

  ngOnInit() {
  }

  viewAll(state: UserStats) {
    if (state.identifier === WALLET_BALANCE_IDENTIFIER) {
      this.eventService.raiseInteractTelemetry(
        {
          type: WsEvents.EnumInteractTypes.CLICK,
          subType: WsEvents.EnumInteractSubTypes.PROFILE,
          id: 'wallet-balance',
        },
        {},
        {
          pageId: 'app/person-profile/me',
        }
      )
    }
    if (state.vewAllUrl) {
      this.router.navigateByUrl(state.vewAllUrl)
    }
  }

}
