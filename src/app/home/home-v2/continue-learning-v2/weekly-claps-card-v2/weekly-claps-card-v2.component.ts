import { Component, HostListener, Input, inject } from '@angular/core'
import { EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'ws-weekly-claps-card-v2',
  templateUrl: './weekly-claps-card-v2.component.html',
  styleUrls: ['./weekly-claps-card-v2.component.scss'],
  standalone: true,
  imports: [TranslateModule],
})
export class WeeklyClapsCardV2Component {
  @Input() insightsData: any = null
  @Input() weeklyData: any = null
  @Input() isLoading = true
  showPopup = false

  private readonly eventSvc = inject(EventService)

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

 @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.showPopup) {
      this.closePopup()
    }
  }

  getWeekIcon(week: { key: string; activeWeek: boolean }): string {
    const claps = this.weeklyClaps
    const timespent = claps && claps[week.key] && claps[week.key].timespent
    if (timespent > 60) {
      return 'assets/icons/home-v2/approved.svg'
    }
    return week.activeWeek
      ? 'assets/icons/home-v2/highlight.svg'
      : 'assets/icons/home-v2/decline_icon.svg'
  }
}
