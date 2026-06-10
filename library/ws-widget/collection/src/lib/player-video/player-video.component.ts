import { AfterViewInit, Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { NsWidgetResolver, WidgetBaseComponent } from '@sunbird-cb/resolver'
import { EventService } from '@sunbird-cb/utils-v2'
import videoJs from 'video.js'
import { ROOT_WIDGET_CONFIG } from '../collection.config'
import { IWidgetsPlayerMediaData } from '../_models/player-media.model'
import {
  fireRealTimeProgressFunction,
  saveContinueLearningFunction,
  telemetryEventDispatcherFunction,
  videoInitializer,
  videoJsInitializer,
} from '../_services/videojs-util'
import { WidgetContentService } from '@sunbird-cb/toc'
import { ViewerUtilService } from '@sunbird-cb/toc'
import { AppTocService } from '@sunbird-cb/toc'
import { Subscription } from 'rxjs'
import 'videojs-hls-quality-selector'
const videoJsOptions: videoJs.PlayerOptions = {
  controls: true,
  autoplay: true,
  preload: 'auto',
  fluid: false,
  muted: false,
  techOrder: ['html5'],
  playbackRates: [1, 1.5],
  poster: '',
  html5: {
    hls: {
      overrideNative: true,
    },
    nativeVideoTracks: false,
    nativeAudioTracks: false,
    nativeTextTracks: false,
  },
  nativeControlsForTouch: false,
  plugins: {
    hlsQualitySelector: {
      displayCurrentQuality: true, // ✅ Show current quality in the menu
    },
  },

}

@Component({
  selector: 'ws-widget-player-video',
  templateUrl: './player-video.component.html',
  styleUrls: ['./player-video.component.scss'],
})
export class PlayerVideoComponent extends WidgetBaseComponent
  implements
  OnInit,
  AfterViewInit,
  OnDestroy,
  NsWidgetResolver.IWidgetData<IWidgetsPlayerMediaData> {
  @Input() widgetData!: any
  @ViewChild('videoTag') videoTag!: ElementRef<HTMLVideoElement>
  @ViewChild('realvideoTag') realvideoTag!: ElementRef<HTMLVideoElement>
  @HostBinding('id')
  public id = 'v-player'
  private player: videoJs.Player | null = null
  private dispose: (() => void) | null = null
  videoEnd = false
  timerInterval: any
  video: any
  replayVideoFlag = false
  activeTranscriptionLanguage = 'en'
  transcriptionLangArr = []
  transcriptionSubscriptionData: any = {}
  playerInitObj: any
  previousSubtitleLanguage = 'en'
  playTranscriptionVideoSubscription: Subscription | null = null
  changeTranscriptionLanguageEventSubscription: Subscription | null = null
  private textTrackChangeListenerAdded = false
  private readonly SUBTITLE_LANGUAGE_KEY = 'selectedSubtitleLanguage'
  private readonly SUBTITLE_PREFERENCE_KEY = 'subtitlePreference'
  private readonly SUBTITLE_TEXT_SETTINGS_KEY = 'vjs-text-track-settings'
  private readonly SUBTITLE_TEXT_SETTINGS_STYLE_ID = 'player-subtitle-text-settings-style'
  private applyingStoredSubtitlePreference = false
  private rebuildingSubtitleTracks = false
  private subtitlePreferenceApplyTimer: any = null
  videoUrl = 'https://portal.uat.karmayogibharat.net/stream-store/content/do_114194996168163328192/artifact/manifest.m3u8'
  currentPlayerTrackLabel: any = ''
  currentPlayerTrackLangugage: any = ''
  currentPlayerSubtitleOff: any = ''
  constructor(
    private eventSvc: EventService,
    private contentSvc: WidgetContentService,
    private viewerSvc: ViewerUtilService,
    private activatedRoute: ActivatedRoute,
    private appTocService: AppTocService
  ) {
    super()
  }

  ngOnInit() {
    //   this.video=document.getElementById("videoTag");
    //   document.addEventListener("keydown",(e:any)=>{
    //     if(e.keyCode==37){       //left arrow
    //         this.backward()
    //     }else if(e.keyCode==39){ //right arrow
    //         this.forward()
    //     }
    //   }
    // )

    this.playTranscriptionVideoSubscription = this.appTocService.playTranscriptionVideo.subscribe((playTime: any) => {
      let startTime = playTime.startTime
      let endTime = playTime.endTime
      // let lastPlayedTime = startTime;
      if (startTime && endTime && this.playerInitObj) {
        const player = this.playerInitObj?.player

        player.currentTime(startTime) // Jump to star
        this.playerInitObj?.player.currentTime(startTime) // jump to start
        // setTimeout(()=>{
        // initObj.player.autoplay()
        if (this.videoTag && this.videoTag.nativeElement) {
          this.videoTag.nativeElement.muted = false
          this.videoTag.nativeElement.play()
        } else if (this.realvideoTag && this.realvideoTag.nativeElement) {
          this.realvideoTag.nativeElement.muted = false
          this.realvideoTag.nativeElement.play()
        }
        this.playerInitObj?.player.on('timeupdate', () => {
          if (endTime && parseInt(this.playerInitObj?.player.currentTime()) >= parseInt(endTime)) {
            this.playerInitObj?.player.pause()
            setTimeout(() => {
              endTime = this.playerInitObj?.player.duration()
            }, 0)

          }
        })
      } else {
        // handler for video tag - safari case
        this.realvideoTag.nativeElement.currentTime = startTime
        this.realvideoTag.nativeElement.addEventListener('timeupdate', () => {
          if (this.realvideoTag.nativeElement.currentTime >= endTime) {
            this.realvideoTag.nativeElement.pause() // Pause when the end time is reached
          }
        }, false)
      }


    })

  }


  async ngAfterViewInit() {
    let playerInitialize = false

    this.widgetData = {
      ...this.widgetData,
    }
    //this.appTocService.transriptionIdentifier.next(this.widgetData)
    if (this.widgetData && this.widgetData.identifier && !this.widgetData.url) {

      await this.fetchContent()
    }
    if (this.widgetData.url) {
      if (this.widgetData.isVideojs) {
        if (!this.playerInitObj) {
          playerInitialize = true
          this.initializePlayer()
        }

        this.changeTranscriptionLanguageEventSubscription = this.appTocService.changeTranscriptionLanguageEvent.subscribe((data: any) => {
          if (data && data?.activeLang) {
            this.transcriptionLangArr = []
            this.transcriptionSubscriptionData = data
            this.activeTranscriptionLanguage = this.transcriptionSubscriptionData?.activeLang
            this.transcriptionLangArr = this.transcriptionSubscriptionData?.langData
            if (this.transcriptionSubscriptionData?.loadPlayer) {
              this.initializePlayer()
            } else {
              if (Array.isArray(this.transcriptionLangArr) && !playerInitialize) {

                let tracks = this.playerInitObj.player.textTracks()
                //let allCues:any = []
                for (let i = 0; i < tracks.length; i++) {
                  const track = tracks[i]
                  // console.log(tracks[i].label, tracks[i]);

                  if (track.kind === 'subtitles' || track.kind === 'metadata') {
                    //  track.mode = 'showing'; // or 'hidden' if you don't want it on screen
                    if (track.language === this.activeTranscriptionLanguage) {
                      track.mode = 'showing'

                    } else {
                      track.mode = 'hidden'  // prevent multiple from showing
                    }



                    if (!(track as any)._cueAttached) {
                      (track as any)._cueAttached = true
                      track.addEventListener('cuechange', () => {
                        const activeCues = track.activeCues

                        if (activeCues && activeCues?.length > 0) {
                          for (let j = 0; j < activeCues?.length; j++) {
                            const cue: any = activeCues[j]

                            this.appTocService.setTranscriptionData({
                              start: cue?.startTime,
                              end: cue?.endTime,
                              text: cue?.text
                            })

                          }
                          //console.log('cue', allCues)
                        }
                      })
                    }
                  }
                }
              }
            }

          } else {
            this.initializePlayer()
          }
        })
      } else {
        this.initializeVPlayer()
        this.changeTranscriptionLanguageEventSubscription = this.appTocService.changeTranscriptionLanguageEvent.subscribe((data: any) => {
          console.log('DEBUG: Transcription language changed for HTML5 player:', data)
          if (data && data?.activeLang) {
            this.transcriptionLangArr = []
            this.transcriptionSubscriptionData = data
            this.activeTranscriptionLanguage = this.transcriptionSubscriptionData?.activeLang
            this.transcriptionLangArr = this.transcriptionSubscriptionData?.langData

            // Add subtitle tracks to HTML5 player
            console.log('DEBUG: Adding subtitle tracks to HTML5 player, langCount:', this.transcriptionLangArr?.length)
            this.setupHTML5Subtitles()
          }
        })
      }
    }

    // Setup onended handler will be called from setupAutoplayHandler()
    // This ensures it's attached properly even on subsequent loads


  }

  clearTimeInterval() {
    clearInterval(this.timerInterval)
  }

  private setupAutoplayHandler() {
    // Get the actual video element - it could be either videoTag (videojs) or realvideoTag (HTML5)
    const videoElement: any = this.videoTag?.nativeElement || this.realvideoTag?.nativeElement

    if (!videoElement) {
      console.warn('DEBUG: Video element not found for autoplay handler setup')
      return
    }

    // Remove old handler if it exists to avoid duplicate handlers
    videoElement.onended = null

    // Set new handler
    videoElement.onended = () => {
      console.log('Video ended, showing autoplay overlay if enabled')
      this.videoEnd = true
      if (this.widgetData && this.widgetData.hideUpNext) {
        this.replayVideoFlag = this.widgetData.hideUpNext ? true : false
      }
      const videoTagElement: any = document.getElementById('videoTag') || document.getElementById('realvideoTag')
      const autoPlayVideo: any = document.getElementById('auto-play-video')
      if (videoTagElement) {
        if (autoPlayVideo) {
          autoPlayVideo.style.opacity = '0.8'
        }
        videoTagElement.style.filter = 'blur(2px)'
      }
      let counter = 1
      this.timerInterval = setInterval(() => {
        if (counter <= 5) {
          this.updateProgress(counter)
        }
        if (counter > 5) {
          if (videoTagElement) {
            videoTagElement.style.filter = 'blur(0px)'
          }
          if (autoPlayVideo) {
            autoPlayVideo.style.opacity = '1'
          }
          counter = 0
          this.clearTimeInterval()
          this.viewerSvc.autoPlayNextVideo.next(true)
        }
        counter = counter + 1
      }, 1000)
    }
    console.log('DEBUG: Autoplay handler attached to video element')
  }

  updateProgress(value: any) {
    const progress: any = document.querySelector('.circular-progress')
    progress.style.setProperty('--percentage', `${value * 72}deg`)
    // progress.innerText = `${value}%`
  }

  ngOnDestroy() {
    if (this.player) {
      this.player.dispose()
    }
    if (this.dispose) {
      this.dispose()
    }
    this.clearTimeInterval()
    if (this.subtitlePreferenceApplyTimer) {
      clearTimeout(this.subtitlePreferenceApplyTimer)
    }
    this.textTrackChangeListenerAdded = false

    if (this.changeTranscriptionLanguageEventSubscription) {
      this.changeTranscriptionLanguageEventSubscription.unsubscribe()
    }
    if (this.playTranscriptionVideoSubscription) {
      this.playTranscriptionVideoSubscription.unsubscribe()
    }



  }
  private initializeVPlayer() {


    const dispatcher: telemetryEventDispatcherFunction = event => {
      if (this.widgetData.identifier) {
        this.eventSvc.dispatchEvent(event)
      }
    }
    const saveCLearning: saveContinueLearningFunction = data => {
      if (this.widgetData.identifier) {

        if (this.activatedRoute.snapshot.queryParams.collectionType &&
          this.activatedRoute.snapshot.queryParams.collectionType.toLowerCase() === 'playlist') {
          const continueLearningData = {
            contextPathId: this.activatedRoute.snapshot.queryParams.collectionId ?
              this.activatedRoute.snapshot.queryParams.collectionId : this.widgetData.identifier,
            resourceId: data.resourceId,
            contextType: 'playlist',
            dateAccessed: Date.now(),
            data: JSON.stringify({
              progress: data.progress,
              timestamp: Date.now(),
              contextFullPath: [this.activatedRoute.snapshot.queryParams.collectionId, data.resourceId],
            }),
          }
          this.contentSvc
            .saveContinueLearning(continueLearningData)
            .toPromise()
            .catch()
        } else {
          const continueLearningData = {
            contextPathId: this.activatedRoute.snapshot.queryParams.collectionId ?
              this.activatedRoute.snapshot.queryParams.collectionId : this.widgetData.identifier,
            ...data,
            // resourceId: data.resourceId,
            // dateAccessed: Date.now(),
            // data: data.data,
          }
          // JSON.stringify({
          //   progress: data.progress,
          //   timestamp: Date.now(),
          // }),
          this.contentSvc
            .saveContinueLearning(continueLearningData)
            .toPromise()
            .catch()
        }
      }
    }
    const fireRProgress: fireRealTimeProgressFunction = (identifier, data) => {
      const collectionId = this.activatedRoute.snapshot.queryParams.collectionId ?
        this.activatedRoute.snapshot.queryParams.collectionId : ''
      const batchId = this.activatedRoute.snapshot.queryParams.batchId ?
        this.activatedRoute.snapshot.queryParams.batchId : ''
      const isPreAssessment = this.activatedRoute.snapshot.queryParams.preAssessment
      if (isPreAssessment) {
        if (this.widgetData.identifier && identifier && data) {
          this.viewerSvc
            .realTimeProgressUpdateForPreAssessment(identifier, data)
        }
      } else if (this.widgetData.identifier && identifier && data) {
        this.viewerSvc
          .realTimeProgressUpdate(identifier, data, collectionId, batchId)
      }
    }
    if (this.widgetData.resumePoint && this.widgetData.resumePoint !== 0) {
      this.realvideoTag.nativeElement.currentTime = this.widgetData.resumePoint
    }
    let enableTelemetry = false
    if (!this.widgetData.disableTelemetry && typeof (this.widgetData.disableTelemetry) !== 'undefined') {
      enableTelemetry = true
    }
    this.dispose = videoInitializer(
      this.realvideoTag.nativeElement,
      dispatcher,
      saveCLearning,
      fireRProgress,
      this.widgetData.passThroughData,
      ROOT_WIDGET_CONFIG.player.video,
      enableTelemetry,
      this.widgetData,
      this.widgetData.mimeType,
    ).dispose

    // Setup autoplay handler for HTML5 player
    this.setupAutoplayHandler()
  }

  private initializePlayer() {
    // Only dispose and reinitialize if it's the first time (playerInitObj is null)
    // If player already exists, just update subtitles by calling loadPlayerForSafariAndOtherBrowser
    if (this.playerInitObj) {
      // Player already initialized - just update subtitles/tracks
      console.log('DEBUG: Player already exists, just updating subtitles')
      try {
        this.loadPlayerForSafariAndOtherBrowser(this.playerInitObj, 0, 0)
      } catch (e) {
        console.error('Error updating subtitles:', e)
      }
      return
    }

    // First time initialization - create new player
    console.log('DEBUG: First initialization, creating new player')

    let startTime = 0
    let endTime = 0
    if (this.activatedRoute.snapshot.queryParams && this.activatedRoute.snapshot.queryParams.from && this.activatedRoute.snapshot.queryParams.from === 'globalSearch') {
      if (this.activatedRoute.snapshot.queryParams.st) {
        startTime = this.activatedRoute.snapshot.queryParams.st
        endTime = this.activatedRoute.snapshot.queryParams.et
      }
    }

    const dispatcher: telemetryEventDispatcherFunction = event => {
      if (this.widgetData.identifier) {
        this.eventSvc.dispatchEvent(event)
      }
    }
    const saveCLearning: saveContinueLearningFunction = data => {
      if (this.widgetData.identifier) {
        if (this.activatedRoute.snapshot.queryParams.collectionType &&
          this.activatedRoute.snapshot.queryParams.collectionType.toLowerCase() === 'playlist') {
          const continueLearningData = {
            contextPathId: this.activatedRoute.snapshot.queryParams.collectionId ?
              this.activatedRoute.snapshot.queryParams.collectionId : this.widgetData.identifier,
            resourceId: data.resourceId,
            contextType: 'playlist',
            dateAccessed: Date.now(),
            data: JSON.stringify({
              progress: data.progress,
              timestamp: Date.now(),
              contextFullPath: [this.activatedRoute.snapshot.queryParams.collectionId, data.resourceId],
            }),
          }
          this.contentSvc
            .saveContinueLearning(continueLearningData)
            .toPromise()
            .catch()
        } else {
          const continueLearningData = {
            contextPathId: this.activatedRoute.snapshot.queryParams.collectionId
              ? this.activatedRoute.snapshot.queryParams.collectionId
              : this.widgetData.identifier,
            ...data,
          }
          this.contentSvc
            .saveContinueLearning(continueLearningData)
            .toPromise()
            .catch()
        }
      }
    }
    const fireRProgress: fireRealTimeProgressFunction = (identifier, data) => {
      const resData = this.viewerSvc.getBatchIdAndCourseId(this.activatedRoute.snapshot.queryParams.collectionId,
        this.activatedRoute.snapshot.queryParams.batchId, identifier)
      const collectionId = (resData && resData.courseId) ? resData.courseId : ''
      const batchId = (resData && resData.batchId) ? resData.batchId : ''
      const isPreAssessment = this.activatedRoute.snapshot.queryParams.preAssessment
      if (isPreAssessment) {
        if (this.widgetData.identifier && identifier && data) {
          this.viewerSvc
            .realTimeProgressUpdateForPreAssessment(identifier, data)
        }
      } else if (this.widgetData.identifier && identifier && data && collectionId && batchId) {
        this.viewerSvc
          .realTimeProgressUpdate(identifier, data, collectionId, batchId)
      }
    }
    let enableTelemetry = false
    if (!this.widgetData.disableTelemetry && typeof (this.widgetData.disableTelemetry) !== 'undefined') {
      enableTelemetry = true
    }
    const initObj = videoJsInitializer(
      this.videoTag.nativeElement,
      {
        ...videoJsOptions,
        poster: this.widgetData.posterImage ? this.viewerSvc.getPublicUrl(this.widgetData.posterImage || '') : '',
        autoplay: this.widgetData.autoplay || false,
      },
      dispatcher,
      saveCLearning,
      fireRProgress,
      this.widgetData.passThroughData,
      ROOT_WIDGET_CONFIG.player.video,
      this.widgetData.resumePoint ? this.widgetData.resumePoint : 0,
      enableTelemetry,
      this.widgetData,
      this.widgetData.mimeType,
      this.widgetData.size,

    )
    this.playerInitObj = initObj
    this.player = initObj.player

    this.dispose = initObj.dispose

    // Ensure video element and player wrapper are visible
    if (this.videoTag && this.videoTag.nativeElement) {
      this.videoTag.nativeElement.style.display = 'block'
      this.videoTag.nativeElement.style.visibility = 'visible'
      this.videoTag.nativeElement.style.opacity = '1'
    }

    try {
      console.log('DEBUG: Attempting to register ready() handler')
      initObj.player.ready(() => {
        console.log('Player ready event fired, initializing subtitles and autoplay handler')
        // Ensure video element is visible
        if (this.videoTag && this.videoTag.nativeElement) {
          this.videoTag.nativeElement.style.display = 'block'
          this.videoTag.nativeElement.style.visibility = 'visible'
          this.videoTag.nativeElement.style.opacity = '1'
        }
        // Setup autoplay handler every time player is ready
        this.setupAutoplayHandler()
        try {
          this.loadPlayerForSafariAndOtherBrowser(initObj, startTime, endTime)
        } catch (e) {
          console.error('Error in loadPlayerForSafariAndOtherBrowser:', e)
        }
      })
      console.log('DEBUG: ready() handler registered successfully')
    } catch (error) {
      console.error('DEBUG: Error registering ready() handler:', error)
    }

    console.log('DEBUG: Setting up 500ms timeout fallback')
    setTimeout(() => {
      console.log('Timeout fallback: ensuring subtitles are initialized (Safari compatibility)')
      try {
        initObj.player.currentTime(startTime)
        // initObj.player.on('timeupdate', () => {
        //   if (endTime && initObj.player.currentTime() >= endTime) {
        //     initObj.player.pause()
        //     setTimeout(() => {
        //       endTime = initObj.player.duration()
        //     }, 0)

        //   }
        // })
        // this.loadPlayerForSafariAndOtherBrowser(initObj, startTime, endTime)
      } catch (error) {
        console.log('Timeout fallback initialization error:', error)
      }
    }, 500)

    // const player = this.player;
    // console.log('player', this.player)
    // if(player) {
    //   if(player.controlBar.options_.children) {
    //     console.log('player', player);
    //     let seelBar:any = player.controlBar;
    //     seelBar.progressControl['children'][0]['SeekBar']['enabled_'] = false;
    //     console.log('seelBar', seelBar.progressControl)
    //   }
    // }
  }
  async fetchContent() {
    const content = await this.contentSvc
      .fetchContent(this.widgetData.identifier || '', 'minimal')
      .toPromise()
    if (content.artifactUrl && content.artifactUrl.indexOf('/content-store/') > -1) {
      this.widgetData.url = content.artifactUrl
      this.widgetData.posterImage = content.appIcon
      this.widgetData.posterImage = this.viewerSvc.getPublicUrl(this.widgetData.posterImage || '')
      await this.contentSvc.setS3Cookie(this.widgetData.identifier || '').toPromise()
    }

    this.widgetData.subtitles = content.subTitles
  }

  closeAutoPlay() {
    this.videoEnd = false
    this.replayVideoFlag = true
    clearInterval(this.timerInterval)
  }

  replayVideo() {
    this.replayVideoFlag = false
    const videoTag: any = document.getElementById('videoTag') || document.getElementById('realvideoTag')
    if (videoTag) {
      videoTag.style.filter = 'blur(0px)'
    }
    const autoPlayVideo: any = document.getElementById('auto-play-video')
    if (autoPlayVideo) {
      autoPlayVideo.style.opacity = '1'
    }
    if (this.player) {
      this.player.play()
    }
  }

  titleCase(str: string): string {
    return str && str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // replaceSubtitleTrack(newTrack: any) {

  //   // const defaultTrackTemp:any = this.transcriptionLangArr.find((t:any) => t.default_lang);
  //   // console.log('defaultTrack--', defaultTrackTemp)
  //   // let defaultTrack:any = this.transcriptionLangArr.filter((item: any) => {
  //   //   return item?.label === defaultTrackTemp?.default_lang
  //   // });


  //   const videoEl = this.playerInitObj.player.el().getElementsByTagName('video')[0]
  //   const existingTracks = videoEl.querySelectorAll('track')
  //   existingTracks.forEach((el: any) => el.remove())

  //   const trackEl = document.createElement('track')
  //   trackEl.kind = 'subtitles'
  //   trackEl.src = newTrack.uri
  //   trackEl.srclang = newTrack.label.toLowerCase()
  //   trackEl.label = newTrack.language
  //   trackEl.default = true
  //   videoEl.appendChild(trackEl)
  //   let tracks = videoEl.textTracks


  //   // setTimeout(() => {


  //   for (let i = 0; i < tracks.length; i++) {
  //     const t = tracks[i]
  //     if (t.kind === 'subtitles') {
  //       // Toggle and force reflow if needed
  //       if (t.mode === 'showing') {
  //         t.mode = 'hidden'
  private getStoredSubtitleTextSettings(): any {
    const savedSettings = localStorage.getItem(this.SUBTITLE_TEXT_SETTINGS_KEY)

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        // Return null for empty objects (VJS stores {} for default/reset settings)
        return parsedSettings && typeof parsedSettings === 'object' && Object.keys(parsedSettings)?.length > 0
          ? parsedSettings
          : null
      } catch (e) {
        localStorage.removeItem(this.SUBTITLE_TEXT_SETTINGS_KEY)
      }
    }

    return null
  }

  private getStoredSubtitlePreference(): any {
    const savedPreference = localStorage.getItem(this.SUBTITLE_PREFERENCE_KEY)
    const savedTextSettings = this.getStoredSubtitleTextSettings()

    if (savedPreference) {
      try {
        const parsedPreference = JSON.parse(savedPreference)
        return {
          language: typeof parsedPreference?.language === 'string' ? parsedPreference?.language?.toLowerCase() : null,
          label: typeof parsedPreference?.label === 'string' ? parsedPreference?.label : null,
          enabled: parsedPreference?.enabled === true,
          textSettings: parsedPreference?.textSettings && typeof parsedPreference?.textSettings === 'object'
            ? parsedPreference?.textSettings
            : savedTextSettings,
        }
      } catch (e) {
        localStorage.removeItem(this.SUBTITLE_PREFERENCE_KEY)
      }
    }

    const legacyLanguage = localStorage.getItem(this.SUBTITLE_LANGUAGE_KEY) || localStorage.getItem('currentPlayerTrackLangugage')
    const legacyLabel = localStorage.getItem('currentPlayerTrackLabel')
    const legacySubtitleOff = localStorage.getItem('currentPlayerSubtitleOff')

    if (legacyLanguage || legacyLabel || legacySubtitleOff === 'true') {
      const migratedPreference = {
        language: legacyLanguage ? legacyLanguage?.toLowerCase() : null,
        label: legacyLabel || null,
        enabled: legacySubtitleOff === 'true' ? false : !!legacyLanguage,
        textSettings: savedTextSettings,
      }
      this.setStoredSubtitlePreference(migratedPreference?.language, migratedPreference?.enabled, migratedPreference?.label)
      return migratedPreference
    }

    return null
  }

  private setStoredSubtitlePreference(language: string | null, enabled: boolean, label?: string | null) {
    const normalizedLanguage = language ? language?.toLowerCase() : null
    let storedLabel = localStorage.getItem('currentPlayerTrackLabel')
    let storedTextSettings = this.getStoredSubtitleTextSettings()
    const savedPreference = localStorage.getItem(this.SUBTITLE_PREFERENCE_KEY)

    if (savedPreference) {
      try {
        const parsedPreference = JSON.parse(savedPreference)
        storedLabel = typeof parsedPreference?.label === 'string' ? parsedPreference?.label : storedLabel
        storedTextSettings = parsedPreference?.textSettings && typeof parsedPreference?.textSettings === 'object'
          ? parsedPreference?.textSettings
          : storedTextSettings
      } catch (e) {
        storedLabel = localStorage.getItem('currentPlayerTrackLabel')
      }
    }

    const normalizedLabel = typeof label === 'string' ? label : storedLabel || null

    localStorage.setItem(
      this.SUBTITLE_PREFERENCE_KEY,
      JSON.stringify({
        language: normalizedLanguage,
        label: normalizedLabel,
        enabled,
        textSettings: storedTextSettings,
      })
    )

    if (normalizedLanguage) {
      localStorage.setItem(this.SUBTITLE_LANGUAGE_KEY, normalizedLanguage)
      localStorage.setItem('currentPlayerTrackLangugage', normalizedLanguage)
    }
    if (normalizedLabel) {
      localStorage.setItem('currentPlayerTrackLabel', normalizedLabel)
    }

    if (enabled) {
      localStorage.removeItem('currentPlayerSubtitleOff')
    } else {
      localStorage.setItem('currentPlayerSubtitleOff', 'true')
    }
  }

  private setStoredSubtitleTextSettings(textSettings: any) {
    if (!textSettings || typeof textSettings !== 'object') {
      return
    }

    localStorage.setItem(this.SUBTITLE_TEXT_SETTINGS_KEY, JSON.stringify(textSettings))

    const preference = this.getStoredSubtitlePreference()
    localStorage.setItem(
      this.SUBTITLE_PREFERENCE_KEY,
      JSON.stringify({
        language: preference?.language || null,
        label: preference?.label || null,
        enabled: preference?.enabled === true,
        textSettings,
      })
    )
  }

  private clearStoredSubtitleTextSettings() {
    localStorage.removeItem(this.SUBTITLE_TEXT_SETTINGS_KEY)

    const preference = this.getStoredSubtitlePreference()
    localStorage.setItem(
      this.SUBTITLE_PREFERENCE_KEY,
      JSON.stringify({
        language: preference?.language || null,
        label: preference?.label || null,
        enabled: preference?.enabled === true,
        textSettings: null,
      })
    )

    const styleEl = document.getElementById(this.SUBTITLE_TEXT_SETTINGS_STYLE_ID)
    if (styleEl) {
      styleEl?.remove()
    }
  }

  private getSubtitleTextSettingsComponent(initObj: any): any {
    // Try PascalCase first (VJS registers as 'TextTrackSettings'), then camelCase, then direct property
    return initObj?.player?.getChild('TextTrackSettings') ||
      initObj?.player?.getChild('textTrackSettings') ||
      initObj?.player?.textTrackSettings
  }

  private applyStoredSubtitleTextSettings(initObj: any) {
    const preference = this.getStoredSubtitlePreference()
    const textSettings = preference?.textSettings || this.getStoredSubtitleTextSettings()

    if (!textSettings) {
      return
    }

    localStorage.setItem(this.SUBTITLE_TEXT_SETTINGS_KEY, JSON.stringify(textSettings))

    const textTrackSettings = this.getSubtitleTextSettingsComponent(initObj)
    if (textTrackSettings?.setValues) {
      textTrackSettings.setValues(textSettings)
    }
    if (textTrackSettings?.updateDisplay) {
      textTrackSettings.updateDisplay()
    }
    // Try PascalCase first (VJS registers as 'TextTrackDisplay'), then camelCase as fallback
    const textTrackDisplay =
      initObj?.player?.getChild('TextTrackDisplay') ||
      initObj?.player?.getChild('textTrackDisplay')
    if (textTrackDisplay?.updateDisplay) {
      textTrackDisplay.updateDisplay()
    }

    this.applyNativeSubtitleTextSettings(textSettings)
  }

  private syncSubtitleTextSettingsFromPlayer(initObj: any) {
    const textTrackSettings = this.getSubtitleTextSettingsComponent(initObj)
    if (!textTrackSettings?.getValues) {
      return
    }

    const textSettings = textTrackSettings?.getValues()
    if (textSettings && Object?.keys(textSettings)?.length) {
      this.setStoredSubtitleTextSettings(textSettings)
      this.applyNativeSubtitleTextSettings(textSettings)
    } else {
      this.clearStoredSubtitleTextSettings()
    }
  }

  private setupSubtitleTextSettingsPersistence(initObj: any, retryCount = 0) {
    const textTrackSettings = this.getSubtitleTextSettingsComponent(initObj)
    const textTrackSettingsEl = textTrackSettings?.el ? textTrackSettings?.el() : null

    this.applyStoredSubtitleTextSettings(initObj)

    if (!textTrackSettingsEl) {
      // VJS settings panel DOM may not be ready yet; retry up to 3 times
      if (retryCount < 3) {
        setTimeout(() => this.setupSubtitleTextSettingsPersistence(initObj, retryCount + 1), 200)
      }
      return
    }

    if ((textTrackSettings as any)._subtitleTextSettingsListenerAttached) {
      return
    }

    textTrackSettingsEl.addEventListener('change', () => this.syncSubtitleTextSettingsFromPlayer(initObj))

    const doneButton = textTrackSettingsEl.querySelector('.vjs-done-button')
    if (doneButton) {
      doneButton.addEventListener('click', () => this.syncSubtitleTextSettingsFromPlayer(initObj))
    }

    const defaultButton = textTrackSettingsEl.querySelector('.vjs-default-button')
    if (defaultButton) {
      defaultButton.addEventListener('click', () => {
        setTimeout(() => this.syncSubtitleTextSettingsFromPlayer(initObj), 0)
      })
    }

    const textTrackSettingsAny = textTrackSettings as any
    textTrackSettingsAny._subtitleTextSettingsListenerAttached = true
  }

  private getSubtitleColor(color: string, opacity?: string): string {
    if (!color) {
      return ''
    }

    if (color.indexOf('#') !== 0) {
      return color
    }

    const normalizedColor = color.length === 4
      ? color.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3')
      : color
    const red = parseInt(normalizedColor.substr(1, 2), 16)
    const green = parseInt(normalizedColor.substr(3, 2), 16)
    const blue = parseInt(normalizedColor.substr(5, 2), 16)
    const alpha = opacity || '1'

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
  }

  private applyNativeSubtitleTextSettings(textSettings: any) {
    if (!textSettings || typeof textSettings !== 'object') {
      return
    }

    const cueStyles: string[] = []
    const textColor = this.getSubtitleColor(textSettings?.color, textSettings?.textOpacity)
    const backgroundColor = this.getSubtitleColor(textSettings?.backgroundColor, textSettings?.backgroundOpacity)

    if (textColor) {
      cueStyles.push(`color: ${textColor}`)
    }
    if (backgroundColor) {
      cueStyles.push(`background-color: ${backgroundColor}`)
    }
    if (textSettings?.fontPercent) {
      cueStyles.push(`font-size: ${Number(textSettings.fontPercent) * 100}%`)
    }
    if (textSettings?.fontFamily) {
      const fontFamilyMap: any = {
        proportionalSansSerif: 'sans-serif',
        monospaceSansSerif: 'monospace',
        proportionalSerif: 'serif',
        monospaceSerif: 'monospace',
        casual: '"Comic Sans MS", cursive',
        script: 'cursive',
        'small-caps': 'sans-serif',
      }
      cueStyles.push(`font-family: ${fontFamilyMap[textSettings.fontFamily] || textSettings.fontFamily}`)
      if (textSettings.fontFamily === 'small-caps') {
        cueStyles.push('font-variant: small-caps')
      }
    }
    if (textSettings.edgeStyle) {
      const edgeStyleMap: any = {
        raised: '1px 1px 0 #000',
        depressed: '-1px -1px 0 #000',
        uniform: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
        dropshadow: '2px 2px 3px #000',
      }
      if (edgeStyleMap[textSettings.edgeStyle]) {
        cueStyles.push(`text-shadow: ${edgeStyleMap[textSettings.edgeStyle]}`)
      }
    }

    if (!cueStyles?.length) {
      return
    }

    let styleEl = document.getElementById(this.SUBTITLE_TEXT_SETTINGS_STYLE_ID)
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = this.SUBTITLE_TEXT_SETTINGS_STYLE_ID
      document.head.appendChild(styleEl)
    }

    // ::cue targets native HTML5 text-track rendering (Safari HTML5 path and any native fallback)
    // .vjs-text-track-cue > div is a CSS fallback for VJS custom rendering (Chrome/Firefox/Edge)
    // VJS inline styles take priority over the class rule when VJS properly applies settings;
    // the class rule kicks in when VJS has not applied inline styles (e.g. timing edge cases)
    styleEl.textContent = [
      `#realvideoTag::cue { ${cueStyles?.join('; ')}; }`,
      `#videoTag::cue { ${cueStyles?.join('; ')}; }`,
      `.vjs-text-track-display .vjs-text-track-cue > div { ${cueStyles?.join('; ')}; }`,
    ].join(' ')
  }

  private applyStoredSubtitlePreference(initObj: any, retryCount = 0) {
    const preference = this.getStoredSubtitlePreference()
    const tracks = initObj?.player?.textTracks()
    const subtitleTracks: any[] = []

    for (let i = 0; i < tracks?.length; i++) {
      const track = tracks[i]

      if (track?.kind === 'subtitles' || track?.kind === 'captions') {
        subtitleTracks.push(track)
      }
    }

    if (
      Array.isArray(this.transcriptionLangArr) &&
      this.transcriptionLangArr?.length &&
      subtitleTracks?.length < this.transcriptionLangArr?.length &&
      retryCount < 8
    ) {
      this.subtitlePreferenceApplyTimer = setTimeout(() => {
        this.applyStoredSubtitlePreference(initObj, retryCount + 1)
      }, 250)
      return
    }

    this.applyingStoredSubtitlePreference = true
    this.applyStoredSubtitleTextSettings(initObj)

    if (!preference) {
      subtitleTracks.forEach((track: any) => {
        track.mode = 'disabled'
      })
      this.currentPlayerTrackLabel = ''
      this.currentPlayerTrackLangugage = ''
      this.currentPlayerSubtitleOff = 'true'
      this.activeTranscriptionLanguage = ''
      this.updateSubtitleButtonIcon(false)
      setTimeout(() => {
        this.applyingStoredSubtitlePreference = false
        this.rebuildingSubtitleTracks = false
      }, 0)
      return
    }

    let selectedTrack: any = null

    subtitleTracks.forEach((track: any) => {
      const isSelectedLanguage =
        preference?.language &&
        track?.language &&
        track?.language?.toLowerCase() === preference?.language?.toLowerCase()
      const isSelectedLabel =
        preference?.label &&
        track?.label &&
        track?.label?.toLowerCase() === preference?.label?.toLowerCase()

      if (preference?.enabled && (isSelectedLanguage || isSelectedLabel)) {
        track.mode = 'showing'
        selectedTrack = track
      } else {
        track.mode = 'disabled'
      }
    })

    if (selectedTrack) {
      this.currentPlayerTrackLabel = selectedTrack?.label
      this.currentPlayerTrackLangugage = selectedTrack?.language
      this.currentPlayerSubtitleOff = ''
      this.previousSubtitleLanguage = selectedTrack?.language
      this.activeTranscriptionLanguage = selectedTrack?.language
      this.setStoredSubtitlePreference(selectedTrack?.language, preference?.enabled, selectedTrack?.label)
      this.updateSubtitleButtonIcon(true)
    } else {
      this.currentPlayerSubtitleOff = 'true'
      this.previousSubtitleLanguage = ''
      this.activeTranscriptionLanguage = preference?.language || ''
      this.updateSubtitleButtonIcon(false)
    }

    setTimeout(() => {
      this.applyingStoredSubtitlePreference = false
      this.rebuildingSubtitleTracks = false
    }, 0)
  }

  private scheduleStoredSubtitlePreferenceApply(initObj: any) {
    if (this.subtitlePreferenceApplyTimer) {
      clearTimeout(this.subtitlePreferenceApplyTimer)
    }

    this.subtitlePreferenceApplyTimer = setTimeout(() => {
      this.applyStoredSubtitlePreference(initObj)
    }, 0)
  }

  private activateSubtitle(language: string) {
    const tracks = this.playerInitObj?.player?.textTracks()
    let selectedTrackLabel: string | null = null

    for (let i = 0; i < tracks?.length; i++) {
      const track = tracks[i]

      if (
        track?.kind === 'subtitles' ||
        track?.kind === 'captions'
      ) {
        track.mode =
          track.language?.toLowerCase() === language?.toLowerCase()
            ? 'showing'
            : 'disabled'
        if (track.language?.toLowerCase() === language?.toLowerCase()) {
          selectedTrackLabel = track?.label
        }
      }
    }

    // localStorage.setItem(
    //   'currentPlayerTrackLangugage',
    //   language
    // )
    localStorage.setItem(
      this.SUBTITLE_LANGUAGE_KEY,
      language?.toLowerCase()
    )

    localStorage.setItem(
      'currentPlayerTrackLangugage',
      language?.toLowerCase()
    )

    this.setStoredSubtitlePreference(language, true, selectedTrackLabel)
    this.updateSubtitleButtonIcon(true)
  }

  updateSubtitleButtonIcon(subtitlesOn: boolean) {

    let subtitleImage = document.getElementById('custom-cc-icon-img') as HTMLImageElement

    if (subtitleImage) {
      subtitleImage.src = subtitlesOn ? "/assets/ai-tutor/subtitle-on.svg" : "/assets/ai-tutor/subtitle-off.svg"
    }

    if (!subtitlesOn && this.playerInitObj?.player) {
      const videoEl = this.playerInitObj.player.el().getElementsByTagName('video')[0]
      let tracks = videoEl.textTracks
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i]
        if (t.kind === 'subtitles') {
          // Toggle and force reflow if needed
          if (t.mode === 'showing') {
            t.mode = 'disabled'
          }
        }

        // console.log(`Track [${i}]: kind=${t.kind}, language=${t.language}, cues?`, t.cues, t.cues?.length);
      }
    }
  }

  private setupHTML5Subtitles() {
    console.log('DEBUG: setupHTML5Subtitles() called')
    if (!this.realvideoTag || !this.transcriptionLangArr || !Array.isArray(this.transcriptionLangArr)) {
      console.log('DEBUG: Missing video element or transcription data')
      return
    }

    const videoElement = this.realvideoTag.nativeElement as HTMLVideoElement
    const savedPreference = this.getStoredSubtitlePreference()
    this.applyNativeSubtitleTextSettings(savedPreference?.textSettings || this.getStoredSubtitleTextSettings())

    this.rebuildingSubtitleTracks = true

    // Remove existing tracks
    const existingTracks = videoElement.querySelectorAll('track')
    existingTracks.forEach(track => track.remove())

    // Add new subtitle tracks
    this.transcriptionLangArr.forEach((lang: any) => {
      const trackElement = document.createElement('track')
      trackElement.kind = 'subtitles'
      trackElement.label = this.titleCase(lang.language || lang.label)
      trackElement.srclang = lang.label?.toLowerCase() || lang.language?.toLowerCase()
      trackElement.src = lang.uri

      // Set default track
      if (
        savedPreference?.enabled === true &&
        (
          (savedPreference?.language && lang?.label?.toLowerCase() === savedPreference.language?.toLowerCase()) ||
          (savedPreference?.label && this.titleCase(lang?.language || lang?.label)?.toLowerCase() === savedPreference?.label?.toLowerCase())
        )
      ) {
        trackElement.default = true
      }

      videoElement.appendChild(trackElement)
      console.log('DEBUG: Added subtitle track:', trackElement.label)
    })

    // Listen for subtitle track changes
    setTimeout(() => {
      const videoTracks = videoElement.textTracks
      let selectedTrack: any = null

      for (let i = 0; i < videoTracks.length; i++) {
        const track = videoTracks[i]

        // Set track mode based on active language
        if (track.kind === 'subtitles') {
          if (
            savedPreference?.enabled === true &&
            (
              (savedPreference?.language && track?.language?.toLowerCase() === savedPreference?.language?.toLowerCase()) ||
              (savedPreference?.label && track?.label?.toLowerCase() === savedPreference?.label?.toLowerCase())
            )
          ) {
            track.mode = 'showing'
            selectedTrack = track
            console.log('DEBUG: Set track to showing:', track.label)
          } else {
            track.mode = 'disabled'
          }

          // Listen for cue changes to emit transcription data
          if (!(track as any)._cueAttached) {
            (track as any)._cueAttached = true
            track.addEventListener('cuechange', () => {
              const activeCues = track?.activeCues
              if (activeCues && activeCues?.length > 0) {
                for (let j = 0; j < activeCues?.length; j++) {
                  const cue: any = activeCues[j]
                  this.appTocService.setTranscriptionData({
                    start: cue?.startTime,
                    end: cue?.endTime,
                    text: cue?.text
                  })
                }
              }
            })
          }

        }
      }
      this.updateSubtitleButtonIcon(!!selectedTrack)
      if (selectedTrack) {
        this.setStoredSubtitlePreference(selectedTrack?.language, true, selectedTrack?.label)
      }

      const syncHTML5SubtitlePreference = () => {
        if (this.rebuildingSubtitleTracks) {
          return
        }

        let showingTrack: any = null

        for (let i = 0; i < videoTracks?.length; i++) {
          const track = videoTracks[i]
          if (track?.kind === 'subtitles' && track?.mode === 'showing') {
            showingTrack = track
            break
          }
        }

        if (showingTrack) {
          this.currentPlayerTrackLabel = showingTrack?.label
          this.currentPlayerTrackLangugage = showingTrack?.language
          this.activeTranscriptionLanguage = showingTrack?.language
          localStorage.setItem('currentPlayerTrackLabel', this.currentPlayerTrackLabel)
          this.setStoredSubtitlePreference(showingTrack?.language, true, showingTrack?.label)
          this.updateSubtitleButtonIcon(true)
        } else {
          const preference = this.getStoredSubtitlePreference()
          this.setStoredSubtitlePreference(preference?.language || this.currentPlayerTrackLangugage || null, false)
          this.updateSubtitleButtonIcon(false)
        }
      }

      const videoTracksAny = videoTracks as any
      if (!videoTracksAny._subtitlePreferenceListenerAttached) {
        if (typeof videoTracksAny?.addEventListener === 'function') {
          videoTracksAny?.addEventListener('change', syncHTML5SubtitlePreference)
        } else {
          videoTracksAny.onchange = syncHTML5SubtitlePreference
        }
        videoTracksAny._subtitlePreferenceListenerAttached = true
      }
      this.rebuildingSubtitleTracks = false
    }, 500)
  }

  loadPlayerForSafariAndOtherBrowser(initObj: any, startTime: any, endTime: any) {
    let tracks = initObj.player.textTracks()
    this.setupSubtitleTextSettingsPersistence(initObj)
    setTimeout(() => {
      const ccButton = initObj.player.controlBar.getChild('SubsCapsButton') as any
      if (ccButton) {
        if (ccButton?.menu && typeof ccButton.menu.children === 'function') {
          // ✅ Rename menu items like "Captions Off" → "Subtitles Off"
          ccButton.menu.children().forEach((item: any) => {
            const label = item.options_?.label
            // console.log('Found menu item:', label);

            if (!label) return

            let newLabel = label

            if (label.toLowerCase() === 'captions off') {
              newLabel = 'Subtitles Off'
            } else if (label.toLowerCase().includes('captions')) {
              newLabel = label.replace(/captions/gi, 'Subtitles')
            }

            // 🔧 Update both label option & DOM element text
            item.options_.label = newLabel

            // Find the actual DOM element and update its text
            const itemEl = item.el()
            const labelEl = itemEl?.querySelector('.vjs-menu-item-text')

            if (labelEl) {
              labelEl.textContent = newLabel
            }

          })
        }

        const el = ccButton.el()
        if (el) {

          const span = el.querySelector('.vjs-icon-placeholder')
          if (span) {
            // Clear any default icon classes
            span.classList.remove('vjs-icon-placeholder', 'vjs-icon-subtitles', 'vjs-icon-captions')

            // Add custom layout
            span.innerHTML = `
                <div class="custom-cc-wrapper">
                  <img src="/assets/ai-tutor/subtitle-on.svg" id="custom-cc-icon-img" class="custom-cc-icon-img" alt="icon" />
                  <span class="custom-cc-label">Subtitle</span>
                </div>
              `
          }
        }
      }
      const qualityBtn = document.querySelector('.vjs-quality-selector .vjs-menu-button')

      if (qualityBtn && this.widgetData && this.widgetData.streamingUrl) {
        qualityBtn.innerHTML = ''

        const wrapper = document.createElement('div')
        wrapper.className = 'quality-wrapper' // flex container

        const icon = document.createElement('span')
        icon.className = 'vjs-icon-placeholder'
        icon.innerHTML = '<i class="material-icons quality-icons"  title="Quality">tune</i>'

        // const text = document.createElement('span');
        // text.className = 'vjs-menu-value';
        // text.textContent = 'Quality';

        wrapper.appendChild(icon)
        // wrapper.appendChild(text);
        qualityBtn.appendChild(wrapper)
      }
    }, 100)
    this.activeTranscriptionLanguage = this.transcriptionSubscriptionData?.activeLang
    this.transcriptionLangArr = this.transcriptionSubscriptionData?.langData
    // console.log('this.transcriptionLangArr----', this.transcriptionLangArr)
    // if (Array.isArray(this.widgetData.subtitles)) {
    //   this.widgetData.subtitles.forEach((u, index) => {
    //     initObj.player.addRemoteTextTrack(
    //       {
    //         default: index === 0,
    //         kind: 'subtitles',
    //         label: this.titleCase(u.label),
    //         srclang: u.srclang,
    //         src: u.url,
    //       },
    //       false,
    //     )
    //   })
    // }
    if (this.widgetData.url) {

      // if(this.activatedRoute.snapshot.queryParams && this.activatedRoute.snapshot.queryParams.from && this.activatedRoute.snapshot.queryParams.from === 'globalSearch') {
      //   if(this.activatedRoute.snapshot.queryParams.st) {
      //     let startTime = this.activatedRoute.snapshot.queryParams.st
      //     let endTime = this.activatedRoute.snapshot.queryParams.et
      //     initObj.player.currentTime(startTime); // jump to start
      //     initObj.player.play();
      //     initObj.player.on('timeupdate',  ()=> {
      //       if (endTime && initObj.player.currentTime() >= endTime) {
      //         initObj.player.pause();
      //       }
      //     });
      //   }
      // }

      // initObj.player.src(this.viewerSvc.getCdnUrl(this.widgetData.url))
      if (this.widgetData && this.widgetData.streamingUrl) {
        initObj.player.src(this.widgetData.streamingUrl)
        //this.videoUrl = this.widgetData.streamingUrl
      } else {
        initObj.player.src(this.viewerSvc.getCdnUrl(this.widgetData.url))
        this.videoUrl = this.widgetData.url
      }


      if (startTime && endTime) {
        initObj.player.currentTime(startTime) // jump to start
        setTimeout(() => {
          // initObj.player.autoplay()
          if (this.videoTag && this.videoTag.nativeElement) {
            this.videoTag.nativeElement.muted = true
            this.videoTag.nativeElement.play()
          } else if (this.realvideoTag && this.realvideoTag.nativeElement) {
            this.realvideoTag.nativeElement.muted = true
            this.realvideoTag.nativeElement.play()
          }

        }, 0)

        // initObj.player.play();
        initObj.player.on('timeupdate', () => {
          if (endTime && initObj.player.currentTime() >= endTime) {
            initObj.player.pause()
          }
        })
      }

    }

    if (Array.isArray(this.transcriptionLangArr)) {
      this.currentPlayerTrackLabel = localStorage.getItem('currentPlayerTrackLabel') || ''
      this.currentPlayerTrackLangugage = localStorage.getItem('currentPlayerTrackLangugage') || ''
      this.currentPlayerSubtitleOff = localStorage.getItem('currentPlayerSubtitleOff') || ''
      if (this.currentPlayerSubtitleOff === 'true') {
        this.currentPlayerTrackLabel = ''
        this.currentPlayerTrackLangugage = ''
      }
      // let activeLang = this.currentPlayerTrackLangugage !== '' ? this.currentPlayerTrackLangugage?.toLowerCase() : this.transcriptionSubscriptionData?.activeLang
      const savedPreference = this.getStoredSubtitlePreference()
      const savedTrackByLabel: any = savedPreference?.label
        ? this.transcriptionLangArr.find((track: any) => {
          return track?.language?.toLowerCase() === savedPreference?.label?.toLowerCase() ||
            this.titleCase(track?.language || '')?.toLowerCase() === savedPreference?.label?.toLowerCase()
        })
        : null

      let activeLang = savedPreference?.language || savedTrackByLabel?.label || ''

      const selectedLang = activeLang || this.currentPlayerTrackLangugage?.toLowerCase()

      const sortedTracks = [...this.transcriptionLangArr].sort((a: any, b: any) => {
        if (a.label.toLowerCase() === selectedLang) return -1
        if (b.label.toLowerCase() === selectedLang) return 1
        return 0
      })
      this.rebuildingSubtitleTracks = true
      // Remove any previously registered remote tracks to prevent duplicate subtitle rendering
      const existingRemoteTracks: any = initObj?.player?.remoteTextTracks()
      for (let j = existingRemoteTracks?.length - 1; j >= 0; j--) {
        initObj?.player?.removeRemoteTextTrack(existingRemoteTracks[j])
      }
      sortedTracks.forEach((track: any) => {
        initObj.player.addRemoteTextTrack(
          {
            kind: 'subtitles',
            src: track?.uri,
            srclang: track?.label?.toLowerCase(),
            label: this.titleCase(track?.language),
            default:
              savedPreference?.enabled === true &&
              track?.label?.toLowerCase() ===
              activeLang?.toLowerCase()
          },
          false
        )

      })
      this.scheduleStoredSubtitlePreferenceApply(initObj)
      initObj.player.one('loadedmetadata', () => this.scheduleStoredSubtitlePreferenceApply(initObj))
      initObj.player.one('loadeddata', () => this.scheduleStoredSubtitlePreferenceApply(initObj))
      initObj.player.one('canplay', () => this.scheduleStoredSubtitlePreferenceApply(initObj))

      if (savedPreference?.enabled === true && this.currentPlayerTrackLangugage !== '') {
        this.updateSubtitleButtonIcon(true)
      } else {
        setTimeout(() => {
          this.updateSubtitleButtonIcon(false)
        }, 100)

      }
      // Attach cuechange to current tracks on every call so newly added remote tracks
      // always get listeners — this MUST run before the early-return guard below.
      //let allCues:any = []
      for (let i = 0; i < tracks?.length; i++) {
        const track = tracks[i]
        // console.log(tracks[i].label, tracks[i]);

        if (track?.kind === 'subtitles' || track?.kind === 'metadata') {
          if (track?.kind === 'metadata') {
            track.mode = track?.language === this.activeTranscriptionLanguage ? 'hidden' : 'disabled'
          }
          if (!(track as any)?._cueAttached) {
            ; (track as any)._cueAttached = true
            track.addEventListener('cuechange', () => {
              const activeCues = track?.activeCues

              if (activeCues && activeCues?.length > 0) {
                for (let j = 0; j < activeCues?.length; j++) {
                  const cue: any = activeCues[j]


                  this.appTocService.setTranscriptionData({
                    start: cue?.startTime,
                    end: cue?.endTime,
                    text: cue?.text
                  })

                }
              }
            })
          }
        }
      }

      if (this.textTrackChangeListenerAdded) {
        return
      }
      this.textTrackChangeListenerAdded = true
      initObj?.player?.on('texttrackchange', () => {
        if (this.applyingStoredSubtitlePreference || this.rebuildingSubtitleTracks) {
          return
        }

        const currentTracks = initObj?.player?.textTracks()
        let showingTrack: any = null
        for (let i = 0; i < currentTracks?.length; i++) {
          const track = currentTracks[i]
          if (
            track &&
            (track?.kind === 'subtitles' || track?.kind === 'captions') &&
            track?.mode === 'showing'
          ) {
            showingTrack = track
            break
          }
        }

        if (showingTrack) {
          const currentLang = showingTrack?.language
          this.currentPlayerTrackLabel = showingTrack?.label
          this.currentPlayerTrackLangugage = currentLang
          localStorage.setItem('currentPlayerTrackLabel', this.currentPlayerTrackLabel)
          this.activateSubtitle(currentLang)

          if (currentLang !== this.previousSubtitleLanguage) {
            this.previousSubtitleLanguage = currentLang
            this.activeTranscriptionLanguage = currentLang
            this.appTocService.setActiveSubtitleLanguage(currentLang)
          }

          this.updateSubtitleButtonIcon(true)
        } else {
          const preference = this.getStoredSubtitlePreference()
          this.previousSubtitleLanguage = ''
          this.setStoredSubtitlePreference(preference?.language || this.currentPlayerTrackLangugage || null, false)
          this.updateSubtitleButtonIcon(false)
        }
      })
    }
  }
}
