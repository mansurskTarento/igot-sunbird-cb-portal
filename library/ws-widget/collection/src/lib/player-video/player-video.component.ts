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
      if (startTime && endTime) {
        const player = this.playerInitObj.player

        player.currentTime(startTime) // Jump to star
        this.playerInitObj.player.currentTime(startTime) // jump to start
        // setTimeout(()=>{
        // initObj.player.autoplay()
        if (this.videoTag && this.videoTag.nativeElement) {
          this.videoTag.nativeElement.muted = false
          this.videoTag.nativeElement.play()
        } else if (this.realvideoTag && this.realvideoTag.nativeElement) {
          this.realvideoTag.nativeElement.muted = false
          this.realvideoTag.nativeElement.play()
        }

        // },1000)
        // initObj.player.play();
        this.playerInitObj.player.on('timeupdate', () => {
          // console.log('this.playerInitObj.player.currentTime()',this.playerInitObj.player.currentTime())
          // console.log('endTime',endTime)
          if (endTime && parseInt(this.playerInitObj.player.currentTime()) >= parseInt(endTime)) {
            this.playerInitObj.player.pause()
            setTimeout(() => {
              endTime = player.duration()
            }, 0)

          }
        })
        // player.on('play', () => {
        //   const current = player.currentTime();
        //   if (current >= endTime && lastPlayedTime < endTime) {
        //     player.currentTime(lastPlayedTime);
        //   }

        // });
      }


    })

  }

  // forward=()=>{
  //   this.skip(15);
  // }

  // backward=()=>{
  //    this.skip(-15);
  // }

  // skip(time:any) {
  //   this.video.currentTime=this.video.currentTime+time;
  // }

  async ngAfterViewInit() {
    console.log('DEBUG: ngAfterViewInit called')
    console.log('DEBUG: this.widgetData.isVideojs?', this.widgetData?.isVideojs)
    console.log('DEBUG: this.playerInitObj exists?', !!this.playerInitObj)
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
            // console.log('data--', data)
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
                      track.mode = 'disabled' // prevent multiple from showing
                    }



                    track.addEventListener('cuechange', () => {
                      const activeCues = track.activeCues

                      if (activeCues && activeCues.length > 0) {
                        for (let j = 0; j < activeCues.length; j++) {
                          const cue: any = activeCues[j]

                          // Log or store cue
                          // allCues.push({
                          //   start: cue.startTime,
                          //   end: cue.endTime,
                          //   text: cue?.text
                          // });
                          // console.log(cue)
                          this.appTocService.setTranscriptionData({
                            start: cue.startTime,
                            end: cue.endTime,
                            text: cue?.text
                          })

                          // Show in browser
                          // const entry = document.createElement('div');
                          // entry.textContent = `Cue: [${cue.startTime.toFixed(1)}s - ${cue.endTime.toFixed(1)}s] → ${cue.text}`;
                          // cueLog.appendChild(entry);
                        }
                        //console.log('cue', allCues)
                      }
                    })
                  }
                }
              }
            }

          } else {
            this.initializePlayer()
          }
        })
      } else {
        console.log('DEBUG: Setting up HTML5 player with transcription subscription')
        this.initializeVPlayer()

        // Subscribe to transcription language changes for HTML5 player
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

    const videoTag: any = document.getElementsByTagName('video')[0]
    if (videoTag) {
      videoTag.onended = () => {
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
            if (videoTag) {
              videoTag.style.filter = 'blur(0px)'
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
    }


  }

  clearTimeInterval() {
    clearInterval(this.timerInterval)
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

    if (this.changeTranscriptionLanguageEventSubscription) {
      this.changeTranscriptionLanguageEventSubscription.unsubscribe()
    }
    if (this.playTranscriptionVideoSubscription) {
      this.playTranscriptionVideoSubscription.unsubscribe()
    }



  }
  private initializeVPlayer() {
    console.log('DEBUG: initializeVPlayer() called - using NON-videojs player')
    // alert()
    // let playerInstance:any = this.player;
    // if(playerInstance) {
    //   var skipBehindButton = playerInstance.controlBar.addChild("button");
    //   var skipBehindButtonDom = skipBehindButton.el();
    //   skipBehindButtonDom.innerHTML = "30<<";
    //   skipBehindButton.addClass("buttonClass");

    //   // skipBehindButtonDom.onclick = function(){
    //   //     skipS3MV(-30);
    //   // }
    //   console.log("playerInstance.controlBar",playerInstance.controlBar);
    // }

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
  }

  private setupHTML5Subtitles() {
    console.log('DEBUG: setupHTML5Subtitles() called')
    if (!this.realvideoTag || !this.transcriptionLangArr || !Array.isArray(this.transcriptionLangArr)) {
      console.log('DEBUG: Missing video element or transcription data')
      return
    }

    const videoElement = this.realvideoTag.nativeElement as HTMLVideoElement

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
      if (lang.label.toLowerCase() === this.activeTranscriptionLanguage.toLowerCase()) {
        trackElement.default = true
      }

      videoElement.appendChild(trackElement)
      console.log('DEBUG: Added subtitle track:', trackElement.label)
    })

    // Listen for subtitle track changes
    setTimeout(() => {
      const videoTracks = videoElement.textTracks

      for (let i = 0; i < videoTracks.length; i++) {
        const track = videoTracks[i]

        // Set track mode based on active language
        if (track.kind === 'subtitles') {
          if (track.language.toLowerCase() === this.activeTranscriptionLanguage.toLowerCase()) {
            track.mode = 'showing'
            console.log('DEBUG: Set track to showing:', track.label)
          } else {
            track.mode = 'hidden'
          }

          // Listen for cue changes to emit transcription data
          track.addEventListener('cuechange', () => {
            const activeCues = track.activeCues
            if (activeCues && activeCues.length > 0) {
              for (let j = 0; j < activeCues.length; j++) {
                const cue: any = activeCues[j]
                this.appTocService.setTranscriptionData({
                  start: cue.startTime,
                  end: cue.endTime,
                  text: cue?.text
                })
              }
            }
          })
        }
      }
    }, 500)

    // Update subtitle button
    this.updateSubtitleButtonIcon(true)
  }

  private initializePlayer() {
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
            // resourceId: data.resourceId,
            // dateAccessed: Date.now(),
            // data: JSON.stringify({
            //   progress: data.progress,
            //   timestamp: Date.now(),
            // }),
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

    let initObj: any
    try {
      console.log('DEBUG: About to call videoJsInitializer with videoTag:', this.videoTag?.nativeElement)
      initObj = videoJsInitializer(
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
      console.log('DEBUG: videoJsInitializer returned:', initObj)
      console.log('DEBUG: initObj.player:', initObj?.player)
    } catch (error) {
      console.error('DEBUG: ERROR in videoJsInitializer:', error)
      return
    }
    this.playerInitObj = initObj
    this.player = initObj.player

    this.dispose = initObj.dispose

    // Function to initialize subtitles and customize controls
    const initializeSubtitlesAndControls = () => {
      initObj.player.textTracks()
      // Wait longer for the UI to be fully ready, especially in Safari
      setTimeout(() => {
        try {
          const ccButton = initObj.player.controlBar.getChild('SubsCapsButton') as any
          if (ccButton) {
            // Ensure menu is closed before customization
            if (ccButton.menu) {
              ccButton.closeMenu()
            }

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
                // span.classList.remove('vjs-icon-placeholder', 'vjs-icon-subtitles', 'vjs-icon-captions')

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
        } catch (error) {
          console.error('Error customizing subtitle button:', error)
        }

        try {
          // Close quality menu if it's open
          const qualitySelector = initObj.player.controlBar.getChild('QualitySelector') as any
          if (qualitySelector && qualitySelector.menu) {
            qualitySelector.closeMenu()
          }

          const qualityBtn = document.querySelector('.vjs-quality-selector .vjs-menu-button')

          if (qualityBtn && this.widgetData && this.widgetData.streamingUrl) {
            qualityBtn.innerHTML = ''

            const wrapper = document.createElement('div')
            wrapper.className = 'quality-wrapper' // flex container

            const icon = document.createElement('span')
            icon.className = 'vjs-icon-placeholder'
            icon.innerHTML = '<i class="material-icons quality-icons"  title="Quality">tune</i>'

            wrapper.appendChild(icon)
            qualityBtn.appendChild(wrapper)
          }
        } catch (error) {
          console.error('Error customizing quality button:', error)
        }

        // Close playback rate menu if open
        try {
          const playbackRateButton = initObj.player.controlBar.getChild('PlaybackRateMenuButton') as any
          if (playbackRateButton && playbackRateButton.menu) {
            playbackRateButton.closeMenu()
          }
        } catch (error) {
          console.error('Error closing playback rate menu:', error)
        }
      }, 300)

      this.activeTranscriptionLanguage = this.transcriptionSubscriptionData?.activeLang
      this.transcriptionLangArr = this.transcriptionSubscriptionData?.langData

      if (this.widgetData.url) {
        if (this.widgetData && this.widgetData.streamingUrl) {
          initObj.player.src(this.widgetData.streamingUrl)
        } else {
          initObj.player.src(this.viewerSvc.getCdnUrl(this.widgetData.url))
          this.videoUrl = this.widgetData.url
        }

        let startTime = 0
        let endTime = 0
        if (this.activatedRoute.snapshot.queryParams && this.activatedRoute.snapshot.queryParams.from && this.activatedRoute.snapshot.queryParams.from === 'globalSearch') {
          if (this.activatedRoute.snapshot.queryParams.st) {
            startTime = this.activatedRoute.snapshot.queryParams.st
            endTime = this.activatedRoute.snapshot.queryParams.et
          }
        }

        if (startTime && endTime) {
          initObj.player.currentTime(startTime)
          setTimeout(() => {
            if (this.videoTag && this.videoTag.nativeElement) {
              this.videoTag.nativeElement.muted = true
              this.videoTag.nativeElement.play()
            } else if (this.realvideoTag && this.realvideoTag.nativeElement) {
              this.realvideoTag.nativeElement.muted = true
              this.realvideoTag.nativeElement.play()
            }
          }, 0)

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
          localStorage.removeItem('currentPlayerTrackLabel')
          localStorage.removeItem('currentPlayerTrackLangugage')
        }

        const selectedLang = this.currentPlayerTrackLangugage?.toLowerCase()

        const sortedTracks = [...this.transcriptionLangArr].sort((a: any, b: any) => {
          if (a.label.toLowerCase() === selectedLang) return -1
          if (b.label.toLowerCase() === selectedLang) return 1
          return 0
        })

        // Add all language tracks via player API
        sortedTracks.forEach((track: any) => {
          const isDefault =
            track.label.toLowerCase() === this.currentPlayerTrackLangugage?.toLowerCase()
          initObj.player.addRemoteTextTrack({
            kind: 'subtitles',
            src: track.uri,
            srclang: track.label.toLowerCase(),
            label: this.titleCase(track.language),
            default: isDefault
          }, false)
        })

        // Set initial subtitle visibility after a brief delay for Safari
        setTimeout(() => {
          const videoEl = initObj.player.el().getElementsByTagName('video')[0]
          const videoTracks = videoEl.textTracks

          for (let i = 0; i < videoTracks.length; i++) {
            const track = videoTracks[i]
            if (track.kind === 'subtitles' || track.kind === 'metadata') {
              if (track.language.toLowerCase() === this.activeTranscriptionLanguage.toLowerCase()) {
                track.mode = 'showing'
              } else {
                track.mode = 'disabled'
              }
            }
          }

          if (this.currentPlayerTrackLangugage !== '') {
            this.updateSubtitleButtonIcon(true)
          } else {
            this.updateSubtitleButtonIcon(false)
          }
        }, 200)

        initObj.player.on('texttrackchange', () => {
          const videoEl = initObj.player.el().getElementsByTagName('video')[0]
          const videoTracks = videoEl.textTracks

          for (let i = 0; i < videoTracks.length; i++) {
            const track = videoTracks[i]

            if (track.mode === 'showing') {
              localStorage.removeItem('currentPlayerSubtitleOff')
              let currentLang = track.language
              if (this.currentPlayerTrackLangugage) {
                if (currentLang !== this.currentPlayerTrackLangugage) {
                  this.currentPlayerTrackLabel = track.label
                  this.currentPlayerTrackLangugage = track.language
                  currentLang = track.language
                  localStorage.setItem('currentPlayerTrackLabel', this.currentPlayerTrackLabel)
                  localStorage.setItem('currentPlayerTrackLangugage', this.currentPlayerTrackLangugage)
                } else {
                  currentLang = this.currentPlayerTrackLangugage
                }
              } else {
                this.currentPlayerTrackLabel = track.label
                this.currentPlayerTrackLangugage = track.language
                currentLang = track.language
                localStorage.setItem('currentPlayerTrackLabel', this.currentPlayerTrackLabel)
                localStorage.setItem('currentPlayerTrackLangugage', this.currentPlayerTrackLangugage)
              }

              if (currentLang !== this.previousSubtitleLanguage) {
                this.previousSubtitleLanguage = currentLang
                this.activeTranscriptionLanguage = currentLang

                const newTrack: any = this.transcriptionLangArr.find((t: any) => {
                  return t.label.toLowerCase() === currentLang.toLowerCase()
                })

                if (newTrack) {
                  this.replaceSubtitleTrack(newTrack)
                }

                this.appTocService.setActiveSubtitleLanguage(currentLang)
              }

              if (localStorage.getItem('currentPlayerTrackLangugage') !== '') {
                localStorage.removeItem('currentPlayerSubtitleOff')
                this.updateSubtitleButtonIcon(true)
              } else {
                this.updateSubtitleButtonIcon(false)
              }
              break
            } else {
              this.previousSubtitleLanguage = ''
              localStorage.setItem('currentPlayerSubtitleOff', 'true')
              this.updateSubtitleButtonIcon(false)
            }
          }
        })

        const videoEl = initObj.player.el().getElementsByTagName('video')[0]
        const videoTextTracks = videoEl.textTracks
        for (let i = 0; i < videoTextTracks.length; i++) {
          const track = videoTextTracks[i]

          if (track.kind === 'subtitles' || track.kind === 'metadata') {
            if (track.language === this.activeTranscriptionLanguage) {
              track.mode = 'showing'
            } else {
              track.mode = 'disabled'
            }

            track.addEventListener('cuechange', () => {
              const activeCues = track.activeCues

              if (activeCues && activeCues.length > 0) {
                for (let j = 0; j < activeCues.length; j++) {
                  const cue: any = activeCues[j]

                  this.appTocService.setTranscriptionData({
                    start: cue.startTime,
                    end: cue.endTime,
                    text: cue?.text
                  })
                }
              }
            })
          }
        }
      }
    }

    // DEBUG: Check if player is available
    console.log('DEBUG: initObj.player exists?', !!initObj.player, initObj.player)

    // Register ready event handler (works in Chrome)
    try {
      console.log('DEBUG: Attempting to register ready() handler')
      initObj.player.ready(() => {
        console.log('Player ready event fired, initializing subtitles')
        initializeSubtitlesAndControls()
      })
      console.log('DEBUG: ready() handler registered successfully')
    } catch (error) {
      console.error('DEBUG: Error registering ready() handler:', error)
    }

    // Fallback for Safari - ready event doesn't always fire, so use timing fallback
    console.log('DEBUG: Setting up 500ms timeout fallback')
    setTimeout(() => {
      console.log('Timeout fallback: ensuring subtitles are initialized (Safari compatibility)')
      try {
        initializeSubtitlesAndControls()
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

  replaceSubtitleTrack(newTrack: any) {
    const videoEl = this.playerInitObj.player.el().getElementsByTagName('video')[0]
    const videoTracks = videoEl.textTracks

    // Simply toggle track visibility - all tracks are already loaded
    for (let i = 0; i < videoTracks.length; i++) {
      const track = videoTracks[i]
      if (track.kind === 'subtitles' || track.kind === 'metadata') {
        if (track.language.toLowerCase() === newTrack.label.toLowerCase()) {
          track.mode = 'showing'

          // Attach cuechange listener if not already attached
          if (!track.cuechangeListenerAttached) {
            track.addEventListener('cuechange', () => {
              const activeCues = track.activeCues
              if (activeCues && activeCues.length > 0) {
                for (let j = 0; j < activeCues.length; j++) {
                  const cue: any = activeCues[j]
                  this.appTocService.setTranscriptionData({
                    start: cue.startTime,
                    end: cue.endTime,
                    text: cue?.text
                  })
                }
              }
            })
            track.cuechangeListenerAttached = true
          }
        } else {
          track.mode = 'hidden'
        }
      }
    }
  }

  updateSubtitleButtonIcon(subtitlesOn: boolean) {

    let subtitleImage = document.getElementById('custom-cc-icon-img') as HTMLImageElement

    if (subtitleImage) {
      subtitleImage.src = subtitlesOn ? "/assets/ai-tutor/subtitle-on.svg" : "/assets/ai-tutor/subtitle-off.svg"
    }

    if (!subtitlesOn) {
      const videoEl = this.playerInitObj.player.el().getElementsByTagName('video')[0]
      let tracks = videoEl.textTracks
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i]
        if (t.kind === 'subtitles') {
          // Toggle and force reflow if needed
          if (t.mode === 'showing') {
            t.mode = 'hidden'
          }
        }

        // console.log(`Track [${i}]: kind=${t.kind}, language=${t.language}, cues?`, t.cues, t.cues?.length);
      }
    }
  }

}