import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService, EventService, NsContent, UtilityService, WsEvents } from '@sunbird-cb/utils-v2'
import { Subscription } from 'rxjs'

import { LoadCheckService } from '@ws/app/src/lib/routes/app-toc/services/load-check.service'
import { MatLegacyTabGroup as MatTabGroup, MatLegacyTabChangeEvent as MatTabChangeEvent } from '@angular/material/legacy-tabs'
import { NsDiscussionV2 } from '@sunbird-cb/discussion-v2'
import { AiTutorConfirmPopupComponent } from './ai-tutor-confirm-popup/ai-tutor-confirm-popup.component'
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog'
import { viewerRouteGenerator } from '@sunbird-cb/collection'
import { AppTocService } from '@ws/app/src/lib/routes/app-toc/services/app-toc.service'
import { ActionService } from '@ws/app/src/lib/routes/app-toc/services/action.service'
@Component({
  selector: 'ws-widget-content-toc',
  templateUrl: './content-toc.component.html',
  styleUrls: ['./content-toc.component.scss'],
})

export class ContentTocComponent implements OnInit, AfterViewInit, OnChanges {

  tabChangeValue: any = ''
  @Input() content!: any
  @Input() contentReadData!: any
  @Input() initialRouteData: any
  @Input() changeTab = false
  routeSubscription: Subscription | null = null
  @Input() forPreview = window.location.href.includes('/public/') || window.location.href.includes('&preview=true')
  @Input() contentTabFlag = true
  @Input() resumeData: any | null = null
  @Input() batchData: /**NsContent.IBatchListResponse */ any | null = null
  @Input() skeletonLoader = false
  @Input() tocStructure: any = {}
  @Input() pathSet: any
  @Input() fromViewer = false
  @Input() hierarchyMapData: any = {}
  @ViewChild('stickyMenu') tabElement!: MatTabGroup
  @Input() condition: any
  @Input() kparray: any
  @Input() selectedBatchData: any
  @Input() config: any
  @Input() componentName!: string
  @Input() isEnrolled!: boolean
  @Output() playResumeForAI = new EventEmitter()
  @Output() enrollUserToAI = new EventEmitter()
  sticky = false
  menuPosition: any
  isMobile = false
  selectedTabIndex = 0
  discussWidgetData!: NsDiscussionV2.ICommentWidgetData
  displayTeachersContent = false
  teacherNotesFlag = false
  referenceNotesFlag = false
  viewerPage = window.location.href.includes('/viewer/') ? true : false
  resumeDataLink:any
  enableAITutorFlag = false
  enableTranscriptionFlag = false
  courseCategory = NsContent.ECourseCategory
  constructor(
    private route: ActivatedRoute,
    private utilityService: UtilityService,
    private loadCheckService: LoadCheckService,
    private configService: ConfigurationsService,
    public dialog: MatDialog,
    public tocSvc: AppTocService,
    private actionSVC: ActionService,
    private router: Router,
    private eventSvc: EventService,
  ) { }

