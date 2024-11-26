import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { CommonMethodsService } from '@sunbird-cb/consumption'
import { ConfigurationsService, EventService, MultilingualTranslationsService, WidgetContentService } from '@sunbird-cb/utils-v2'
import { LoaderService } from '@ws/author/src/public-api'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { CertificateService } from '../../../certificate/services/certificate.service'
import { NsDiscussionV2 } from '@sunbird-cb/discussion-v2'

@Component({
  selector: 'ws-app-app-toc-cios-home',
  templateUrl: './app-toc-cios-home.component.html',
  styleUrls: ['./app-toc-cios-home.component.scss'],
})
export class AppTocCiosHomeComponent implements OnInit, AfterViewInit {
  skeletonLoader = true
  extContentReadData: any = {}
  userExtCourseEnroll: any = {}
  downloadCertificateLoading = false
  forPreview: any = window.location.href.includes('/public/') || window.location.href.includes('?editMode=true')
  extContentAvailable = true
  rcElem = {
    offSetTop: 0,
    BottomPos: 0,
  }
  contentLink: any = ''
  @ViewChild('rightContainer') rcElement!: ElementRef
  scrollLimit: any
  scrolled: boolean | undefined
  isMobile = false
  config: any
  enableShare = false
  rootOrgId: any
  currentLang: any = 'en'
  discussWidgetData!: NsDiscussionV2.ICommentWidgetData

  @HostListener('window:scroll', ['$event'])
  handleScroll() {

    if (this.scrollLimit) {
      if ((window.scrollY + this.rcElem.BottomPos) >= this.scrollLimit) {
        this.rcElement.nativeElement.style.position = 'sticky'
      } else {
        this.rcElement.nativeElement.style.position = 'fixed'
      }
    }

    // 236... (OffsetTop of right container + 104)
    if (window.scrollY > (this.rcElem.offSetTop + 104)) {
      this.scrolled = true
    } else {
      this.scrolled = false
    }
  }
  constructor(private route: ActivatedRoute,
              private commonSvc: CommonMethodsService,
              private translate: TranslateService,
              private configSvc: ConfigurationsService,
              private events: EventService,
              private langtranslations: MultilingualTranslationsService,
              private contentSvc: WidgetContentService,
              private certSvc: CertificateService,
              public loader: LoaderService,

              public snackBar: MatSnackBar,
  ) {
    this.route.data.subscribe((data: any) => {
      if (data && data.extContent && data.extContent.data && data.extContent.data.content) {
        this.extContentReadData = data.extContent.data.content
        this.extContentReadData['certificateObj'] = {
          data: {},
        }
        this.skeletonLoader = false

      } else {
        this.extContentAvailable = false
        this.skeletonLoader = false
      }

      if (data && data.userEnrollContent && data.userEnrollContent.data && data.userEnrollContent.data.result &&
        Object.keys(data.userEnrollContent.data.result).length > 0
      ) {
        this.userExtCourseEnroll = data.userEnrollContent.data.result
        if (this.userExtCourseEnroll.completionpercentage === 100) {
          this.extContentReadData['completionStatus'] = 2
          this.downloadCert()
        }
      }

    })

      if (localStorage.getItem('websiteLanguage')) {
        this.translate.setDefaultLang('en')
        this.currentLang = localStorage.getItem('websiteLanguage')!
        this.translate.use(this.currentLang)
      }
      this.configSvc.languageTranslationFlag.subscribe((data: any) => {
        if (data) {
          if (localStorage.getItem('websiteLanguage')) {
            this.currentLang = localStorage.getItem('websiteLanguage')!
            this.translate.use(this.currentLang)
          }
        }
      })

      if (this.configSvc.userProfile) {
        this.rootOrgId = this.configSvc.userProfile.rootOrgId
      }
      this.contentLink = `${window.location.pathname.substring(1)}${window.location.search}`
  }

  ngOnInit() {
    if (this.route.snapshot.data.pageData && this.route.snapshot.data.pageData.data) {
      this.config = this.route.snapshot.data.pageData.data
      this.initializeDiscussData()
    }
    if (window.innerWidth <= 1200) {
      this.isMobile = true
    } else {
      this.isMobile = false
    }
  }

