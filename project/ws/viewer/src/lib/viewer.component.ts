
import { AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { NsContent } from '@sunbird-cb/collection'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { ConfigurationsService, UtilityService, ValueService } from '@sunbird-cb/utils-v2'
import { Subscription } from 'rxjs'
import { RootService } from '../../../../../src/app/component/root/root.service'
import { ContentLanguageService, WidgetContentLibService, WidgetUserServiceLib } from '@sunbird-cb/consumption'
import { MobileAppsService } from '../../../../../src/app/services/mobile-apps.service'
import { ViewerHeaderSideBarToggleService } from './viewer-header-side-bar-toggle.service'
import { PdfScormDataService } from './pdf-scorm-data-service'
import { TranslateService } from '@ngx-translate/core'
import { AppTocService, AppTocV2Service, ViewerUtilService, WidgetContentService, TStatus, ViewerDataService } from '@sunbird-cb/toc'


export enum ErrorType {
  accessForbidden = 'accessForbidden',
  notFound = 'notFound',
  internalServer = 'internalServer',
  serviceUnavailable = 'serviceUnavailable',
  somethingWrong = 'somethingWrong',
  mimeTypeMismatch = 'mimeTypeMismatch',
  previewUnAuthorised = 'previewUnAuthorised',
}

@Component({
  selector: 'viewer-container',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
})

export class ViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  fullScreenContainer: HTMLElement | null = null
  content: NsContent.IContent | null = null
  contentReadData: NsContent.IContent | null = null
  errorType = ErrorType
  show = true
  private isLtMedium$ = this.valueSvc.isLtMedium$
  sideNavBarOpened = false
  mode: 'over' | 'side' = 'side'
  forPreview = window.location.href.includes('/public/') || window.location.href.includes('&preview=true')
  isTypeOfCollection = true
  collectionId = this.activatedRoute.snapshot.queryParamMap.get('collectionId')
  batchId = this.activatedRoute.snapshot.queryParamMap.get('batchId')
  status: TStatus = 'none'
  error: any | null = null
  isNotEmbed = true
  completedCount: any = 0
  errorWidgetData: NsWidgetResolver.IRenderConfigWithTypedData<any> = {
    widgetType: 'errorResolver',
    widgetSubType: 'errorResolver',
    widgetData: {
      errorType: '',
    },
  }
  private screenSizeSubscription: Subscription | null = null
  private resourceChangeSubscription: Subscription | null = null
  leafNodesCount: any
  viewerHeaderSideBarToggleFlag = true
  isMobile = false
  contentMIMEType = ''
  handleBackFromPdfScormFullScreenFlag = false
  enrollmentList: any
  hierarchyData: any
  enrolledCourseData: any
  batchData: any
  tocStructure: any
  hasTocStructure = false
  viewerAboutContentData: any
  hierarchyMapData: any = {}
  pathSet: any
  tocConfig: any = null
  isAssessmentScreen = false
  pageScrollSubscription: Subscription | null = null
  coursePrimaryCategory: any = ''
  compatibilityLevel = 0
  loadAllHierarchyData = false
  isPreAssessment = false
  sideNavForAIOpened = false
  baseContentReadData: any
  languageList: any = []
  progressUpdateSubscription: Subscription | null = null
  hashmapUpdatedSubscription: Subscription | null = null
  routeChangeSubscription: Subscription | null = null
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private valueSvc: ValueService,
    private dataSvc: ViewerDataService,
    private rootSvc: RootService,
    private utilitySvc: UtilityService,
    private changeDetector: ChangeDetectorRef,
    private widgetServ: WidgetContentService,
    private widgetLibServ: WidgetContentLibService,
    private contentLangSvc: ContentLanguageService,
    private configSvc: ConfigurationsService,
    private userSvc: WidgetUserServiceLib,
    private abc: MobileAppsService,
    public viewerHeaderSideBarToggleService: ViewerHeaderSideBarToggleService,
    public pdfScormDataService: PdfScormDataService,
    private translate: TranslateService,
    public tocSvc: AppTocService,
    private tocV2Svc: AppTocV2Service,
    private viewerUtilSvc: ViewerUtilService,
  ) {
    this.rootSvc.showNavbarDisplay$.next(false)
    this.abc.mobileTopHeaderVisibilityStatus.next(false)

    if (window.innerWidth <= 1200) {
      this.isMobile = true
    } else {
      this.isMobile = false
    }

    if (window.location.href.includes('practice')) {
      this.isAssessmentScreen = true
    } else {
      this.isAssessmentScreen = false
    }
    this.rootSvc.showNavbarDisplay$.next(false)
    this.abc.mobileTopHeaderVisibilityStatus.next(false)
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      let lang = JSON.stringify(localStorage.getItem('websiteLanguage'))
      lang = lang.replace(/\"/g, '')
      this.translate.use(lang)
    }

    if (this.activatedRoute.snapshot.queryParams && this.activatedRoute.snapshot.queryParams['preAssessment']) {
      this.isPreAssessment = true
    } else {
      this.isPreAssessment = false
    }

    // this.toggleAccessibilityAndChatbot()
  }

  toggleAccessibilityAndChatbot(hid: boolean) {
    const hide = hid
    const classNames = ['userway_p2', 'chatbot-icon-container', 'chatbot-icon-ai']

    setTimeout(() => {
      classNames.forEach(className => {
        const elements = document.getElementsByClassName(className)

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement

          if (hide) {
            el.style.setProperty('display', 'none', 'important')
          } else {
            el.style.removeProperty('display')
          }
        }
      })
    }, 100)
  }

  checkMultilingual() {
    if (this.activatedRoute.snapshot.queryParams && this.activatedRoute.snapshot.queryParams.ML
      && this.activatedRoute.snapshot.queryParams.MLId
    ) {
      if (this.collectionId !== this.activatedRoute.snapshot.queryParams.MLId) {
        this.widgetServ.fetchContentData(this.collectionId || '').subscribe(data => {
          this.baseContentReadData = data?.result?.content
        })
      } else {
        if (this.activatedRoute.snapshot.data['contentRead']['data']) {
          this.baseContentReadData = this.activatedRoute.snapshot.data['contentRead']['data']['result']['content']
        }

      }
    } else {
      if (this.activatedRoute.snapshot.data['contentRead']['data']) {
        this.baseContentReadData = this.activatedRoute.snapshot.data['contentRead']['data']['result']['content']
      }
    }
  }

  getContentData(e: any) {
    if (this.activatedRoute.snapshot.data && this.activatedRoute.snapshot.data['preAssessmentRead'] &&
      this.activatedRoute.snapshot.data['preAssessmentRead']['data'] &&
      this.activatedRoute.snapshot.data['preAssessmentRead']['data']['result'] &&
      this.activatedRoute.snapshot.data['preAssessmentRead']['data']['result']['content']
    ) {
      this.content = this.activatedRoute.snapshot.data['preAssessmentRead']['data']['result']['content']

      if (this.content) {
        let hashMap = this.tocSvc.hashmap
        // console.log('hasMap', hashMap)
        // console.log(hashMap[this.activatedRoute.snapshot.data['preAssessmentRead']['data']['result']['content']['identifier']])
        if (!hashMap[this.activatedRoute.snapshot.data['preAssessmentRead']['data']['result']['content']['identifier']]) {
          this.tocSvc.createPreAssessmentHirarchyProgressHashmap(this.activatedRoute.snapshot.data['contentRead']['data']['result']['content'])
        }
      }
      this.contentMIMEType = this.activatedRoute.snapshot.data['preAssessmentRead']['data']['result']['content']['mimeType']
      // console.log('this.content', this.content)
      // console.log('this.contentMIMEType', this.contentMIMEType)
      this.hierarchyData = this.activatedRoute.snapshot.data['contentRead']['data']['result']['content']['preEnrolmentResources']
      this.getPreEnrollmentResoureStateRead()
      // console.log('tocSvc?.hashmap', this.tocSvc?.hashmap)
      // console.log('this.hierarchyData', this.hierarchyData)

      this.resetAndFetchTocStructure()
      // console.log('tocStructure', this.tocStructure)
    } else {
      e.activatedRoute.data.subscribe((data: { content: { data: NsContent.IContent } }) => {
        // console.log('this.content',data)
        if (data.content && data.content.data) {
          this.content = data.content.data

          this.contentMIMEType = data.content.data.mimeType
        }
      })
    }
  }

  getAuthDataIdentifer() {
    if (this.isPreAssessment) {


    } else {
      const collectionId = this.activatedRoute.snapshot.queryParams.collectionId
      this.widgetServ.fetchAuthoringContent(collectionId).subscribe((data: any) => {
        if (data.result.content.cstoken) {
          this.configSvc.cstoken = data.result.content.cstoken
        }
        // compute total leaf nodes across hierarchy (handles learning pathway)
        const source = this.hierarchyData || data.result.content
        this.leafNodesCount = this.countLeafNodes(source) || 0
      })
    }

  }

  syncMilestoneLockStatus() {
    if (!this.hierarchyData || !this.hierarchyData.children) return

    // Create new references for change detection
    this.hierarchyData = {
      ...this.hierarchyData,
      children: this.hierarchyData.children.map((child: any) => {
        if (child.primaryCategory === 'Milestone' && child.identifier) {
          const hashData = this.tocSvc.hashmap[child.identifier]
          if (hashData && hashData.computedIsLocked !== undefined) {
            return { ...child, isLocked: hashData.computedIsLocked }
          }
        }
        return child
      })
    }
    console.log('✅ Milestone locks recomputed from hashmap')
  }
  async ngOnInit() {

    // this.routeChangeSubscription = this.router.events
    //   .pipe(filter(event => event instanceof NavigationEnd))
    //   .subscribe(() => {

    //     // update flags based on current URL
    //     const url = this.router.url

    //     this.isAssessmentScreen = url.includes('viewer/practice')
    //     this.isPreAssessment = this.activatedRoute.snapshot.queryParams?.['preAssessment']

    //     this.toggleAccessibilityAndChatbot()
    //   })

    this.getTocConfig()
    // for left side player scroll on right side resource click
    // this.pageScrollSubscription = this.tocSvc.updatePageScroll.subscribe((value: boolean) => {
    //   if (value) {
    //     setTimeout(() => {
    //       if (document.getElementsByClassName('viewer-player-container') &&
    //         document.getElementsByClassName('viewer-player-container')[0])  {
    //         document.getElementsByClassName('viewer-player-container')[0].scrollIntoView({
    //           behavior: 'smooth',
    //           block: 'start',
    //           inline: 'start',
    //        })
    //       }
    //     },         1000)
    //   }
    // })
    // console.log('this.activatedRoute.snapshot.data.contentRead--', this.activatedRoute.snapshot.data.contentRead)
    const contentData = this.activatedRoute.snapshot.data.hierarchyData
      && this.activatedRoute.snapshot.data.hierarchyData.data || ''

    this.enrollmentList = this.activatedRoute.snapshot.data.enrollmentData
      && this.activatedRoute.snapshot.data.enrollmentData.data || ''
    this.contentReadData = this.activatedRoute.snapshot.data && this.activatedRoute.snapshot.data.contentRead
      && this.activatedRoute.snapshot.data.contentRead.data?.result.content || {}
    if (contentData && contentData.result && contentData.result.content) {
      this.coursePrimaryCategory = contentData.result.content.courseCategory
      if (contentData.result.content.children && contentData.result.content.children.length) {
        this.compatibilityLevel = contentData.result.content.children[0]['compatibilityLevel']
      }
      if (this.contentReadData?.courseCategory === NsContent.ECourseCategory.LEARNING_PATHWAY) {
        this.hierarchyData = this.tocV2Svc.constructHeirarchyData(this.contentReadData)
        this.tocV2Svc.mapContentHierarchyProgressUpdate(this.hierarchyData, this.enrollmentList?.courses)
        // Create hashmap and compute milestone locking after progress is updated
        this.tocSvc.callHirarchyProgressHashmap(this.hierarchyData)
        const isEnrolled = true
        // Compute milestone locking status with enrollment status and updated progress data
        this.tocSvc.computeMilestoneLockingStatus(isEnrolled)
        // Sync content tree's isLocked with computed values
        this.syncMilestoneLockStatus()
        this.leafNodesCount = (this.hierarchyData.leafNodes && Array.isArray(this.hierarchyData.leafNodes))
          ? this.hierarchyData.leafNodes.length
          : 0
        console.debug('Learning Pathway leafNodesCount from hierarchyData.leafNodes:', this.leafNodesCount)
      } else {
        this.hierarchyData = contentData.result.content
        this.leafNodesCount = contentData.result.content.leafNodesCount

        // CRITICAL: For regular courses, call manipulateHierarchyData which does the mapping
        await this.manipulateHierarchyData()


        // manipulateHierarchyData created the hashmap, but we need to add the root entry
        // and get completion data from enrollment list (like TOC does)
        if (this.enrollmentList && this.enrollmentList.courses && this.collectionId) {
          const enrolledCourse = this.enrollmentList.courses.find((c: any) =>
            c.identifier === this.collectionId ||
            c.content?.identifier === this.collectionId ||
            c.courseId === this.collectionId
          )


          if (enrolledCourse) {
            // Add root course entry to hashmap with actual completion data from enrollment
            if (!this.tocSvc.hashmap[this.collectionId]) {
              this.tocSvc.hashmap[this.collectionId] = {
                identifier: this.collectionId,
                leafNodesCount: this.leafNodesCount,
                leafNodes: this.hierarchyData?.leafNodes || [],
                completionPercentage: enrolledCourse.completionPercentage || 0,
                completionStatus: enrolledCourse.status || 0,
                name: this.hierarchyData?.name || '',
                primaryCategory: this.hierarchyData?.primaryCategory || '',
                courseCategory: this.hierarchyData?.courseCategory || '',
                mimeType: this.hierarchyData?.mimeType || '',
                artifactUrl: this.hierarchyData?.artifactUrl || null,
                contentType: this.hierarchyData?.contentType || '',
                expectedDuration: this.hierarchyData?.expectedDuration || 0,
                isLocked: false,
                isCollection: true,
                isModule: false,
                isResource: false,
                isMilestone: false,
                isLearningPathway: false,
              }
            }

            // Update completion data for leaf nodes from enrollment's contentStatus
            // Check multiple sources: contentList, langContentStatus, or contentStatus
            let contentStatusMap: any = {}

            // Priority 1: Build from contentList array (most reliable)
            if (enrolledCourse.contentList && Array.isArray(enrolledCourse.contentList)) {
              enrolledCourse.contentList.forEach((item: any) => {
                if (item.contentId && item.status !== undefined) {
                  contentStatusMap[item.contentId] = item.status
                }
              })
            }

            // Priority 2: Check langContentStatus (for multilingual courses)
            if (Object.keys(contentStatusMap).length === 0 && enrolledCourse.langContentStatus) {
              const lang = enrolledCourse.recent_language || 'english'
              if (enrolledCourse.langContentStatus[lang]) {
                contentStatusMap = enrolledCourse.langContentStatus[lang]
              }
            }

            // Priority 3: Fall back to contentStatus
            if (Object.keys(contentStatusMap).length === 0 && enrolledCourse.contentStatus) {
              contentStatusMap = enrolledCourse.contentStatus
            }

            // Apply the completion data to leaf nodes
            if (Object.keys(contentStatusMap).length > 0) {
              Object.keys(contentStatusMap).forEach((contentId: string) => {
                if (this.tocSvc.hashmap[contentId]) {
                  const status = contentStatusMap[contentId]
                  this.tocSvc.hashmap[contentId].completionStatus = status || 0
                  this.tocSvc.hashmap[contentId].status = status || 0
                  this.tocSvc.hashmap[contentId].completionPercentage = status === 2 ? 100 : 0

                }
              })
            }

          }
        }

        // Set hierarchyMapData for child components
        this.hierarchyMapData = { ...this.tocSvc.hashmap }
      }
      this.resetAndFetchTocStructure()
      // Recompute leafNodesCount after hierarchy has been fully manipulated
      try {
        // For Learning Pathways, always use hierarchyData.leafNodes.length
        if (this.contentReadData?.courseCategory === NsContent.ECourseCategory.LEARNING_PATHWAY) {
          this.leafNodesCount = (this.hierarchyData.leafNodes && Array.isArray(this.hierarchyData.leafNodes))
            ? this.hierarchyData.leafNodes.length
            : 0
        } else {
          this.leafNodesCount = this.countLeafNodes(this.hierarchyData) || 0
        }
        // Debug logs to help verify structure during testing
        // tslint:disable-next-line: no-console
        console.debug('Computed leafNodesCount:', this.leafNodesCount)
        // tslint:disable-next-line: no-console
        console.debug('Hierarchy sample:', this.hierarchyData && (this.hierarchyData.children || this.hierarchyData.milestones_v1 ? (this.hierarchyData.children || this.hierarchyData.milestones_v1) : this.hierarchyData))
        // Ensure toc hashmap reflects aggregated leafNodesCount so top-bar displays correct total
        try {
          const mlId = this.activatedRoute.snapshot.queryParams.MLId ? this.activatedRoute.snapshot.queryParams.MLId : this.collectionId
          if (mlId && this.tocSvc && this.tocSvc.hashmap) {
            // Create entry if it doesn't exist
            if (!this.tocSvc.hashmap[mlId]) {
              this.tocSvc.hashmap[mlId] = {
                identifier: mlId,
                leafNodesCount: this.leafNodesCount,
                leafNodes: this.hierarchyData?.leafNodes || [],
                completionPercentage: 0,
                completionStatus: 0,
                name: this.hierarchyData?.name || '',
                primaryCategory: this.hierarchyData?.primaryCategory || '',
                courseCategory: this.hierarchyData?.courseCategory || '',
              }
            }
            this.tocSvc.hashmap[mlId]['leafNodesCount'] = this.leafNodesCount
            this.tocSvc.hashmap = { ...this.tocSvc.hashmap }
            // Initialize local hierarchyMapData for child components
            this.hierarchyMapData = { ...this.tocSvc.hashmap }
          }
        } catch (_e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    }
    this.languageList = this.contentLangSvc.getAllContentLanguages(this.contentReadData)
    this.checkMultilingual()
    if (this.collectionId && this.enrollmentList) {
      const enrolledCourseData = this.widgetLibServ.getEnrolledDataFromList(this.enrollmentList.courses, this.collectionId)
      this.enrolledCourseData = enrolledCourseData
      if (enrolledCourseData && enrolledCourseData.batch) {
        this.batchData = {
          content: [enrolledCourseData.batch],
          enrolled: true,
        }
        if (!this.forPreview) {
          this.tocSvc.mapSessionCompletionPercentage(this.batchData)
        }
      } else if (this.contentReadData?.courseCategory === NsContent.ECourseCategory.LEARNING_PATHWAY) {
        // For Learning Pathways, check if any course in the pathway is enrolled
        // This ensures isEnrolled is correctly set for milestone locking computation
        const hasAnyEnrollment = this.enrollmentList.courses && this.enrollmentList.courses.length > 0
        if (hasAnyEnrollment) {
          this.batchData = {
            content: [],
            enrolled: true,
          }
        }
      }
    }

    this.pdfScormDataService.handleBackFromPdfScormFullScreen.subscribe((data: any) => {
      this.handleBackFromPdfScormFullScreenFlag = data
    })

    this.viewerHeaderSideBarToggleService.visibilityStatus.subscribe((data: any) => {
      const sideNavBarDrawerState: any = document.getElementById('side-nav-drawer-state')

      if (data) {
        if (this.isMobile) {
          this.sideNavBarOpened = false
          this.viewerHeaderSideBarToggleFlag = data
        } else {
          this.sideNavBarOpened = true
          this.viewerHeaderSideBarToggleFlag = data
        }
        if (sideNavBarDrawerState) {
          sideNavBarDrawerState.style.display = 'block'
        }
        this.toggleAccessibilityAndChatbot(false)
      } else {
        this.sideNavBarOpened = false
        this.viewerHeaderSideBarToggleFlag = data
        if (sideNavBarDrawerState) {
          sideNavBarDrawerState.style.display = 'none'

        }
        this.toggleAccessibilityAndChatbot(true)


      }


    })
    if (this.collectionId) {
      this.getAuthDataIdentifer()
    }
    // this.getEnrollmentList()
    this.isNotEmbed = !(
      window.location.href.includes('/embed/') ||
      this.activatedRoute.snapshot.queryParams.embed === 'true'
    )
    this.isTypeOfCollection = this.activatedRoute.snapshot.queryParams.collectionType ? true : false
    this.screenSizeSubscription = this.isLtMedium$.subscribe(isSmall => {
      // this.sideNavBarOpened = !isSmall
      this.sideNavBarOpened = isSmall ? false : true
      this.mode = isSmall ? 'over' : 'side'
    })

    this.resourceChangeSubscription = this.dataSvc.changedSubject.subscribe(_ => {
      this.status = this.dataSvc.status
      this.error = this.dataSvc.error
      if (this.error && this.error.status) {
        switch (this.error.status) {
          case 403: {
            this.errorWidgetData.widgetData.errorType = ErrorType.accessForbidden
            break
          }
          case 404: {
            this.errorWidgetData.widgetData.errorType = ErrorType.notFound
            break
          }
          case 500: {
            this.errorWidgetData.widgetData.errorType = ErrorType.internalServer
            break
          }
          case 503: {
            this.errorWidgetData.widgetData.errorType = ErrorType.serviceUnavailable
            break
          }
          default: {
            this.errorWidgetData.widgetData.errorType = ErrorType.somethingWrong
            break
          }
        }
      }
      if (this.error && this.error.errorType === this.errorType.mimeTypeMismatch) {
        setTimeout(() => {
          this.router.navigate([this.error.probableUrl])
          // tslint:disable-next-line: align
        }, 3000)
      }
      if (this.error && this.error.errorType === this.errorType.previewUnAuthorised) {
      }
    })

    // Subscribe to hashmap updates for real-time progress synchronization
    // Use the observable pattern (hashmapUpdated$) for proper change detection
    this.hashmapUpdatedSubscription = this.tocSvc.hashmapUpdated$.subscribe((updatedHashmap: any) => {
      if (updatedHashmap) {
        // Update local hierarchyMapData to trigger Angular change detection
        // This ensures child components (viewer-top-bar, toc) receive updated data
        this.hierarchyMapData = { ...this.tocSvc.hashmap }

        if (this.contentReadData?.courseCategory === NsContent.ECourseCategory.LEARNING_PATHWAY) {
          // Sync lock status from hashmap to hierarchyData content tree
          this.syncMilestoneLockStatus()
        }

        // Force change detection to update UI
        this.changeDetector.detectChanges()
        console.log('🔄 [VIEWER] Hashmap updated - hierarchyMapData refreshed for child components')
      }
    })

    // Listen for progress updates to recompute milestone locking
    // No need to fetch enrollment data - hashmap already has updated progress
    this.progressUpdateSubscription = this.viewerUtilSvc.markAsCompleteSubject.subscribe(() => {
      if (this.contentReadData?.courseCategory === NsContent.ECourseCategory.LEARNING_PATHWAY) {
        console.log('🔄 [VIEWER] Content completed - recalculating parent progress and milestone locks')

        // CRITICAL: Recalculate parent progress when content completes
        // This ensures that when videos/audios complete, the parent course progress updates
        // which then allows milestone assessments to unlock
        try {
          const currentResourceId = this.activatedRoute.snapshot.paramMap.get('resourceId')
          if (currentResourceId && this.tocSvc.hashmap && this.tocSvc.hashmap[currentResourceId]) {
            const currentResource = this.tocSvc.hashmap[currentResourceId]
            console.log('📊 [VIEWER] Current resource completed:', {
              id: currentResourceId,
              name: currentResource.name,
              parent: currentResource.parent
            })

            // Recalculate parent progress recursively
            if (currentResource.parent && this.tocSvc.hashmap[currentResource.parent]) {
              this.recalculateParentProgressRecursive(currentResource.parent)
            }
          } else {
            console.log('ℹ️ [VIEWER] No current resource found in hashmap, skipping parent progress recalculation')
          }
        } catch (error) {
          console.error('❌ [VIEWER] Error recalculating parent progress:', error)
        }

        // Hashmap already updated by viewer-util.service after progress update
        // Just recompute milestone locking with existing data
        const isEnrolled = true
        this.tocSvc.computeMilestoneLockingStatus(isEnrolled)

        // Sync lock status from hashmap to content tree
        this.syncMilestoneLockStatus()

        // Force change detection
        this.changeDetector.detectChanges()

        console.log('✅ [VIEWER] Parent progress recalculated and milestone locks recomputed')
      }
    })

    // if (this.collectionId) {
    //   if (!this.forPreview) {
    //     const enrollCourseData = this.enrolledCourseData
    //     if (enrollCourseData && (enrollCourseData.completionPercentage === 100 || enrollCourseData.status === 2)) {
    //       this.downloadCertificate(enrollCourseData)
    //     }
    //   }
    // }
  }

  ngAfterViewChecked() {
    const container = document.getElementById('fullScreenContainer')
    if (container) {
      this.fullScreenContainer = container
      this.changeDetector.detectChanges()
    } else {
      this.fullScreenContainer = null
      this.changeDetector.detectChanges()
    }
  }

  /**
   * Recalculates parent (course/module/milestone) progress after child content completes
   * This ensures that when regular resources (videos, audios, etc.) complete,
   * the parent course progress updates, which then triggers milestone lock recalculation
   */
  recalculateParentProgressRecursive(parentId: string) {
    // Safety checks
    if (!this.tocSvc || !this.tocSvc.hashmap) {
      console.log('⚠️ [VIEWER PROGRESS] TOC service or hashmap not available')
      return
    }

    const parentData = this.tocSvc.hashmap[parentId]
    if (!parentData) {
      console.log('⚠️ [VIEWER PROGRESS] Parent not found in hashmap:', parentId)
      return
    }

    console.log('📊 [VIEWER PROGRESS] Recalculating progress for parent:', {
      name: parentData.name,
      id: parentId,
      primaryCategory: parentData.primaryCategory,
      currentCompletionPercentage: parentData.completionPercentage,
      currentCompletionStatus: parentData.completionStatus
    })

    // Get all children of this parent
    let allChildren = Object.keys(this.tocSvc.hashmap)
      .filter(key => this.tocSvc.hashmap[key].parent === parentId)
      .map(key => ({
        ...this.tocSvc.hashmap[key],
        identifier: key
      }))

    if (allChildren.length === 0) {
      console.log('⚠️ [VIEWER PROGRESS] No children found for parent')
      return
    }

    console.log('📊 [VIEWER PROGRESS] Found', allChildren.length, 'total children')

    // CRITICAL: For milestones, only count mandatory courses and milestone assessments
    // Non-mandatory courses should NOT block milestone completion
    let children = allChildren
    if (parentData.primaryCategory === 'Milestone') {
      children = allChildren.filter(child => {
        // Include if:
        // 1. It's a mandatory course (isMandatory === true)
        // 2. It's a milestone assessment (Course Assessment with parent=milestone)
        const isMandatory = child.isMandatory === true
        const isMilestoneAssessment = child.primaryCategory === 'Course Assessment'
        return isMandatory || isMilestoneAssessment
      })
      console.log('📊 [VIEWER PROGRESS] Milestone: Filtering to mandatory + assessments only:', children.length, 'items')
    }

    // Calculate how many children are complete
    let completedCount = 0
    const totalCount = children.length

    children.forEach((child, index) => {
      const isComplete = (child.completionStatus === 2 || child.status === 2 || child.completionPercentage === 100)
      console.log(`   ${index + 1}. ${child.name || child.identifier}:`, {
        primaryCategory: child.primaryCategory,
        isMandatory: child.isMandatory,
        completionStatus: child.completionStatus,
        status: child.status,
        completionPercentage: child.completionPercentage,
        isComplete: isComplete ? '✅' : '❌'
      })

      if (isComplete) {
        completedCount++
      }
    })

    // Calculate parent's completion percentage
    const newCompletionPercentage = Math.round((completedCount / totalCount) * 100)
    const newCompletionStatus = newCompletionPercentage === 100 ? 2 : (newCompletionPercentage > 0 ? 1 : 0)

    // Update parent's progress if it changed
    if (parentData.completionPercentage !== newCompletionPercentage ||
      parentData.completionStatus !== newCompletionStatus) {

      parentData.completionPercentage = newCompletionPercentage
      parentData.completionStatus = newCompletionStatus
      parentData.status = newCompletionStatus

      console.log('✅ [VIEWER PROGRESS] Updated parent progress:', {
        name: parentData.name,
        newPercentage: newCompletionPercentage + '%',
        newStatus: newCompletionStatus
      })

      // Create new hashmap reference for Angular change detection
      this.tocSvc.hashmap = { ...this.tocSvc.hashmap }

      // Recursively update grandparent (milestone) if parent changed
      if (parentData.parent && this.tocSvc.hashmap[parentData.parent]) {
        console.log('📊 [VIEWER PROGRESS] Recursively updating grandparent:', this.tocSvc.hashmap[parentData.parent]?.name)
        this.recalculateParentProgressRecursive(parentData.parent)
      }
    } else {
      console.log('ℹ️ [VIEWER PROGRESS] No change in parent progress, skipping update')
    }
  }

  ngOnDestroy() {
    this.rootSvc.showNavbarDisplay$.next(true)
    if (this.screenSizeSubscription) {
      this.screenSizeSubscription.unsubscribe()
    }
    if (this.resourceChangeSubscription) {
      this.resourceChangeSubscription.unsubscribe()
    }
    if (this.pageScrollSubscription) {
      this.pageScrollSubscription.unsubscribe()
    }
    if (this.hashmapUpdatedSubscription) {
      this.hashmapUpdatedSubscription.unsubscribe()
    }
    if (this.progressUpdateSubscription) {
      this.progressUpdateSubscription.unsubscribe()
    }
    const classNames = ['userway_p2', 'chatbot-icon-container', 'chatbot-icon-ai']

    classNames.forEach(className => {
      const elements = document.getElementsByClassName(className)

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement

        el.style.removeProperty('display')   // restore original display
        el.style.pointerEvents = 'auto'      // allow clicks
      }
    })

    localStorage.removeItem('currentPlayerTrackLabel')
    localStorage.removeItem('currentPlayerTrackLangugage')
    localStorage.removeItem('currentPlayerSubtitleOff')
  }

  downloadCertificate(courseData: any): void {
    if (courseData && courseData.issuedCertificates && courseData.issuedCertificates.length) {
      const certificate: any = courseData.issuedCertificates.sort((a: any, b: any) =>
        new Date(a.lastIssuedOn).getTime() - new Date(b.lastIssuedOn).getTime())

      const certificateId = certificate?.issuedCertificates?.[0].identifier
      this.widgetServ.downloadCert(certificateId).subscribe((response: any) => {
        if (this.content) {
          this.content['certificateObj'] = {
            certData: response.result.printUri,
            certId: certificateId,
          }
        }

        if (this.hierarchyData) {
          this.hierarchyData['certificateObj'] = {
            certData: response.result.printUri,
            certId: certificateId,
          }
        }
      })
    }

  }

  getTocConfig() {
    const url = `${this.configSvc.sitePath}/feature/toc.json`
    this.widgetServ.fetchConfig(url).subscribe(data => {
      this.tocConfig = data
      this.widgetServ.updateTocConfig(data)
    })
  }

  toggleSideBar() {
    this.sideNavBarOpened = !this.sideNavBarOpened
    this.sideNavForAIOpened = !this.sideNavForAIOpened
  }

  getEnrollmentList() {
    let userId
    if (this.configSvc.userProfile) {
      userId = this.configSvc.userProfile.userId || ''
    }
    this.userSvc.fetchUserBatchList(userId).subscribe(
      (result: any) => {
        const courses: NsContent.ICourse[] = result && result.courses
        this.widgetServ.currentBatchEnrollmentList = courses
      })
  }

  minimizeBar() {
    if (this.utilitySvc.isMobile) {
      this.sideNavBarOpened = false
    }
  }

  get isPreview(): boolean {
    this.forPreview = window.location.href.includes('/public/') || window.location.href.includes('&preview=true')
    return this.forPreview
  }

  updatePathSet(event: any) {
    // console.log('event', event)
    if (event && event.pathSet) {
      this.pathSet = event.pathSet
    }
  }

  async manipulateHierarchyData() {
    if (!this.forPreview) {
      // First, map completion percentage to hierarchy structure
      await this.tocSvc.mapCompletionPercentageProgram(this.hierarchyData, this.enrollmentList.courses, this.collectionId || '')

      // Then check and update module-wise data
      this.tocSvc.checkModuleWiseData(this.hierarchyData)

      // CRITICAL: Create the initial hashmap which will contain the completion data
      // This is what the TOC page does - it creates hashmap after mapping completion
      this.tocSvc.createHirarchyProgressHashmap(this.hierarchyData)

      this.content = this.hierarchyData

    } else {
      this.loadAllHierarchyData = true
      this.tocSvc.contentLoader.next(true)
      await this.tocSvc.fetchCourseHeirarchy(this.hierarchyData)
      this.tocSvc.contentLoader.next(false)
      this.tocSvc.checkModuleWiseData(this.hierarchyData)
      this.tocSvc.createHirarchyProgressHashmap(this.hierarchyData)
      this.loadAllHierarchyData = false
    }
  }

  resetAndFetchTocStructure() {
    this.tocStructure = {
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
    if (this.hierarchyData) {
      this.hasTocStructure = false
      this.tocStructure.learningModule = this.hierarchyData.primaryCategory === NsContent.EPrimaryCategory.MODULE ? -1 : 0
      this.tocStructure.course = this.hierarchyData.primaryCategory === NsContent.EPrimaryCategory.COURSE ? -1 : 0
      this.tocStructure = this.tocSvc.getTocStructure(this.hierarchyData, this.tocStructure)
      for (const progType in this.tocStructure) {
        if (this.tocStructure[progType] > 0) {
          this.hasTocStructure = true
          break
        }
      }
    }
  }

  private countLeafNodes(node: any): number {
    // Build a unique set of leaf identifiers to avoid double counting.
    const ids = new Set<string>()
    if (!node) {
      return 0
    }

    const traverse = (n: any) => {
      if (!n) {
        return
      }
      // If node has explicit leafNodes (array of ids), add them
      if (n.leafNodes && Array.isArray(n.leafNodes)) {
        for (const id of n.leafNodes) {
          if (id) {
            ids.add(id)
          }
        }
      }

      // If node has children, recurse
      if (n.children && Array.isArray(n.children)) {
        for (const child of n.children) {
          traverse(child)
        }
      }

      // milestones_v1 -> courses (Learning Pathway specific)
      if (n.milestones_v1 && Array.isArray(n.milestones_v1)) {
        for (const m of n.milestones_v1) {
          if (m.courses && Array.isArray(m.courses)) {
            for (const course of m.courses) {
              traverse(course)
            }
          }
        }
      }

      // If node is a standalone content item (no children/leafNodes), count its own identifier
      const hasLeafNodes = n.leafNodes && n.leafNodes.length
      const hasChildren = n.children && n.children.length
      const isStructural = n.primaryCategory === 'Course' || n.primaryCategory === 'Module' || n.primaryCategory === 'Program'
      if (!isStructural && !hasLeafNodes && !hasChildren && n.identifier) {
        ids.add(n.identifier)
      }
    }

    // If an array is passed, traverse each entry
    if (Array.isArray(node)) {
      for (const n of node) {
        traverse(n)
      }
      return ids.size
    }

    traverse(node)
    return ids.size
  }

  updateCount(event: any) {
    this.completedCount = event
  }

  navigateToBack() {
    this.viewerHeaderSideBarToggleService.visibilityStatus.next(true)
    window.history.back()
  }



  getPreEnrollmentResoureStateRead() {
    let identifierArr: any = []
    this.hierarchyData.map((item: any) => {
      identifierArr.push(item.identifier)
    })
    if (identifierArr && identifierArr.length) {
      let req = {
        "request": {
          "contentIds": identifierArr,
          "fields": [
            // "lastAccessTime",
            // "completionPercentage"
          ]
        }
      }
      this.tocSvc.readPreEnrollmentResourcesState(req).subscribe((data: any) => {
        // console.log('read resources progress data', data)
        if (data && data.result && data.result.contentList) {
          for (let i = 0; i < data.result.contentList.length; i++) {
            if (Object.keys(this.tocSvc.hashmap) && Object.keys(this.tocSvc.hashmap).length && this.tocSvc.hashmap[data.result.contentList[i]['contentId']]) {
              this.tocSvc.hashmap[data.result.contentList[i]['contentId']]['completionPercentage'] = data.result.contentList[i]['completionPercentage']
              this.tocSvc.hashmap[data.result.contentList[i]['contentId']]['completionStatus'] = Number(data.result.contentList[i]['status']) || 0
            }
          }
        }
      })
    }

  }

}