  ngOnInit() {
    if(this.configService.iGOTAIConfig && this.configService.iGOTAIConfig.aiTutor) {
      this.enableAITutorFlag = true
    } else {
      this.enableAITutorFlag = false
    }
    if(this.configService.iGOTAIConfig && this.configService.iGOTAIConfig.transcription) {
      this.enableTranscriptionFlag = true
    } else {
      this.enableTranscriptionFlag = false
    }
    if (this.route.snapshot.data.pageData && this.route.snapshot.data.pageData.data) {
      this.config = this.route.snapshot.data.pageData.data
    }
    if (this.config && this.config.discussWidgetData) {
      this.discussWidgetData = this.config.discussWidgetData
      if (this.content && this.content.identifier) {
        this.discussWidgetData.newCommentSection.commentTreeData.entityId = this.content.identifier
        if (this.discussWidgetData.commentsList.repliesSection && this.discussWidgetData.commentsList.repliesSection.newCommentReply) {
          this.discussWidgetData.commentsList.repliesSection.newCommentReply.commentTreeData.entityId = this.content.identifier
        }
      }
      this.discussWidgetData = { ...this.discussWidgetData }
    }
    const batchId = this.route.snapshot.queryParams.batchId ?
      this.route.snapshot.queryParams.batchId : ''
    if (batchId) {
      this.selectedTabIndex = 1
    }
    if (this.configService && this.configService.userRoles) {
      // tslint:disable-next-line:max-line-length
      this.displayTeachersContent = (
        this.configService.userRoles.has('MENTOR') ||
        this.configService.userRoles.has('mentor') ||
        this.configService.userRoles.has('Mentor')
      && this.content.courseCategory === NsContent.ECourseCategory.CASE_STUDY) ? true : false
    } else {
     
      this.displayTeachersContent = this.route.snapshot.queryParams.editMode &&
        this.content.courseCategory === NsContent.ECourseCategory.CASE_STUDY
      
    }
    if (this.content && this.content.referenceNodes) {
      this.content.referenceNodes.forEach((item: any) => {
        if (item && item.resourceCategory && item.resourceCategory === 'Teachers Resource') {
          this.teacherNotesFlag = true
        }
      })
    }
    if (this.content && this.content.referenceNodes) {
      this.content.referenceNodes.forEach((item: any) => {
        if (item && item.resourceCategory && item.resourceCategory === 'Reference Resource') {
          this.referenceNotesFlag = true
        }
      })
    }
  }

