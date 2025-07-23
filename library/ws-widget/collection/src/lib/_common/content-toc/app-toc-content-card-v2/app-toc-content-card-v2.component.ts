import { Component, EventEmitter, Input, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core'
import { NsContent, viewerRouteGenerator, WidgetContentService } from '@sunbird-cb/collection'
import { NsAppToc } from '../models/app-toc.model'
import { EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { CertificateDialogComponent } from '@sunbird-cb/collection/src/lib/_common/certificate-dialog/certificate-dialog.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { animate, style, transition, trigger } from '@angular/animations'
/* tslint:disable*/
import _ from 'lodash'
import moment from 'moment'
import { CertificateService } from '@ws/app/src/lib/routes/certificate/services/certificate.service'
import { AppTocService } from '@ws/app/src/lib/routes/app-toc/services/app-toc.service'
import { Subscription } from 'rxjs'
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component'
import {  ActivatedRoute, Router } from '@angular/router'

 interface ILanguageQueryParams {
    selectedMLCourse?: string
    selectedMLCourseCode?: string
  }

@Component({
  selector: 'ws-widget-app-toc-content-card-v2',
  templateUrl: './app-toc-content-card-v2.component.html',
  styleUrls: ['./app-toc-content-card-v2.component.scss'],
  animations: [
    trigger('panelInOut', [
      transition('void => *', [
        style({ transform: 'translateY(-10%)', opacity: '0' }),
        animate(250)
      ]),
      transition('* => void', [
        animate(200, style({ transform: 'translateY(-10%)', opacity: '0' }))
      ])
    ])
  ]
})
export class AppTocContentCardV2Component implements OnInit {
  @Input() content: NsContent.IContent | null = null
  @Input() expandAll = false
  @Input() rootId!: string
  @Input() rootContentType!: string
  @Input() forPreview = false
  @Input() batchId!: string
  @Input() componentName: string = 'toc'
  @Input() index!: number
  @Input() pathSet!: any
  @Input() expandActive = true
  @Input() hierarchyMapData: any = {}
  @Input() batchData: /**NsContent.IBatchListResponse */ any | null = null
  @Input() resumeData: NsContent.IContinueLearningData | null = null
  @Input() enrolledCourseData: any = null
  @Output() languageSelected = new EventEmitter<any>()
  recentLang: any = null
  hasContentStructure = false
  downloadCertificateLoading = false
  enumContentTypes = NsContent.EDisplayContentTypes
  contentStructure: NsAppToc.ITocStructure = {
    assessment: 0,
    finalTest: 0,
    course: 0,
    handsOn: 0,
    interactiveVideo: 0,
    learningModule: 0,
    other: 0,
    pdf: 0,
    survey: 0,
    podcast: 0,
    practiceTest: 0,
    quiz: 0,
    video: 0,
    webModule: 0,
    webPage: 0,
    youtube: 0,
    interactivecontent: 0,
    offlineSession: 0,
  }
  // languages = [
  //   { name: 'Hindi', localName: 'हिन्दी', code: 'hi' },
  //   { name: 'Tamil', localName: 'தமிழ்', code: 'ta' },
  //   { name: 'Telugu', localName: 'తెలుగు', code: 'te' },
  //   { name: 'Bengali', localName: 'বাংলা', code: 'bn' },
  //   { name: 'Marathi', localName: 'मराठी', code: 'mr' },
  //   { name: 'Gujarati', localName: 'ગુજરાતી', code: 'gu' },
  //   { name: 'Kannada', localName: 'ಕನ್ನಡ', code: 'kn' },
  //   { name: 'Malayalam', localName: 'മലയാളം', code: 'ml' },
  //   { name: 'Punjabi', localName: 'ਪੰਜਾਬੀ', code: 'pa' },
  //   { name: 'English', localName: 'English', code: 'en' },
  //   { name: 'Odia', localName: 'ଓଡ଼ିଆ', code: 'or' },
  //   { name: 'Assamese', localName: 'অসমীয়া', code: 'as' },
  //   { name: 'Konkani', localName: 'कोंकणी', code: 'kok' },
  //   { name: 'Sanskrit', localName: 'संस्कृतम्', code: 'sa' },
  //   { name: 'Maithili', localName: 'मैथिली', code: 'mai' }
  // ]
  languageList: any = []
  selectedValue: string | null = null
  openDialogOnClose: boolean = false
  defaultThumbnail = ''
  viewChildren = false
  primaryCategory = NsContent.EPrimaryCategory
  pageScrollSubscription: Subscription | null = null
   selectedLang: any = null
  selectedLangCode: string = '' 

  constructor(
    private events: EventService,
    private dialog: MatDialog,
    private contentSvc: WidgetContentService,
    private renderer: Renderer2,
    private certificateService: CertificateService,
    private appTocSvc: AppTocService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.getSelectedLanguage()
  
    this.evaluateImmediateChildrenStructure()
    // this.route.data.subscribe(data => {
    //     this.defaultThumbnail = data.configData.data.logos.defaultContent
    //   }
    // )
    this.resourceScroll()
    this.getCourseLanguage()
  }
  // FOR RIGHT SIDE RESOURCE SCROLL ON TOC PAGE
  resourceScroll() {
    this.pageScrollSubscription = this.appTocSvc.updatePageScroll.subscribe((value: boolean) => {
      if (value) {
        setTimeout(() => {
          this.scrollView()
        }, 700)
      }
    })
  }
  // TO UPDATE RESOURCE BEHAVOUR SUBJECT FOR RESOURCE SCROLL
  changeResource() {
    this.appTocSvc.getPageScroll.next(true)
  }

  getSelectedLanguage() {
    console.log(this.enrolledCourseData, 'enrolledCourseData')
  this.route.queryParams.subscribe((params: ILanguageQueryParams) => {
    if (params) {
      this.selectedLang =  {
        'name': params.selectedMLCourse?.toLowerCase() ,
        'id': params.selectedMLCourseCode?.toLowerCase(),
        'status': 'live'
      } 
  
    } else {
      let recentLang = this.enrolledCourseData?.recent_language
     let langObj = this.languageList?.filter((lang: any) => { lang?.name?.toLowerCase() === recentLang })
     this.selectedLang = langObj
    }
  })
}

  getCourseLanguage() {
    const contentId = this.content?.parent
    if (contentId) {
      this.contentSvc?.getContent(contentId).subscribe((data: any) => {
        if (data && data.result && data.result.content && data.result.content.languageMapV1) {
          // return data.result.content.language
          const languageMapV1 = data.result.content.languageMapV1 || {}

          this.languageList = Object.entries(languageMapV1)
            .filter(([_, val]: [string, any]) => val.status === "live")
            .map(([lang, val]: [string, any]) => ({
              name: lang,
              id: val.id,
              status: val.status
            }))
          // this.getLangArray(languageMapV1)
        }

      })
    }
  }

  onLanguageChange(lang: any) {
    this.selectedLang = lang
    const selectedLangId = this.selectedLang?.id
    if (!this.resumeData) {
      this.contentSvc?.fetchContent(selectedLangId, "detail").subscribe((data: any) => {
        this.content = data?.result?.content
      })
    }
    if (this.resumeData && this.selectedLang) {
      this.openConfirmDialoge()
    }
    this.router.navigate([], {
    // relativeTo: this.route,
    queryParams: {
      selectedMLCourse: lang.name.toLowerCase(),      // e.g., 'tamil'
      selectedMLCourseCode: lang.id?.toLowerCase()  // e.g., 'ta'
    },
    queryParamsHandling: 'merge', // preserves other existing params
    replaceUrl: true              // optional: avoids pushing new history entry
  });
    this.languageSelected.emit(this.selectedLang)
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const property in changes) {
      if (property === 'expandAll') {
        this.viewChildren = this.expandAll
      }
      if (property === 'pathSet' && changes['pathSet']) {
        let currentValue = changes['pathSet'].currentValue
        let previousValue = changes['pathSet'].previousValue
        if (currentValue && previousValue) {
          const eqSet = (xs: any, ys: any) =>
            xs.size === ys.size &&
            [...xs].every((x) => ys.has(x));
          if (!eqSet(previousValue, currentValue)) { }
        }
        // if(previousValue === undefined){
        //   setTimeout(()=>{  
        //   },700)
        // }
      }
      // this.appTocSvc.getPageScroll.next(true)

      if (property === 'hierarchyMapData') {
        if (_.isEmpty(changes['hierarchyMapData'].currentValue)) {
          // this.loadingOverallPRogress = true
        } else {
          if (this.content) {
            this.updateChildParentMap(this.content.identifier)
          }
        }
      }
    }
  }

  check(content: any) {
    if (this.expandActive) {
      content.viewChildren = this.pathSet && this.pathSet.has(content.identifier) || content.viewChildren
    }
    return content.viewChildren
  }

  get isCollection(): boolean {
    if (this.content) {
      return this.content.mimeType === NsContent.EMimeTypes.COLLECTION
    }
    return false
  }

  get isModule(): boolean {
    if (this.content) {
      return this.content.primaryCategory === NsContent.EPrimaryCategory.MODULE
    }
    return false
  }

  public checkModule(content: NsContent.IContent | null): boolean {
    if (content) {
      return content.primaryCategory === NsContent.EPrimaryCategory.MODULE
    }
    return false
  }

  checkIsModule(content: any): boolean {
    if (content) {
      return content.primaryCategory === NsContent.EPrimaryCategory.MODULE
    }
    return false
  }

  get isBatchInProgess() {
    if (this.batchData && (this.batchData.content && this.batchData.content.length) && this.batchData.enrolled) {
      const batchData = this.batchData.content[0]
      if (batchData && batchData.endDate) {
        const now = moment().format('YYYY-MM-DD')
        const startDate = moment(batchData.startDate).format('YYYY-MM-DD')
        const endDate = batchData.endDate ? moment(batchData.endDate).format('YYYY-MM-DD') : now
        return (
          // batch.status &&
          moment(startDate).isSameOrBefore(now)
          && moment(endDate).isSameOrAfter(now)
        )
      } return true
    }
    return false
  }

  get isResource(): boolean {
    if (this.content) {
      return (
        this.content.primaryCategory === NsContent.EPrimaryCategory.RESOURCE
        // || this.content.primaryCategory === NsContent.EPrimaryCategory.KNOWLEDGE_ARTIFACT
        || this.content.primaryCategory === NsContent.EPrimaryCategory.PRACTICE_RESOURCE
        || this.content.primaryCategory === NsContent.EPrimaryCategory.FINAL_ASSESSMENT
        || this.content.primaryCategory === NsContent.EPrimaryCategory.COMP_ASSESSMENT
      )
    }
    return false
  }
  get resourceLink(): { url: string; queryParams: { [key: string]: any } } {
    if (this.content) {
      let url = viewerRouteGenerator(
        this.content.identifier,
        this.content.mimeType,
        this.rootId,
        this.rootContentType,
        this.forPreview,
        this.content.primaryCategory,
        this.batchId
      )
      /* tslint:disable-next-line */
      // console.log(this.content.identifier, '------', url,'=====> content card url link <========')
      return url
    }
    return { url: '', queryParams: {} }
  }

  public progressColor(): string {
    // if (this.currentProgress <= 30) {
    //   return '#D13924'
    // } if (this.currentProgress > 30 && this.currentProgress <= 70) {
    //   return '#E99E38'
    // }
    // if (this.currentProgress > 70 && this.currentProgress <= 100) {
    //   return '#1D8923'
    // }

    return '#1D8923'
  }
  public progressColor2(): string {
    return '#f27d00'
  }

  private evaluateImmediateChildrenStructure() {
    if (this.content && this.content.children && this.content.children.length) {
      this.content.children.forEach((child: NsContent.IContent) => {
        if (child.primaryCategory === NsContent.EPrimaryCategory.COURSE) {
          this.contentStructure.course += 1
        } else if (child.primaryCategory === NsContent.EPrimaryCategory.KNOWLEDGE_ARTIFACT) {
          this.contentStructure.other += 1
        } else if (child.primaryCategory === NsContent.EPrimaryCategory.MODULE) {
          this.contentStructure.learningModule += 1
        } else if (child.primaryCategory === NsContent.EPrimaryCategory.OFFLINE_SESSION) {
          this.contentStructure.offlineSession += 1
        } else if (child.primaryCategory === NsContent.EPrimaryCategory.RESOURCE) {
          switch (child.mimeType) {
            case NsContent.EMimeTypes.HANDS_ON:
              this.contentStructure.handsOn += 1
              break
            case NsContent.EMimeTypes.MP3:
              this.contentStructure.podcast += 1
              break
            case NsContent.EMimeTypes.MP4:
            case NsContent.EMimeTypes.M3U8:
              this.contentStructure.video += 1
              break
            case NsContent.EMimeTypes.INTERACTION:
              this.contentStructure.interactiveVideo += 1
              break
            case NsContent.EMimeTypes.PDF:
              this.contentStructure.pdf += 1
              break
            case NsContent.EMimeTypes.OFFLINE_SESSION:
              this.contentStructure.offlineSession += 1
              break
            case NsContent.EMimeTypes.SURVEY:
              this.contentStructure.survey += 1
              break
            case NsContent.EMimeTypes.HTML:
              this.contentStructure.webPage += 1
              break
            case NsContent.EMimeTypes.QUIZ:
              if (child.resourceType === 'Assessment') {
                this.contentStructure.assessment += 1
              } else {
                this.contentStructure.quiz += 1
              }
              break
            case NsContent.EMimeTypes.PRACTICE_RESOURCE:
              // case NsContent.EMimeTypes.FINAL_ASSESSMENT:
              // case NsContent.EMimeTypes.PRACTICE_RESOURCE:
              this.contentStructure.practiceTest += 1
              break
            case NsContent.EMimeTypes.WEB_MODULE:
              this.contentStructure.webModule += 1
              break
            case NsContent.EMimeTypes.YOUTUBE:
              this.contentStructure.youtube += 1
              break
            default:
              this.contentStructure.other += 1
              break
          }
        }
      })
    }
    for (const key in this.contentStructure) {
      if (this.contentStructure[key] > 0) {
        this.hasContentStructure = true
      }
    }
  }

  get contextPath() {
    return {
      contextId: this.rootId,
      contextPath: this.rootContentType,
      batchId: this.batchId,
    }
  }

  public contentTrackBy(_index: number, content: NsContent.IContent) {
    if (!content) {
      return null
    }
    return content.identifier
  }

  public raiseTelemetry() {
    // if (this.forPreview) { return }
    if (this.content) {
      this.events.raiseInteractTelemetry(
        {
          type: 'click',
          subType: `card-tocContentCard`,
          // id: this.content.identifier || '',
        },
        {
          // contentId: this.content.identifier || '',
          // contentType: this.content.primaryCategory,
          id: this.content.identifier || '',
          type: this.content.primaryCategory,
          rollup: {
            l1: this.rootId || '',
          },
          ver: `${this.content.version}${''}`,
        },
        {
          pageIdExt: `${_.camelCase(this.content.primaryCategory)}-card`,
          module: _.camelCase(this.content.primaryCategory),
        })
    }
  }
  get isAllowed(): boolean {
    if (this.content) {
      return !(NsContent.UN_SUPPORTED_DATA_TYPES_FOR_NON_BATCH_USERS.indexOf(this.content.mimeType) >= 0)
    } return false
  }

  get isEnabled(): boolean {
    return true
  }

  get isEnrolled(): boolean {
    return this.batchId ? true : false
  }

  updateChildParentMap(identifier: string) {
    if (this.hierarchyMapData && this.hierarchyMapData[identifier]) {
      let localContentData = this.hierarchyMapData[identifier]
      if (
        !(localContentData.primaryCategory === NsContent.EPrimaryCategory.RESOURCE
          || localContentData.primaryCategory === NsContent.EPrimaryCategory.PRACTICE_RESOURCE
          || localContentData.primaryCategory === NsContent.EPrimaryCategory.FINAL_ASSESSMENT
          || localContentData.primaryCategory === NsContent.EPrimaryCategory.COMP_ASSESSMENT)
      ) {
        // real percent logic
        // const total = localContentData.leafNodes.reduce((sum: number, childId: string) => {
        //   return sum + Number(this.hierarchyMapData[childId].completionPercentage || 0)
        // },                                      0)
        // console.log('total ', total)
        // if(total > 0) {
        //   this.hierarchyMapData[identifier]['completionPercentage'] = total / _.toInteger(_.get(this.hierarchyMapData[identifier], 'leafNodesCount'))
        // }
        if (localContentData.primaryCategory === NsContent.EPrimaryCategory.MODULE) {
          this.hierarchyMapData[identifier]['duration'] = this.hierarchyMapData[identifier].leafNodes.reduce(
            (sum: any, childID: any) => {
              if (this.hierarchyMapData && this.hierarchyMapData[childID]) {
                return sum + Number(this.hierarchyMapData[childID].duration || this.hierarchyMapData[childID].expectedDuration || 0)
              }

            }, 0)
        }
        // tslint:disable
        const completedItems = _.filter(this.hierarchyMapData[identifier].leafNodes, r => (this.hierarchyMapData[r] && (this.hierarchyMapData[r].completionStatus === 2 || this.hierarchyMapData[r].completionPercentage === 100)))
        const totalCount = _.toInteger(_.get(this.hierarchyMapData[identifier], 'leafNodesCount')) || 1
        this.hierarchyMapData[identifier]['completionPercentage'] = Number(((completedItems.length / totalCount) * 100).toFixed())
        this.hierarchyMapData[identifier]['completionStatus'] = (this.hierarchyMapData[identifier].completionPercentage >= 100) ? 2 : 1
      }
      return this.hierarchyMapData[identifier]
    }
    return ''
  }

  getCompletionPercentage(identifier: string) {
    return this.hierarchyMapData && this.hierarchyMapData[identifier] && this.hierarchyMapData[identifier].completionPercentage
  }

  getCompletionStatus(identifier: string) {
    return this.hierarchyMapData && this.hierarchyMapData[identifier] && this.hierarchyMapData[identifier].completionStatus
  }

  openCertificateDialog(certData: any) {
    const cet = certData
    this.dialog.open(CertificateDialogComponent, {
      // height: '400px',
      width: '1300px',
      data: { cet },
      // panelClass: 'custom-dialog-container',
    })
  }
  scrollView() {
    try {
      let errorField: any = this.renderer.selectRootElement('.resource-container .resource-active');
      if (errorField) {
        errorField.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      }
      if (this.componentName === 'toc') {
        if (errorField) {
          const rect = errorField.getBoundingClientRect();
          if (rect.top - 420 > 0) {
            window.scroll(420, rect.top - 148)
          }
        }
      }
      setTimeout(() => {
        this.appTocSvc.getPageScroll.next(false)
      }, 700)

      // else {
      //   errorField.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      //   const rect = errorField.getBoundingClientRect();
      //   errorField.scroll(0,rect.top-56)
      // }
    } catch (err) {
    }
  }

  downloadCertificate(certificateData: any) {
    this.events.raiseInteractTelemetry(
      {
        type: WsEvents.EnumInteractTypes.CLICK,
        id: 'view-certificate',
        subType: WsEvents.EnumInteractSubTypes.CERTIFICATE,
      },
      {
        id: certificateData,   // id of the certificate
        type: WsEvents.EnumInteractSubTypes.CERTIFICATE,
      })
    if (certificateData) {
      this.downloadCertificateLoading = true
      let certData: any = certificateData
      this.certificateService.downloadCertificate_v2(certData).subscribe((res: any) => {
        this.downloadCertificateLoading = false
        const cet = res.result.printUri
        this.dialog.open(CertificateDialogComponent, {
          width: '1300px',
          data: { cet, certId: certData.identifier },
        })
      })
    } else {
      this.downloadCertificateLoading = false
    }
  }
  ngOnDestroy() {
    if (this.pageScrollSubscription) {
      this.pageScrollSubscription.unsubscribe()
    }
  }

  get checkForCuratedProgram() {
    if (this.content && this.content.parent && this.hierarchyMapData && this.hierarchyMapData[this.content.parent]) {
      let parentData = this.hierarchyMapData[this.content.parent]
      return parentData && parentData.primaryCategory === NsContent.EPrimaryCategory.CURATED_PROGRAM &&
        parentData.compatibilityLevel >= 5 &&
        parentData.contextLockingType === NsContent.EContextLockingType.COURSE_ASSESSMENT_ONLY
    }
    return false
  }

  get isContentUnlocked() {
    if (this.checkForCuratedProgram) {
      if (this.content && this.content.parent && this.hierarchyMapData && this.hierarchyMapData[this.content.parent]) {
        let parentData = this.hierarchyMapData[this.content.parent]
        let completedLeafNodes = []
        parentData.leafNodes.forEach((_ele: any) => {
          if (this.hierarchyMapData && this.hierarchyMapData[_ele]) {
            let childData = this.hierarchyMapData[_ele]
            if (childData && childData.completionStatus === 2) {
              completedLeafNodes.push(childData)
            }
          }
        });
        if (completedLeafNodes.length >= parentData.leafNodesCount - 1) {
          return true
        } else {
          return false
        }
      }
    } else {
      return true
    }
  }

  openConfirmDialoge() {
    let dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: ' ',
        from: 'openConfirmDialoge',
        cancelButton: 'Cancel',
        acceptButton: 'Change language',
        header: 'Are you sure you want to change the language?',
        message: 'Switching the language will reset your progress. the course will restart from the beginning in the selected language.',

      } // optional, if you need to pass data
    })
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.contentSvc?.fetchContent(this.selectedLang?.id, "detail").subscribe((data: any) => {
          this.content = data?.result?.content
        })
      }

    })

  }

  openLangDialog() {
    this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: ' ',
        from: 'openLangDialog',
        cancelButton: 'Cancel',
        acceptButton: 'Resume Progress',
        header: 'Continue where you left off in Hindi?',
        message: "You’ve already made some progress in this language? Would you like to resume from where you left off or start over",

      } // optional, if you need to pass data
    });

  }


  onRadioChange(value: string) {
    this.selectedValue = value
    this.openDialogOnClose = true
  }

  onSelectClosed() {
    if (this.openDialogOnClose) {
      this.openConfirmDialoge()
      this.openDialogOnClose = false
    }
  }



}
