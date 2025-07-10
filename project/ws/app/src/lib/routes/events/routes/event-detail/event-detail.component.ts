import { Component, OnInit, ElementRef, ViewChild } from '@angular/core'
// import { NSDiscussData } from '../../../discuss/models/discuss.model'
import { ActivatedRoute } from '@angular/router'
// import { MatSnackBar } from '@angular/material/legacy-snack-bar'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
// import { DiscussService } from '../../../discuss/services/discuss.service'
/* tslint:disable */
import _ from 'lodash'
import moment from 'moment'
import * as fileSaver from 'file-saver'
import { environment } from 'src/environments/environment'
import { EventService } from '../../services/events.service'
import { TranslateService } from '@ngx-translate/core'
import { MultilingualTranslationsService, ConfigurationsService } from '@sunbird-cb/utils-v2'
import { NsDiscussionV2 } from '@sunbird-cb/discussion-v2'
//import { CertificateDialogComponent } from './../../../../../../../../../library/ws-widget/collection/src/lib/_common/certificate-dialog/certificate-dialog.component'
import { CertificateDialogComponent } from './../../../../../../../../../library/ws-widget/collection/src/lib/_common/certificate-dialog/certificate-dialog.component'
import { WidgetContentLibService } from '@sunbird-cb/consumption'
import { NsContentStripWithTabs } from '@sunbird-cb/collection/src/lib/content-strip-with-tabs/content-strip-with-tabs.model'
import { NsContent } from '@sunbird-cb/collection/src/public-api'
import { NetCoreService } from '../../../../../../../../../src/app/services/netcore.service'
/* tslint:enable */