  initializeDiscussData() {
    if (this.config && this.config.discussWidgetData) {
      this.discussWidgetData = this.config.discussWidgetData
      if (this.extContentReadData && this.extContentReadData.contentId) {
        this.discussWidgetData.newCommentSection.commentTreeData.entityId = this.extContentReadData.contentId
        if (this.discussWidgetData.commentsList.repliesSection && this.discussWidgetData.commentsList.repliesSection.newCommentReply) {
          this.discussWidgetData.commentsList.repliesSection.newCommentReply.commentTreeData.entityId = this.extContentReadData.contentId
        }
      }

      if(Object.keys(this.userExtCourseEnroll).length) {
        this.discussWidgetData.enrolledContent = true
        this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Start a discussion'
      } else {
        this.discussWidgetData.enrolledContent = false
        this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Enrol to comment…'
      }
      this.discussWidgetData = { ...this.discussWidgetData }
    }
  }

  handleCapitalize(str: string, type?: string): string {
    return this.commonSvc.handleCapitalize(str, type)
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabel(label, type, '')
  }

  ngAfterViewInit() {
    if (this.rcElement) {
      this.rcElem.BottomPos = this.rcElement.nativeElement.offsetTop + this.rcElement.nativeElement.offsetHeight
      this.rcElem.offSetTop = this.rcElement.nativeElement.offsetTop
    }
  }
  redirectToContent(contentData: any) {
    const userData: any = this.configSvc.userProfileV2
    const extUrl: string = contentData.redirectUrl.replace('<username>', userData.email)
    return extUrl
  }
  replaceText(str: any, replaceTxt: any) {
    return str.replaceAll(replaceTxt, '')
  }

  async enRollToExtCourse(content: any) {
    this.loader.changeLoad.next(true)
    const reqbody = {
      courseId: content.contentId,
      partnerId: content.contentPartner.id,
    }
    const enrollRes = await this.contentSvc.extContentEnroll(reqbody).toPromise().catch(_error => {})
    if (enrollRes && enrollRes.result && Object.keys(enrollRes.result).length > 0) {
      this.getUserContentEnroll(content.contentId)
    } else {
      this.loader.changeLoad.next(false)
      this.snackBar.open('Unable to enroll to the content')
    }
  }

  async getUserContentEnroll(contentId: any) {
    const enrollRes = await this.contentSvc.fetchExtUserContentEnroll(contentId).toPromise().catch(_error => {})
    if (enrollRes && enrollRes.result  && Object.keys(enrollRes.result).length > 0) {
      this.userExtCourseEnroll = enrollRes.result
      this.loader.changeLoad.next(false)
      this.snackBar.open('Successfully enrolled in the course.')
    } else {
      this.loader.changeLoad.next(false)
      this.snackBar.open('Unable to get the enrolled details')
    }
  }

  async downloadCert() {
    this.downloadCertificateLoading = true
    const certRes: any = await
    this.certSvc.downloadCertificate_v2(this.userExtCourseEnroll.issued_certificates[0].identifier).toPromise().catch(_error => {})
    if (certRes && Object.keys(certRes.result).length > 0) {
      this.downloadCertificateLoading = false
      if (this.userExtCourseEnroll.issued_certificates && this.userExtCourseEnroll.issued_certificates.length
        && this.userExtCourseEnroll.issued_certificates[0]) {
        this.extContentReadData['certificateObj'] = {
          data: this.userExtCourseEnroll.issued_certificates[0],
          certData: certRes.result.printUri,
          certId: this.userExtCourseEnroll.issued_certificates[0].identifier,
        }
      }
    } else {
      this.downloadCertificateLoading = false
    }
  }
  onClickOfShare() {
    this.enableShare = true
    this.raiseTelemetryForShare('shareContent')
  }

   /* tslint:disable */
   raiseTelemetryForShare(subType: any) {
    console.log(this.extContentReadData, this.events, subType)
    // this.events.raiseInteractTelemetry(
      // {
      //   type: 'click',
      //   subType,
      //   id: this.content ? this.content.identifier : '',
      // },
      // {
      //   id: this.content ? this.content.identifier : '',
      //   type: this.content ? this.content.primaryCategory : '',
      // },
      // {
      //   pageIdExt: `btn-${subType}`,
      //   module: WsEvents.EnumTelemetrymodules.CONTENT,
      // }
    // )
  }

  resetEnableShare(_eventData: any) {
    
    this.enableShare = false
  }

}
