import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { NsWidgetResolver, WidgetBaseComponent } from '@sunbird-cb/resolver'
import { Subscription } from 'rxjs'
import { IWidgetsPlayerOfflineSessionData } from './player-offline-session.model'
import { WidgetContentService } from '@sunbird-cb/toc'
import { DomSanitizer } from '@angular/platform-browser'

@Component({
  selector: 'ws-widget-player-offline-session',
  templateUrl: './player-offline-session.component.html',
  styleUrls: ['./player-offline-session.component.scss'],
  standalone: false
})
export class PlayerOfflineSessionComponent extends WidgetBaseComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges, NsWidgetResolver.IWidgetData<any> {
  @Input() widgetData!: IWidgetsPlayerOfflineSessionData
  viewerDataServiceSubscription: Subscription | null = null
  identifier: string | null = null
  content: any
  enableTelemetry = false
  tocConfig = null
  tocConfigSubscription: Subscription | null = null
  widgetSessionContentSubscription: Subscription | any = null
  sessionContentData: any = null
  constructor(
    private widgetContentSvc: WidgetContentService,
    private sanitizer: DomSanitizer

  ) {
    super()
  }

  ngOnInit() {
    this.tocConfigSubscription = this.widgetContentSvc.tocConfigData.subscribe((data: any) => {
      this.tocConfig = data
    })
    this.widgetSessionContentSubscription = this.widgetContentSvc.sessionContentData.subscribe((data: any) => {

      if (data && Object.prototype.hasOwnProperty.call(data, 'sessionContentDetail')) {
        // key exists

        this.sessionContentData =
          this.sanitizer.bypassSecurityTrustResourceUrl(data?.sessionContentDetail)
      } else {
        this.sessionContentData = null
      }
    })
    // TODO:When player is fully implemented put initial functions here
  }

  ngOnChanges() {
    if (this.widgetData && this.widgetData.content) {
      this.content = this.widgetData.content
    }
  }

  ngAfterViewInit() {
    if (this.widgetData.content) {
      this.content = this.widgetData.content
    }
  }

  ngOnDestroy() {
    if (this.identifier) {
      // TODO: When player is fully implemeted fire progress and save learning on player close

      // this.saveContinueLearning(this.identifier)
      // this.fireRealTimeProgress(this.identifier)
    }
    if (this.tocConfigSubscription) {
      this.tocConfigSubscription.unsubscribe()
    }
    if (this.widgetSessionContentSubscription) {
      this.widgetSessionContentSubscription.unsubscribe()
    }
  }
}