@Component({
  selector: 'ws-app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  @ViewChild('toastSuccess', { static: true }) toastSuccess!: ElementRef<any>
  @ViewChild('toastError', { static: true }) toastError!: ElementRef<any>
  // data!: NSDiscussData.IDiscussionData
  similarPosts!: any
  defaultError = 'Something went wrong, Please try again after sometime!'
  eventId!: any
  fetchSingleCategoryLoader = false
  eventData: any
  currentEvent = false
  pastEvent = false
  // fetchNewData = false
  showYouTubeVideoFlag = false
  enrollFlowItems: any = []
  // playerVars = {
  //   cc_lang_pref: 'en',
  // };
  // private player: YT.Player | any
  public ytEvent: any
  version: any = '...'
  skeletonLoader = false
  enrolledEvent: any
  batchId = ''
  isEnrolled = false
  isretired = true
  downloadCertificateBool = false
  pageData!: any
  discussWidgetData!: NsDiscussionV2.ICommentWidgetData
  competenciesObject: any = []
  competencySelected = ''
  compentencyKey!: NsContent.ICompentencyKeys
  strip: NsContentStripWithTabs.IContentStripUnit = {
    key: 'blendedPrograms',
    logo: '',
    title: 'Blended Program',
    stripTitleLink: {
      link: '',
      icon: '',
    },
    sliderConfig: {
      showNavs: true,
      showDots: false,
    },
    loader: true,
    stripBackground: '',
    titleDescription: 'Blended Program',
    stripConfig: {
      cardSubType: 'standard',
    },
    viewMoreUrl: {
      path: '',
      viewMoreText: 'Show all',
      queryParams: '',
    },
    tabs: [],
    filters: [],
  }

  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private eventSvc: EventService,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private configSvc: ConfigurationsService,
    private contentSvc: WidgetContentLibService,
    // private discussService: DiscussService,
    private snackBar: MatSnackBar,
    private netCoreService: NetCoreService
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
    this.langtranslations.languageSelectedObservable.subscribe(() => {
      if (localStorage.getItem('websiteLanguage')) {
        this.translate.setDefaultLang('en')
        const lang = localStorage.getItem('websiteLanguage')!
        this.translate.use(lang)
      }
    })

  }

  get isenrollFlow() {
    if (this.eventData && this.enrollFlowItems && this.enrollFlowItems.length) {
      return this.eventData.resourceType && this.enrollFlowItems.includes(this.eventData.resourceType)
    } return false
  }

  ngOnInit() {
    this.skeletonLoader = true
    this.compentencyKey = this.configSvc.compentency[environment.compentencyVersionKey]
    this.route.params.subscribe(params => {
      this.eventId = params.eventId
      // if (this.fetchNewData) {
      //   this.getTIDData()
      // }
      // this.data = this.route.snapshot.data.topic.data
    })
    this.eventSvc.getEventData(this.eventId).subscribe((data: any) => {
      this.eventData = data.result.event
      this.isretired = this.eventData?.status?.toLowerCase() !== 'live'
      this.eventSvc.eventData = data.result.event
      if (this.eventData && typeof this.eventData.batches === 'string') {
        this.eventData.batches = JSON.parse(this.eventData.batches)
      }
      if (Array.isArray(this.eventData.batches) && this.eventData.batches.length > 0) {
        this.batchId = this.eventData.batches[0].batchId || ''
      }
      if (this.eventData.competencies_v6) {
        this.loadCompetencies()
      }
      /* tslint:disable */
      console.log(this.eventSvc)
      /* tslint:enable */
      const creatordata = this.eventData.creatorDetails
      const str = creatordata.replace(/\\/g, '')
      if (str.length > 0) {
        this.eventData.creatorDetails = JSON.parse(str)
      }
      const eventDate = this.customDateFormat(this.eventData.startDate, this.eventData.startTime)
      const eventendDate = this.customDateFormat(this.eventData.endDate, this.eventData.endTime)
      // const isToday = this.compareDate(eventDate, eventendDate, this.eventData)
      // if (isToday) {
      //   this.currentEvent = true
      // }
      const sDate = this.customDateFormat(this.eventData.startDate, this.eventData.startTime)
      const eDate = this.customDateFormat(this.eventData.endDate, this.eventData.endTime)
      const msDate = Math.floor(moment(sDate).valueOf() / 1000)
      const meDate = Math.floor(moment(eDate).valueOf() / 1000)
      const cDate = Math.floor(moment(new Date()).valueOf() / 1000)
      if (cDate >= msDate && cDate <= meDate) {
        this.currentEvent = true
      }
      const now = new Date()
      const today = moment(now).format('YYYY-MM-DD HH:mm')

      if (eventDate < today && eventendDate < today) {
        this.pastEvent = true
      }
      this.pageData = (this.route.parent && this.route.parent.snapshot.data.pageData.data) || {}
      this.enrollFlowItems = this.pageData.enrollFlowItems
      if (this.isenrollFlow) {
        this.getUserIsEnrolled()
      } else {

        this.discussWidgetData = (this.route.parent && this.route.parent.snapshot.data.pageData.data.discussWidgetData) || []
        this.pageData = (this.route.parent && this.route.parent.snapshot.data.pageData.data) || {}
        if (this.discussWidgetData) {
          if (this.eventData && this.eventData.identifier) {
            this.discussWidgetData.newCommentSection.commentTreeData.entityId = this.eventData.identifier

            if (this.discussWidgetData.commentsList.repliesSection && this.discussWidgetData.commentsList.repliesSection.newCommentReply) {
              this.discussWidgetData.commentsList.repliesSection.newCommentReply.commentTreeData.entityId = this.eventData.identifier
            }
          }
          this.discussWidgetData.enrolledContent = true
          this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Start a discussion'

          this.discussWidgetData = { ...this.discussWidgetData }
        }
      }
      this.skeletonLoader = false
    })

  }

  getUserIsEnrolled() {
    let userId = ''
    if (this.configSvc.userProfile) {
      userId = this.configSvc.userProfile.userId || ''
    }
    this.discussWidgetData = (this.route.parent && this.route.parent.snapshot.data.pageData.data.discussWidgetData) || []

    if (this.discussWidgetData) {
      if (this.eventData && this.eventData.identifier) {
        this.discussWidgetData.newCommentSection.commentTreeData.entityId = this.eventData.identifier

        if (this.discussWidgetData.commentsList.repliesSection && this.discussWidgetData.commentsList.repliesSection.newCommentReply) {
          this.discussWidgetData.commentsList.repliesSection.newCommentReply.commentTreeData.entityId = this.eventData.identifier
        }
      }


    }
    if (this.eventData && userId) {
      this.eventSvc.getIsEnrolled(userId, this.eventData.identifier, this.batchId).subscribe((data: any) => {
        /* tslint:disable */
        this.contentViewEventForNetCore('view')
        if (data && data.result && data.result.events && data.result.events.length > 0) {
          this.enrolledEvent = data.result.events.find((d: any) => d.contentId === this.eventData.identifier)
          this.enrolledEvent = { ...this.enrolledEvent }
          if (this.enrolledEvent
            && this.enrolledEvent.issuedCertificates
            && this.enrolledEvent.issuedCertificates.length) {
            const certId = this.enrolledEvent.issuedCertificates[0].identifier
            this.enrolledEvent['certificateObj'] = {
              certData: '',
              certId: certId,
            }
          }
          if (this.enrolledEvent && this.enrolledEvent.completionPercentage) {
            this.enrolledEvent['completionPercentage'] = Math.round(this.enrolledEvent.completionPercentage).toFixed(0)
            if(this.enrolledEvent && this.enrolledEvent.status === 2) {
              this.contentViewEventForNetCore('complete')
            }
          }

          this.discussWidgetData.enrolledContent = true
          this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Start a discussion'


        } else {
          this.discussWidgetData.enrolledContent = false
          this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Enrol to add your comments'
        }
        this.discussWidgetData = { ...this.discussWidgetData }
      })
    }
  }

  customDateFormat(date: any, time: any) {
    const stime = time.split('+')[0]
    const hour = stime.substr(0, 2)
    const min = stime.substr(2, 3)
    return `${date} ${hour}${min}`
  }

  compareDate(selectedStartDate: any, selectedEndDate: any, eventData: any) {
    const now = new Date()
    const today = moment(now).format('YYYY-MM-DD HH:mm')

    const day = new Date().getDate()
    const year = new Date().getFullYear()
    // tslint:disable-next-line:prefer-template
    const month = ('0' + (now.getMonth() + 1)).slice(-2)
    const todaysdate = `${year}-${month}-${day}`

    const stime = eventData.startTime.split('+')[0]
    const shour = stime.substr(0, 2) * 60
    const smin = stime.substr(3, 2) * 1
    const starttime = shour + smin

    const currentTime = new Date().getHours() * 60 + new Date().getMinutes()
    const minustime = starttime - currentTime
    if (eventData.startDate === todaysdate && minustime < 16 && (selectedStartDate > today || selectedEndDate < today)) {
      return true
    }
    return false
  }

  // fetchSingleCategoryDetails(cid: number) {
  // this.fetchSingleCategoryLoader = true
  // this.discussService.fetchSingleCategoryDetails(cid).subscribe(
  //   (data: NSDiscussData.ICategoryData) => {
  //     this.similarPosts = data.topics
  //     this.fetchSingleCategoryLoader = false
  //   },
  //   (err: any) => {
  //     this.openSnackbar(err.error.message.split('|')[1] || this.defaultError)
  //     this.fetchSingleCategoryLoader = false
  //   })
  // }

  // private openSnackbar(primaryMsg: string, duration: number = 5000) {
  //   this.snackBar.open(primaryMsg, 'X', {
  //     duration,
  //   })
  // }

  onStateChange(event: any) {
    this.ytEvent = event.data
  }
  // savePlayer(player: any) {
  //   this.player = player
  // }

  // playVideo() {
  //   this.player.playVideo()
  // }

  // pauseVideo() {
  //   this.player.pauseVideo()
  // }

  handleOpenCertificateDialog() {
    this.downloadCertificateBool = true
    const certId = this.enrolledEvent && this.enrolledEvent.certificateObj.certId
    if (this.enrolledEvent && this.enrolledEvent.certificateObj && !this.enrolledEvent.certificateObj.certData) {
      this.contentSvc.downloadCert(certId).subscribe(response => {
        if (this.enrolledEvent) {
          this.downloadCertificateBool = false
          this.enrolledEvent['certificateObj']['certData'] = response.result.printUri
          this.dialog.open(CertificateDialogComponent, {
            width: '1200px',
            data: { cet: response.result.printUri, certId: this.enrolledEvent && this.enrolledEvent.certificateObj.certId },
          })
        }
      }, (_error: any) => {
        this.downloadCertificateBool = false
        // this.loggerService.error('CERTIFICATE FETCH ERROR >', error)
        this.snackBar.open('Unable to View Certificate, due to some error!')
      })
    } else {
      this.downloadCertificateBool = false
      this.dialog.open(CertificateDialogComponent, {
        width: '1200px',
        data: { cet: this.enrolledEvent && this.enrolledEvent.certificateObj.certData, certId: this.enrolledEvent && this.enrolledEvent.certificateObj.certId },
      })
    }
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateActualLabel(label, type, '')
  }

  enrollEvent(event: any) {
    this.isEnrolled = event
    if (this.discussWidgetData) {
      this.discussWidgetData.enrolledContent = this.isEnrolled
      this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Start a discussion'
      this.discussWidgetData = { ...this.discussWidgetData }
    }
  }

  fileImage(name: string) {
    return name.includes('.ppt') ? '/assets/icons/ppt.svg' :
      (name.includes('.doc') ? '/assets/icons/doc.svg' : '/assets/icons/pdf.svg')
  }

  genrateMaterialName(url: string) {
    let name = ''
    if (url) {
      const urlSplit = url.split('_')
      if (urlSplit.length > 0) {
        name = urlSplit[urlSplit.length - 1]
      }
    }
    return name
  }

  downloadPDF(handout: any) {
    fileSaver.saveAs(handout.content, handout.title)
  }

  checkValidJSON(str: any) {
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  loadCompetencies(): void {
    if (this.eventData && this.eventData[this.compentencyKey.vKey] && this.eventData[this.compentencyKey.vKey].length) {
      const competenciesObject: any = {}
      if (typeof this.eventData[this.compentencyKey.vKey] === 'string'
        && this.checkValidJSON(this.eventData[this.compentencyKey.vKey])) {
        this.eventData[this.compentencyKey.vKey] = JSON.parse(this.eventData[this.compentencyKey.vKey])
      }
      this.eventData[this.compentencyKey.vKey].forEach((_obj: any) => {
        if (competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]) {
          if (competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
          [_obj[this.compentencyKey.vCompetencyTheme]]) {
            const competencyTheme = competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
            [_obj[this.compentencyKey.vCompetencyTheme]]
            if (competencyTheme.indexOf(_obj[this.compentencyKey.vCompetencySubTheme]) === -1) {
              competencyTheme.push(_obj[this.compentencyKey.vCompetencySubTheme])
            }
          } else {
            competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
            [_obj[this.compentencyKey.vCompetencyTheme]] = []
            competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
            [_obj[this.compentencyKey.vCompetencyTheme]]
              .push(_obj[this.compentencyKey.vCompetencySubTheme])
          }
        } else {
          competenciesObject[_obj[this.compentencyKey.vCompetencyArea]] = {}
          competenciesObject[_obj[this.compentencyKey.vCompetencyArea]][_obj[this.compentencyKey.vCompetencyTheme]] = []
          competenciesObject[_obj[this.compentencyKey.vCompetencyArea]][_obj[this.compentencyKey.vCompetencyTheme]]
            .push(_obj[this.compentencyKey.vCompetencySubTheme])
        }
      })

      for (const key in competenciesObject) {
        if (competenciesObject.hasOwnProperty(key)) {
          const _temp: any = {}
          _temp['key'] = key
          _temp['value'] = competenciesObject[key]
          this.competenciesObject.push(_temp)
        }
      }
      this.handleShowCompetencies(this.competenciesObject[0])
    }
  }

  handleShowCompetencies(item: any): void {
    this.competencySelected = item.key
    const valueObj = item.value
    const competencyArray = []
    for (const key in valueObj) {
      if (valueObj.hasOwnProperty(key)) {
        const _tempObj: any = {}
        _tempObj['key'] = key
        _tempObj['value'] = valueObj[key]
        competencyArray.push(_tempObj)
      }
    }

    this.strip['loaderWidgets'] = this.transformCompetenciesToWidget(this.competencySelected, competencyArray, this.strip)
  }

  private transformCompetenciesToWidget(
    competencyArea: string,
    competencyArrObject: any,
    strip: NsContentStripWithTabs.IContentStripUnit) {
    return (competencyArrObject || []).map((content: any, idx: number) => (
      content ? {
        widgetType: 'card',
        widgetSubType: 'competencyCard',
        widgetHostClass: 'mr-4',
        widgetData: {
          content,
          competencyArea,
          cardCustomeClass: strip.customeClass ? strip.customeClass : '',
          context: { pageSection: strip.key, position: idx },
        },
      } : {
        widgetType: 'card',
        widgetSubType: 'competencyCard',
        widgetHostClass: 'mr-4',
        widgetData: {},
      }
    ))
  }
    contentViewEventForNetCore(eventType:any) {
      if (this.configSvc.netcoreConfig && this.configSvc.netcoreConfig.netcoreWebConfig  // NOSONAR
        && this.configSvc.netcoreConfig.netcoreWebConfig.isActive // NOSONAR
        && this.configSvc.netcoreConfig.netcoreWebConfig.events // NOSONAR
        && this.configSvc.netcoreConfig.netcoreWebConfig.events.content_view // NOSONAR
        && this.configSvc.netcoreConfig.netcoreWebConfig.events.content_view.isActive // NOSONAR
      ) { 
        let payload: any = {}
        // if (this.configSvc && this.configSvc.unMappedUser && this.configSvc.unMappedUser.identifier) { // NOSONAR
        //   payload['pk^userid'] = this.configSvc.unMappedUser.identifier.trim().toLowerCase()
        // }
        if(this.eventData && this.eventData.name) {
          payload['event_name'] = this.eventData.name
        }
        if(this.eventData && this.eventData.courseCategory) {
          payload['event_category'] = this.eventData.resourceType
        }
        if(this.eventData && this.eventData.identifier) {
          payload['event_id'] = this.eventData.identifier
        }
        //if(this.eventData && this.eventData.name) {
          payload['event_url'] = window.location.href
        //}
        if(this.eventData && this.eventData.appIcon) {
          payload['event_image'] = this.eventData.appIcon
        }
        // if(this.eventData && this.eventData.duration) {
          payload['event_duration'] = this.eventData.duration > 0 ? Number(this.eventData.duration ): 0
        // }
        if(this.eventData && this.eventData.sourceName) {
          payload['event_provider_name'] = this.eventData.sourceName
        }
        if(eventType === 'view') {
         this.netCoreService.trackEventForContentAndEvent('event_view', this.configSvc.unMappedUser.identifier.trim().toLowerCase(), payload)
        } else if (eventType === 'enroll') {
         this.netCoreService.trackEventForContentAndEvent('event_enrolment', this.configSvc.unMappedUser.identifier.trim().toLowerCase(), payload)
        }
        
      }
    }
  
    secondsToTime(d:any)
    {
      d = Number(d);
      var h = Math.floor(d / 3600);
      var m = Math.floor(d % 3600 / 60);
      var s = Math.floor(d % 3600 % 60);
  
      var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
      var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
      return hDisplay + mDisplay + sDisplay; 
    }
}