  ngAfterViewInit() {
    this.isMobile = this.utilityService.isMobile
    this.menuPosition = this.tabElement._elementRef.nativeElement.offsetTop
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.changeTab && changes.changeTab.currentValue) {
      this.selectedTabIndex = 1
    }
    if (this.config && this.config.discussWidgetData) {
      this.discussWidgetData = this.config.discussWidgetData
      if (this.content && this.content.identifier) {
        this.discussWidgetData.newCommentSection.commentTreeData.entityId = this.content.identifier
        if (this.discussWidgetData.commentsList.repliesSection && this.discussWidgetData.commentsList.repliesSection.newCommentReply) {
          this.discussWidgetData.commentsList.repliesSection.newCommentReply.commentTreeData.entityId = this.content.identifier
        }
      }
      if(this.isEnrolled) {
        this.discussWidgetData.enrolledContent = true
        this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Start a discussion'
      } else {
        this.discussWidgetData.enrolledContent = false
        this.discussWidgetData.newCommentSection.commentBox.placeholder = 'Enrol to add your comments'
      }
      this.discussWidgetData = { ...this.discussWidgetData }
    }
  }

  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.scrollY
    if (windowScroll >= (this.menuPosition - ((this.isMobile) ? 96 : 104))) {
      this.sticky = true
    } else {
      this.sticky = false
    }
  }

  handleTabChange(event: MatTabChangeEvent): void {
    this.tabChangeValue = event.tab
    this.selectedTabIndex = event.index
    this.loadCheckService.componentLoaded(true)
  }

  showAiTutorConfirmPopup() {
    this.raiseAIPopupStartTelemetry()
    if(this.isEnrolled) {
      setTimeout(()=>{
        this.raiseAIPopupInteractTelemetry()
      },1000)
     
      this.generateResumeDataLinkNew()
    } else {
      setTimeout(()=>{
        this.raiseAIPopupInteractTelemetry()
      },1000)
      const dialogConfig = new MatDialogConfig()

      dialogConfig.width = '421px'
      dialogConfig.data = {
        enroll: this.isEnrolled
      }
      const dialogRef = this.dialog.open(AiTutorConfirmPopupComponent, dialogConfig)

      dialogRef.afterClosed().subscribe((response:any) => {
        
        if(response === 'enroll') {          
          this.generateResumeDataLinkNew()
        } else if(response === 'needToEnroll'){
          this.enrollUserForAITutor()
        }
        this.raiseAIPopupEndTelemetry() 
      });
    }
    
  }

  generateResumeDataLinkNew() {
    if (this.resumeData && this.content) {
      let resumeDataV2: any
      if (this.content.completionPercentage === 100) {
        resumeDataV2 = this.getResumeDataFromList('start')
      } else {
        resumeDataV2 = this.getResumeDataFromList()
      }
      if (!resumeDataV2.mimeType) {
        resumeDataV2.mimeType = this.tocSvc.getMimeType(this.content, resumeDataV2.identifier)
      }
      this.resumeDataLink = viewerRouteGenerator(
        resumeDataV2.identifier,
        resumeDataV2.mimeType,
        this.content.identifier,
        this.content.contentType,
        this.forPreview,
        'Learning Resource',
        this.getBatchId(),
        this.content.name,
      )
      this.actionSVC.setUpdateCompGroupO = this.resumeDataLink
      console.log('this.resumeDataLink',this.resumeDataLink)
      console.log('this.actionSVC', this.actionSVC)
      this.router.navigate([this.resumeDataLink.url], {
        queryParams: this.resumeDataLink.queryParams
      });
      // this.router.navigateByUrl(
      //   [this.resumeDataLink.url],
      //   {
      //     relativeTo: this.resumeDataLink.url,
      //     queryParams: this.resumeDataLink.queryParams,
      //     queryParamsHandling: 'merge',
      //   })
      /* tslint:disable-next-line */
    } else {
      this.playResumeForAI.emit()
    }
  }

  private getResumeDataFromList(type?: string): any | void {
    const resumeCopy = [...this.resumeData]
    if (!type) {
      // tslint:disable-next-line:max-line-length

      const lastItem = resumeCopy && resumeCopy.sort((a: any, b: any) =>
        new Date(b.lastAccessTime).getTime() - new Date(a.lastAccessTime).getTime()).shift()
      return {
        identifier: lastItem.contentId,
        mimeType: lastItem.progressdetails && lastItem.progressdetails.mimeType,
      }
    }
    const firstItem = resumeCopy && resumeCopy.length && resumeCopy[0]
    return {
      identifier: firstItem.contentId,
      mimeType: firstItem.progressdetails && firstItem.progressdetails.mimeType,
    }
  }

  public getBatchId(): string {
    let batchId = ''
    if (this.batchData && this.batchData.content) {
      for (const batch of this.batchData.content) {
        batchId = batch.batchId
      }
    }
    return batchId
  }

  raiseAIPopupStartTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: 'click',  "id": "ai-tutor-toc-page", "pageid": `/app/toc/${this.content?.identifier}`   },
        object: { "id": this.content?.identifier,"type": this.content?.courseCategory },
        state: WsEvents.EnumTelemetrySubType.Loaded,
        eventSubType: WsEvents.EnumTelemetrySubType.Chatbot,
        mode: 'view',
      },
      pageContext: {pageId: '/app/toc', module: 'Learn'},
      from: '',
      to: 'Telemetry',
    }
    this.eventSvc.dispatchChatbotEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseAIPopupEndTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: 'click',  "id": "ai-tutor-toc-page", "pageid": `/app/toc/${this.content?.identifier}`  },
        object: { "id": this.content?.identifier,"type": this.content?.courseCategory },
        state: WsEvents.EnumTelemetrySubType.Unloaded,
        eventSubType: WsEvents.EnumTelemetrySubType.Chatbot,
        mode: 'view',
      },
      pageContext: {pageId: '/app/toc', module: 'Learn'},
      from: '',
      to: 'Telemetry',
    }
    this.eventSvc.dispatchChatbotEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseAIPopupInteractTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: 'click',  "id": "ai-tutor-toc-page", "pageid": `/app/toc/${this.content?.identifier}`  },
        object: { "id": this.content?.identifier,"type": this.content?.courseCategory },
        state: WsEvents.EnumTelemetrySubType.Interact,
        eventSubType: WsEvents.EnumTelemetrySubType.Chatbot,
        mode: 'view',
      },
      pageContext: {pageId: '/app/toc', module: 'Learn'},
      from: '',
      to: 'Telemetry',
    }
    this.eventSvc.dispatchChatbotEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  enrollUserForAITutor() {
    this.enrollUserToAI.emit()
  }
}
