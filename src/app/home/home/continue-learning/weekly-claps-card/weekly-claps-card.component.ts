import { Component, Input } from '@angular/core'
import { EventService, WsEvents } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-weekly-claps-card',
  templateUrl: './weekly-claps-card.component.html',
  styleUrls: ['./weekly-claps-card.component.scss'],
  standalone: false,
})
export class WeeklyClapsCardComponent {
  @Input() insightsData: any = null
  @Input() weeklyData: any = null
  @Input() isLoading = true
  showPopup = false

  constructor(private eventSvc: EventService) { }

  get weeklyClaps(): any {
    return this.insightsData && this.insightsData.weeklyClaps
  }

  get weekList(): { label: string; key: string; activeWeek: boolean }[] {
    return (this.weeklyData && this.weeklyData.weekList) || []
  }

  get totalClaps(): number {
    return (this.weeklyClaps && this.weeklyClaps.total_claps) || 0
  }

  isWeekDone(week: { key: string; activeWeek: boolean }): boolean {
    const claps = this.weeklyClaps
    const timespent = claps && claps[week.key] && claps[week.key].timespent
    return timespent > 60
  }

  isWeekActive(week: { key: string; activeWeek: boolean }): boolean {
    return !!week.activeWeek
  }

  openKnowMore() {
    this.eventSvc.raiseInteractTelemetry(
      {
        type: WsEvents.EnumInteractTypes.CLICK,
        subType: 'know-more-link',
        id: 'weekly-claps-know-more',
      },
      {},
      {
        module: WsEvents.EnumTelemetrymodules.HOME,
      }
    )
    this.showPopup = true
  }

  closePopup() {
    this.showPopup = false
  }

  getWeekIcon(week: { key: string; activeWeek: boolean }): string {
    const claps = this.weeklyClaps
    const timespent = claps && claps[week.key] && claps[week.key].timespent
    if (timespent > 60) {
      return 'assets/icons/home/check_icon.svg'
    }
    return week.activeWeek
      ? 'assets/icons/home/highlight.svg'
      : 'assets/icons/home/decline_icon.svg'
  }
}
