// tslint:disable-next-line: max-line-length
import { ChangeDetectorRef, Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, OnDestroy } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { EventService, TelemetryService, WsEvents } from '@sunbird-cb/utils-v2'
import { $t } from '@project-sunbird/telemetry-sdk'
import { environment } from 'src/environments/environment'

const SECOND_VIDEO_TITLE_KEY = 'tourvideo.whatIsKarmaWallet'
const SECOND_VIDEO_TITLE_FALLBACK = 'What is Karma Wallet?'
const TOUR_VIDEO_PAGE_ID = 'page/home'

@Component({
  selector: 'ws-app-tour-video',
  templateUrl: './app-tour-video.component.html',
  styleUrls: ['./app-tour-video.component.scss'],
  standalone: false
})
export class AppTourVideoComponent implements OnInit, OnDestroy {
  @Input() showVideoTour: any
  @Input() isMobile: any
  @Input() videoProgressTime = 0
  @Input() showOnlyIgotKarmayogi = false
  @Input() secondVideoEnabled = false
  @Input() startVideoIndex = 0
  @Output() emitedValue = new EventEmitter<string>()
  @Output() videoPlayed = new EventEmitter()
  @Output() videosCompleted = new EventEmitter<void>()
  videoPlayedProgress = true
  environment: any
  videoUrl: any
  videoUrl1: any
  activeVideoIndex = 0
  // tslint:disable-next-line
  @ViewChild('tourVideoTag') tourVideoTag!: ElementRef<HTMLVideoElement>

  constructor(
    private eventService: EventService,
    private translate: TranslateService,
    private telemetrySvc: TelemetryService,
    private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!

      this.translate.use(lang)
      // console.log('current lang ------', this.translate.getBrowserLang())
      // this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      //   console.log('onLangChange', event)
      // })
    }
  }

  ngOnInit() {
    this.environment = environment
    this.videoUrl = `https://${this.environment.sitePath}/assets/public/content/guide-videos/Website_Video_v1.mp4`
    // this.videoUrl1 = `https://${this.environment.sitePath}/assets/public/content/guide-videos/Website_Video_v2.mp4`
    this.videoUrl1 ="https://lorem.video/720p.mp4"
    this.activeVideoIndex = this.startVideoIndex === 1 ? 1 : 0
    if (this.activeVideoIndex === 1) {
      this.raiseKarmaWalletVideoImpression()
    }
    try {
      if (this.videoProgressTime > 0 && this.activeVideoIndex === 0) {
        this.videoPlayedProgress = false
        setTimeout(() => {
          // @ts-ignore
          const aud = document.getElementById('tourVideoTag')
          let approxTime = 0
          // @ts-ignore
          aud.ontimeupdate = () => {
            // @ts-ignore
            const currentTime = Math.floor(aud['currentTime'])
            if (currentTime !== approxTime) {
              approxTime = currentTime
              if (approxTime === this.videoProgressTime) {
                this.videoPlayedProgress = true
                this.videoPlayed.emit({ state: 'played', time: approxTime })
              }
            }
          }
          // tslint:disable-next-line
        }, 2000)
      }
      // tslint:disable-next-line: align
    } catch (error) {
      // console.error('Video progress time error')
    }
    this.raiseVideStartTelemetry()
  }

  get currentVideoUrl(): any {
    return this.activeVideoIndex === 1 ? this.videoUrl1 : this.videoUrl
  }

  get secondVideoTitle(): string {
    const translated = this.translate.instant(SECOND_VIDEO_TITLE_KEY)
    if (!translated || translated === SECOND_VIDEO_TITLE_KEY) {
      return SECOND_VIDEO_TITLE_FALLBACK
    }
    return translated
  }
  onVideoEnded() {
    if (this.activeVideoIndex === 1) {
      this.videosCompleted.emit()
      return
    }
    if (!this.secondVideoEnabled || !this.videoUrl1) {
      return
    }
    this.playSecondVideo()
  }

  private playSecondVideo() {
    this.activeVideoIndex = 1
    this.raiseKarmaWalletVideoImpression()
    const videoTag: any = this.tourVideoTag && this.tourVideoTag.nativeElement
    if (videoTag) {
      videoTag.ontimeupdate = null
    }
    this.cdr.detectChanges()
    if (!videoTag) {
      return
    }
    videoTag.load()
    const playRequest = videoTag.play()
    if (playRequest && playRequest.catch) {
      playRequest.catch(() => { })
    }
  }

  letsStart() {
    this.emitedValue.emit('start')
  }

  letsSkip() {
    this.emitedValue.emit('skip')
  }

  ngOnDestroy() {
    this.raiseVideEndTelemetry(this.tourVideoTag.nativeElement.currentTime)
  }

  private raiseKarmaWalletVideoImpression() {
    const pData = this.telemetrySvc.pData || {}
    try {
      $t.impression(
        {
          pageid: TOUR_VIDEO_PAGE_ID,
          type: 'view',
          uri: TOUR_VIDEO_PAGE_ID,
        },
        {
          context: {
            pdata: { ...pData, id: pData.id },
            env: "Karma Wallet",
          },
          object: {},
        },
      )
    } catch (err) {
    }
  }

  raiseVideStartTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: '' },
        object: {},
        state: WsEvents.EnumTelemetrySubType.Loaded,
        eventSubType: WsEvents.EnumTelemetrySubType.GetStarted,
        type: WsEvents.WsTimeSpentType.Player,
        mode: WsEvents.WsTimeSpentMode.Play,
      },
      pageContext: { pageId: '/home', module: WsEvents.EnumTelemetrySubType.GetStarted },
      from: '',
      to: 'Telemetry',
    }
    this.eventService.dispatchGetStartedEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseVideEndTelemetry(progress: number) {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: '' },
        object: { duration: progress, total: 119 },
        state: WsEvents.EnumTelemetrySubType.Unloaded,
        eventSubType: WsEvents.EnumTelemetrySubType.GetStarted,
        type: WsEvents.WsTimeSpentType.Player,
        mode: WsEvents.WsTimeSpentMode.Play,
      },
      pageContext: {
        pageId: '/home',
        module: WsEvents.EnumTelemetrySubType.GetStarted,
      },
      from: '',
      to: 'Telemetry',
    }
    this.eventService.dispatchGetStartedEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }
}
