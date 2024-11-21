import { AfterViewInit, Component, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService, NsContent, UtilityService } from '@sunbird-cb/utils-v2'
import { Subscription } from 'rxjs'

import { LoadCheckService } from '@ws/app/src/lib/routes/app-toc/services/load-check.service'
import { MatTabGroup, MatTabChangeEvent } from '@angular/material/tabs'
import { NsDiscussionV2 } from '@sunbird-cb/discussion-v2'

@Component({
  selector: 'ws-widget-content-toc',
  templateUrl: './content-toc.component.html',
  styleUrls: ['./content-toc.component.scss'],
})

export class ContentTocComponent implements OnInit, AfterViewInit, OnChanges {

  tabChangeValue: any = ''
  @Input() content!: NsContent.IContent
  @Input() initialRouteData: any
  @Input() changeTab = false
  routeSubscription: Subscription | null = null
  @Input() forPreview = window.location.href.includes('/public/') || window.location.href.includes('&preview=true')
  @Input() contentTabFlag = true
  @Input() resumeData: NsContent.IContinueLearningData | null = null
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
  sticky = false
  menuPosition: any
  isMobile = false
  selectedTabIndex = 0
  discussWidgetData!: NsDiscussionV2.ICommentWidgetData
  displayTeachersContent = false

  constructor(
    private route: ActivatedRoute,
    private utilityService: UtilityService,
    private loadCheckService: LoadCheckService,
    private configService: ConfigurationsService,
  ) { }

  ngOnInit() {
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
      this.displayTeachersContent = (this.configService.userRoles.has('MENTOR') || this.configService.userRoles.has('mentor') || this.configService.userRoles.has('Mentor')) ? true : false
      if (!this.displayTeachersContent) {
        this.displayTeachersContent = this.content.courseCategory === NsContent.ECourseCategory.CASE_STUDY
      }
    } else {
      this.displayTeachersContent = this.route.snapshot.queryParams.editMode && this.content.courseCategory === NsContent.ECourseCategory.CASE_STUDY
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
}
