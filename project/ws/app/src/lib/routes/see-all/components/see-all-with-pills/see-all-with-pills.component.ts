import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core'
import {
  ActivatedRoute,
} from '@angular/router'
// tslint:disable-next-line
import * as _ from 'lodash'
import { ConfigurationsService, EventService, MultilingualTranslationsService, WsEvents, NsContent } from '@sunbird-cb/utils-v2'
import { SeeAllService } from '../../services/see-all.service'
import { MatLegacyTabChangeEvent as MatTabChangeEvent } from '@angular/material/legacy-tabs'
import { NsContentStripWithTabsAndPills } from '@sunbird-cb/consumption/lib/_common/strips/content-strip-with-tabs-pills/content-strip-with-tabs-pills.model'
import { WidgetUserServiceLib } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-app-see-all-with-pills',
  templateUrl: './see-all-with-pills.component.html',
  styleUrls: ['./see-all-with-pills.component.scss'],
})
export class SeeAllWithPillsComponent  implements OnInit, OnDestroy {

  seeAllPageConfig: any
  keyData: any
  contentDataList: any = []
  throttle = 100
  scrollDistance = 0.2
  offsetForPage = 0
  totalCount = 0
  page = 1
  totalPages = 0
  tabResults: any[] = []
  tabSelected: any
  dynamicTabIndex = 0
  pillSelected: any
  pillResults: any[] = []
  dynamicPillIndex = 0

  constructor(
    private activated: ActivatedRoute,
    // private router: Router,
    private seeAllSvc: SeeAllService,
    private configSvc: ConfigurationsService,
    private eventSvc: EventService,
    private userSvc: WidgetUserServiceLib,
    private langtranslations: MultilingualTranslationsService,
  ) {

  }

  async ngOnInit() {
    this.activated.queryParams.subscribe((res: any) => {
      this.keyData = (res.key) ? res.key : ''
      this.tabSelected = (res.tabSelected) ? res.tabSelected : ''
      this.pillSelected = (res.pillSelected) ? res.pillSelected : ''
    })
    const configData = await this.seeAllSvc.getSeeAllConfigJson().catch(_error => {})
    // configData.homeStrips.forEach((ele: any) => {
    //   if (ele && ele.strips.length > 0) {
    //     ele.strips.forEach((subEle: any) => {
    //       if (subEle.key === this.keyData) {
    //         this.seeAllPageConfig = subEle
    //       }
    //     })
    //   }
    // })
    if (!this.seeAllPageConfig) {
      if (configData) {
        configData.assessmentData.forEach((ele: any) => {
          if (ele && ele.strips && ele.strips.length > 0) {
            ele.strips.forEach((subEle: any) => {
              if (subEle.key === this.keyData) {
                this.seeAllPageConfig = subEle
              }
            })
          }
        })
      }
    }
    if (!this.seeAllPageConfig) {
      if (configData) {
        configData.newHomeStrip.forEach((ele: any) => {
          if (ele && ele.strips && ele.strips.length > 0) {
            ele.strips.forEach((subEle: any) => {
              if (subEle.key === this.keyData) {
                this.seeAllPageConfig = subEle
              }
            })
          }
        })
      }
    }
    if (
      this.tabSelected &&
      this.seeAllPageConfig.tabs &&
      this.seeAllPageConfig.tabs.length
      ) {
        this.tabResults = this.seeAllPageConfig.tabs
        this.dynamicTabIndex = _.findIndex(this.tabResults, (v: any) => v.value === this.tabSelected)
      }
      if (
        this.tabSelected &&
        this.seeAllPageConfig.tabs &&
        this.seeAllPageConfig.tabs.length
        ) {
          this.pillResults = this.seeAllPageConfig.tabs[this.dynamicTabIndex].pillsData
          this.dynamicPillIndex = _.findIndex(this.pillResults, (v: any) => v.value === this.pillSelected)
          this.seeAllPageConfig.tabs[this.dynamicTabIndex].pillsData[this.dynamicPillIndex]['selected'] = true
        }
    this.contentDataList = this.transformSkeletonToWidgets(this.seeAllPageConfig)

    if (this.seeAllPageConfig.request && this.seeAllPageConfig.key === 'forYou') {
      this.fetchForYouData(this.seeAllPageConfig)
    } else if (this.seeAllPageConfig.request && this.seeAllPageConfig.key === 'continueLearning') {
      const tabIndex: any = this.dynamicTabIndex || 0
      const pillIndex: any = this.dynamicPillIndex || 0
      this.fetchUserEnrolledData(this.seeAllPageConfig, tabIndex, pillIndex)
    }

  }

  checkForDateFilters(filters: any) {
    if (filters && filters.hasOwnProperty('batches.endDate')) {
      // tslint:disable-next-line
      filters['batches.endDate']['>='] = eval(filters['batches.endDate']['>='])
    } else if (filters && filters.hasOwnProperty('batches.enrollmentEndDate')) {
      // tslint:disable-next-line
      filters['batches.enrollmentEndDate']['>='] = eval(filters['batches.enrollmentEndDate']['>='])
    }
    return filters
  }

  private getFiltersFromArray(v6filters: any) {
    const filters: any = {}
    if (v6filters.constructor === Array) {
      v6filters.forEach(((f: any) => {
        Object.keys(f).forEach(key => {
          filters[key] = f[key]
        })
      }))
      return filters
    }
    return v6filters
  }

  private transformSkeletonToWidgets(
    strip: any
  ) {
    return [1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10].map(_content => ({
      widgetType: 'card',
      widgetSubType: 'cardContent',
      widgetHostClass: 'mb-2',
      widgetData: {
        cardSubType: strip.viewMoreUrl &&  strip.viewMoreUrl.loaderConfig
        && strip.viewMoreUrl.loaderConfig.cardSubType || 'card-portrait-skeleton',
      },
    }))
  }

  private transformContentsToWidgets(
    contents: NsContent.IContent[],
    strip: any,
  ) {
    return (contents || []).map((content, idx) => ({
      widgetType: 'card',
      widgetSubType: 'cardContent',
      widgetHostClass: 'mb-2',
      widgetData: {
        content,
        ...(content.batch && {
          batch: content.batch,
        }),
        cardSubType: strip.viewMoreUrl &&  strip.viewMoreUrl.stripConfig
        && strip.viewMoreUrl.stripConfig.cardSubType,
        context: {
          pageSection: strip.key,
          position: idx,
        },
        intranetMode: strip.stripConfig && strip.stripConfig.intranetMode,
        deletedMode: strip.stripConfig && strip.stripConfig.deletedMode,
        contentTags: strip.stripConfig && strip.stripConfig.contentTags,
      },
    }))
  }

  private transformSearchV6FiltersV2(v6filters: any) {
    const filters: any = {}
    if (v6filters.constructor === Array) {
      v6filters.forEach(((f: any) => {
        Object.keys(f).forEach(key => {
          filters[key] = f[key]
        })
      }))
      return filters
    }
    return v6filters
  }

  async searchV6Request(strip: NsContentStripWithTabsAndPills.IContentStripUnit,
                        request: NsContentStripWithTabsAndPills.IContentStripUnit['request'],
                        _calculateParentStatus: boolean
  ): Promise <any> {
    const originalFilters: any = []
    // console.log('calling -- ')
    return new Promise <any>((resolve, reject) => {
      if (request && request.searchV6) {
        this.seeAllSvc.searchV6(request.searchV6).subscribe(results => {
          const showViewMore = Boolean(
            results.result.content && results.result.content.length > 5 && strip.stripConfig && strip.stripConfig.postCardForSearch,
          )
          const viewMoreUrl = showViewMore ?
            {
              path: strip.viewMoreUrl && strip.viewMoreUrl.path || '',
              queryParams: {
                tab: 'Learn',
                q: strip.viewMoreUrl && strip.viewMoreUrl.queryParams,
                f: request &&
                  request.searchV6 &&
                  request.searchV6.request &&
                  request.searchV6.request.filters ?
                  JSON.stringify(
                    this.transformSearchV6FiltersV2(
                      originalFilters,
                    )
                  ) :
                  {},
              },
            } :
            null
          resolve({
            results,
            viewMoreUrl,
          })
        },                                                  (error: any) => {
          reject(error)
        })
      }
    })
  }

  async fetchFromTrendingContent(strip: NsContentStripWithTabsAndPills.IContentStripUnit, calculateParentStatus = true) {
    if (strip.request && strip.request.trendingSearch && Object.keys(strip.request.trendingSearch).length) {
      // let originalFilters: any = []
      if (strip.request &&
        strip.request.trendingSearch &&
        strip.request.trendingSearch.request &&
        strip.request.trendingSearch.request.filters) {
        // originalFilters = strip.request.trendingSearch.request.filters
        strip.request.trendingSearch.request.filters = this.checkForDateFilters(strip.request.trendingSearch.request.filters)
        strip.request.trendingSearch.request.filters = this.getFiltersFromArray(
          strip.request.trendingSearch.request.filters,
        )
      }
      if (strip.tabs && strip.tabs.length) {
        // TODO: Have to extract requestRequired to outer level of tabs config
        const firstTab = strip.tabs[this.dynamicTabIndex]
        if (firstTab.requestRequired) {
          if (this.seeAllPageConfig.tabs) {
            const allTabs = this.seeAllPageConfig.tabs
            const currentTabFromMap = (allTabs && allTabs.length &&
               allTabs[this.dynamicTabIndex]) as NsContentStripWithTabsAndPills.IContentStripTab
            this.getTabDataByNewReqTrending(strip, this.dynamicTabIndex, 0, currentTabFromMap,
                                            calculateParentStatus)
          }
        }

      } else {
      try {
        const response = await this.trendingSearchRequest(strip, strip.request, calculateParentStatus)
        if (response && response.results && response.results.response) {
          const content = response.results.response[strip.request.trendingSearch.responseKey] || []
          this.contentDataList = this.transformContentsToWidgets(content, strip)
        }
      } catch (error) {}
      }
    }
  }

  onScrollEnd() {
    this.page += 1
    if (this.page <= this.totalPages) {
      if (this.contentDataList[0].widgetData.content) {
        if (this.seeAllPageConfig.request.searchV6) {
          this.offsetForPage = this.seeAllPageConfig.request.searchV6.request.limit + this.offsetForPage
          // this.fetchFromSearchV6(this.seeAllPageConfig)
        }
      }
    }
  }

  ngOnDestroy() {}

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabel(label.toLowerCase(), type, '')
  }

  fetchForYouData(strip: NsContentStripWithTabsAndPills.IContentStripUnit) {
    if (strip && strip.type === 'forYou') {
      if (strip.tabs && strip.tabs.length) {
        const tabIndex: any = this.dynamicTabIndex || 0
        const pillIndex: any = this.dynamicPillIndex || 0
        const tabData = strip.tabs[tabIndex]
        const pillData = tabData.pillsData[pillIndex]
        if (pillData.requestRequired) {
          if (this.seeAllPageConfig && this.seeAllPageConfig.tabs) {
            const allPills = this.seeAllPageConfig.tabs[tabIndex].pillsData
            const currenPillsFromMap = (allPills && allPills.length &&
              allPills[pillIndex]) as NsContentStripWithTabsAndPills.IContentStripTab
            if (currenPillsFromMap.request.searchV6) {
              this.getTabDataByNewReqSearchV6(strip, tabIndex, pillIndex, currenPillsFromMap, true)
            } else if (currenPillsFromMap.request.trendingSearch) {
              this.getTabDataByNewReqTrending(strip, tabIndex, pillIndex, currenPillsFromMap, true)
            }
          }
        }

      }
    }
  }

  async getTabDataByNewReqTrending(
    strip: NsContentStripWithTabsAndPills.IContentStripUnit,
    tabIndex: number,
    pillIndex: number,
    currentTab: NsContentStripWithTabsAndPills.IContentStripTab,
    calculateParentStatus: boolean
  ) {
    try {
      const response = await this.trendingSearchRequest(strip, currentTab.request, calculateParentStatus)
      if (response && response.results && response.results.response) {
        const content = response.results.response[currentTab.value] || []
        const widgets = this.transformContentsToWidgets(content, strip)

        if (this.seeAllPageConfig  && this.seeAllPageConfig.tabs) {
          const allTabs = this.seeAllPageConfig.tabs
          const allPills = this.seeAllPageConfig.tabs[tabIndex].pillsData
          this.resetSelectedPill(allPills)
          if (allTabs && allTabs.length && allTabs[tabIndex]) {
            if (allPills && allPills.length && allPills[pillIndex]) {
              allPills[pillIndex] = {
                ...allPills[pillIndex],
                widgets,
                fetchTabStatus: 'done',
                selected: true,
              }
            }
            allTabs[tabIndex] = {
              ...allTabs[tabIndex],
              widgets,
              fetchTabStatus: 'done',
            }
          }
        }
      } else {
        if (this.seeAllPageConfig  && this.seeAllPageConfig.tabs) {
          const allTabs = this.seeAllPageConfig.tabs
          const allPills = this.seeAllPageConfig.tabs[tabIndex].pillsData
          this.resetSelectedPill(allPills)
          if (allTabs && allTabs.length && allTabs[tabIndex]) {
            if (allPills && allPills.length && allPills[pillIndex]) {
              allPills[pillIndex] = {
                ...allPills[pillIndex],
                widgets: [],
                fetchTabStatus: 'done',
                selected: true,
              }
            }
            allTabs[tabIndex] = {
              ...allTabs[tabIndex],
              widgets: [],
              fetchTabStatus: 'done',
            }
          }
        }
        // this.processStrip(strip, [], 'done', calculateParentStatus, null);
      }
    } catch (_error) {
      // Handle errors
      // this.processStrip(strip, [], 'error', calculateParentStatus, null);
    }
  }

  async getTabDataByNewReqSearchV6(
    strip: NsContentStripWithTabsAndPills.IContentStripUnit,
    tabIndex: number,
    pillIndex: number,
    currentTab: NsContentStripWithTabsAndPills.IContentStripTab,
    calculateParentStatus: boolean
  ) {
    try {
      const response = await this.searchV6Request(strip, currentTab.request, calculateParentStatus)
      if (response && response.results) {
        const widgets = this.transformContentsToWidgets(response.results.result.content, strip)
        if (this.seeAllPageConfig  && this.seeAllPageConfig.tabs) {
          const allTabs = this.seeAllPageConfig.tabs
          const allPills = this.seeAllPageConfig.tabs[tabIndex].pillsData
          this.resetSelectedPill(allPills)
          if (allTabs && allTabs.length && allTabs[tabIndex]) {
            if (allPills && allPills.length && allPills[pillIndex]) {
              allPills[pillIndex] = {
                ...allPills[pillIndex],
                widgets,
                fetchTabStatus: 'done',
                selected: true,
              }
            }
            allTabs[tabIndex] = {
              ...allTabs[tabIndex],
              widgets,
              fetchTabStatus: 'done',
            }
          }
        }
      } else {
        // this.processStrip(strip, [], 'error', calculateParentStatus, null);
      }
    } catch (error) {
      // Handle errors
      // console.error('Error:', error);
    }
  }

  async trendingSearchRequest(strip: NsContentStripWithTabsAndPills.IContentStripUnit,
                              request: NsContentStripWithTabsAndPills.IContentStripUnit['request'],
                              _calculateParentStatus: boolean
    ): Promise<any> {
      const originalFilters: any = []
      return new Promise<any>((resolve, reject) => {
        if (request && request.trendingSearch) {
        // check for the request if it has dynamic values]
          if (request.trendingSearch.request.filters.organisation &&
          request.trendingSearch.request.filters.organisation.indexOf('<orgID>') >= 0
          ) {
          let userRootOrgId
          if (this.configSvc.userProfile) {
          userRootOrgId = this.configSvc.userProfile.rootOrgId
          }
          request.trendingSearch.request.filters.organisation = userRootOrgId
          }
          this.seeAllSvc.trendingContentSearch(request.trendingSearch).subscribe((result: any) => {
            let results: any = result
            const showViewMore = Boolean(
            results.result &&
            strip.request &&
            results.result[strip.request.trendingSearch.responseKey] &&
            results.result[strip.request.trendingSearch.responseKey].length > 5 &&
            strip.stripConfig && strip.stripConfig.postCardForSearch,
            )

            const viewMoreUrl = showViewMore
            ? {
            path: strip.viewMoreUrl && strip.viewMoreUrl.path || '',
            queryParams: {
            tab: 'Learn',
            q: strip.viewMoreUrl && strip.viewMoreUrl.queryParams,
            f:
            request &&
            request.trendingSearch &&
            request.trendingSearch.request &&
            request.trendingSearch.request.filters
            ? JSON.stringify(
            this.transformSearchV6FiltersV2(
            originalFilters,
            )
            )
            : {},
            },
            }
            : null

            const proccesedResult: any = []
            if (results && results.response && results.response.certifications) {
              results = { response: { certifications: proccesedResult } }
            }
            resolve({ results, viewMoreUrl })
          },                                                                     (error: any) => {
            if (error.error && error.error.status === 400) {
              // this.processStrip(strip, [], 'done', calculateParentStatus, null);
            }
            // this.processStrip(strip, [], 'done', calculateParentStatus, null)
            reject(error)
          })
        }
      })
    }
    resetSelectedPill(pillData: any) {
      if (pillData && pillData.length) {
        pillData.forEach((pill: any) => {
          pill['selected'] = false
        })
      }
    }

    pillClicked(stripMap: any,  pillIndex: any, tabIndex: any) {
      if (stripMap && stripMap.tabs && stripMap.tabs[tabIndex]) {
        stripMap.tabs[tabIndex].pillsData[pillIndex].fetchTabStatus = 'inprogress'
        stripMap.tabs[tabIndex].pillsData[pillIndex].tabLoading = true
        stripMap.showOnLoader = true
      }
      const currentTabFromMap: any = stripMap.tabs && stripMap.tabs[tabIndex]
      const currentPillFromMap: any = stripMap.tabs && stripMap.tabs[tabIndex].pillsData[pillIndex]
      const currentStrip = this.seeAllPageConfig

      if (currentStrip && currentTabFromMap && !currentTabFromMap.computeDataOnClick && currentPillFromMap) {
        if (currentPillFromMap.requestRequired && currentPillFromMap.request) {
          // call API to get tab data and process
          // this.processStrip(currentStrip, [], 'fetching', true, null)
          if (currentPillFromMap.request.searchV6) {
            this.getTabDataByNewReqSearchV6(currentStrip, tabIndex, pillIndex, currentPillFromMap, true)
          } else if (currentPillFromMap.request.trendingSearch) {
            this.getTabDataByNewReqTrending(currentStrip, tabIndex, pillIndex, currentPillFromMap, true)
          }
          // if (stripMap && stripMap.tabs && stripMap.tabs[tabEvent.index]) {
          //   stripMap.tabs[tabEvent.index].tabLoading = false;
          // }

        stripMap.tabs[tabIndex].pillsData[pillIndex].tabLoading = false
        } else {
          stripMap.tabs[tabIndex].pillsData[pillIndex].fetchTabStatus = 'done'
          stripMap.tabs[tabIndex].pillsData[pillIndex].tabLoading = false
          stripMap.showOnLoader = false
          this.resetSelectedPill(stripMap.tabs[tabIndex].pillsData)
          stripMap.tabs[tabIndex].pillsData[pillIndex]['selected'] = true
        }
      }
    }
    public tabClicked(tabEvent: MatTabChangeEvent, stripMap: any, _stripKey: string, pillIndex: any) {
      if (stripMap && stripMap.tabs && stripMap.tabs[tabEvent.index]) {
        stripMap.tabs[tabEvent.index].pillsData[pillIndex].fetchTabStatus = 'inprogress'
        stripMap.tabs[tabEvent.index].pillsData[pillIndex].tabLoading = true
        stripMap.showOnLoader = true
      }
      const data: WsEvents.ITelemetryTabData = {
        label: `${tabEvent.tab.textLabel}`,
        index: tabEvent.index,
      }
      this.eventSvc.raiseInteractTelemetry(
        {
          type: WsEvents.EnumInteractTypes.CLICK,
          subType: WsEvents.EnumInteractSubTypes.HOME_PAGE_STRIP_TABS,
          id: `${_.camelCase(data.label)}-tab`,
        },
        {},
        {
          module: WsEvents.EnumTelemetrymodules.HOME,
        }
      )

      const currentTabFromMap: any = stripMap.tabs && stripMap.tabs[tabEvent.index]
      const currentPillFromMap: any = stripMap.tabs && stripMap.tabs[tabEvent.index].pillsData[pillIndex]
      const currentStrip = this.seeAllPageConfig

      if (currentStrip && currentTabFromMap && !currentTabFromMap.computeDataOnClick && currentPillFromMap) {
        if (currentPillFromMap.requestRequired && currentPillFromMap.request) {
          // call API to get tab data and process
          // this.processStrip(currentStrip, [], 'fetching', true, null)
          if (currentPillFromMap.request.searchV6) {
            this.getTabDataByNewReqSearchV6(currentStrip, tabEvent.index, 0, currentPillFromMap, true)
          } else if (currentPillFromMap.request.trendingSearch) {
            this.getTabDataByNewReqTrending(currentStrip, tabEvent.index, 0, currentPillFromMap, true)
          }

        stripMap.tabs[tabEvent.index].pillsData[pillIndex].tabLoading = false
        } else if (currentTabFromMap.requestRequired && currentTabFromMap.request) {
          // call API to get tab data and process
          // this.processStrip(currentStrip, [], 'fetching', true, null)
          if (currentTabFromMap.request.enrollmentList) {
            this.fetchFromEnrollmentList(currentStrip,  tabEvent.index, pillIndex, currentTabFromMap,  true)
          } else if (currentTabFromMap.request.eventEnrollmentList) {
            this.fetchFromEventEnrollmentList(currentStrip,  tabEvent.index, pillIndex, currentTabFromMap, true)
          }

        stripMap.tabs[tabEvent.index].pillsData[pillIndex].tabLoading = false
        }
      }
    }

    getSelectedPillIndex(tabdata: any) {
      if (tabdata.pillsData && tabdata.pillsData.length) {
        const index = tabdata.pillsData.findIndex((pill: any) => {
            return pill.selected
        })
        return index
      }
      return 0
    }

  // MY learning Strip methods starts here
  fetchUserEnrolledData(strip: NsContentStripWithTabsAndPills.IContentStripUnit,
                        tabIndex: number, pillIndex: any, calculateParentStatus = true) {
    if (strip.request && strip.request.enrollmentList
      && Object.keys(strip.request.enrollmentList).length) {
      const tabMapData = {}
      if (strip && strip.tabs && strip.tabs.length) {
        if (strip.tabs[tabIndex].request && strip.tabs[tabIndex].request.enrollmentList) {
          this.fetchFromEnrollmentList(strip, tabIndex, pillIndex, tabMapData,  calculateParentStatus)
        } else if (strip.tabs[tabIndex].request && strip.tabs[tabIndex].request.eventEnrollmentList) {
          this.fetchFromEventEnrollmentList(strip, tabIndex, pillIndex, tabMapData, calculateParentStatus)
        }
      }
    }
  }
  fetchFromEventEnrollmentList(strip: NsContentStripWithTabsAndPills.IContentStripUnit,
                               tabIndex: number, _pillIndex: any, _tabMapData: any, calculateParentStatus = true) {
    let userId: any = ''
    // let viewMoreUrl : any = {}
    const content: NsContent.IContent[] = []
    const contentNew: NsContent.IContent[] = []
    const tabResults: any[] = []
    if (this.configSvc.userProfile) {
      userId = this.configSvc.userProfile.userId
    }
    this.userSvc.fetchEventEnrollData(userId).subscribe((res: any) => {
      if (res && res.result && res.result.events && res.result.events.length) {
        this.formatEnrollmentData(strip, tabIndex, [], content, contentNew , tabResults, calculateParentStatus)

      }
    },                                                  (_err: any) => {
    })
  }

  fetchFromEnrollmentList(strip: NsContentStripWithTabsAndPills.IContentStripUnit,
                          tabIndex: number, _pillIndex: any, _tabMapData: any, calculateParentStatus = true) {
    if (strip.request && strip.request.enrollmentList && Object.keys(strip.request.enrollmentList).length) {
      let userId = ''
      const content: NsContent.IContent[] = []
      const contentNew: NsContent.IContent[] = []
      const tabResults: any[] = []
      const queryParams = _.get(strip.request.enrollmentList, 'queryParams')

      if (this.configSvc.userProfile) {
        userId = this.configSvc.userProfile.userId
      }
      // this.userSvc.resetTime('enrollmentService')
      // tslint:disable-next-line: deprecation
      this.userSvc.fetchUserBatchList(userId, queryParams).subscribe(
        (result: any) => {
          this.userSvc.fetchExtEnrollData().subscribe((res: any) => {
            if (res && res.result && res.result.courses && res.result.courses.length) {
                const enrolledCourses = result && result.courses
                const enrolledExtCourses = res.result && res.result.courses
                const courses = [...enrolledExtCourses, ...enrolledCourses]
                this.formatEnrollmentData(strip, tabIndex, courses, content, contentNew , tabResults, calculateParentStatus)
          } else {
            const enrolledCourses = result && result.courses
            const courses = [...enrolledCourses]
            this.formatEnrollmentData(strip, tabIndex, courses, content, contentNew , tabResults, calculateParentStatus)

          }
        },                                            (_err: any) => {
          const enrolledCourses = result && result.courses
            const courses = [...enrolledCourses]
            this.formatEnrollmentData(strip, tabIndex, courses, content, contentNew , tabResults, calculateParentStatus)
        })
        }

      )
    }
  }

  formatEnrollmentData(strip: any, tabIndex: number,
                       courses: any, _content: any, _contentNew: any , _tabResults: any, _calculateParentStatus: any) {
    let formatConetent: any = []
    if (courses && courses.length) {
      formatConetent = courses.map((c: any) => {
        const contentTemp: NsContent.IContent = c.content || c.event || {}
        contentTemp.completionPercentage = c.completionPercentage || c.progress || 0
        contentTemp.completionStatus = c.completionStatus || c.status || 0
        contentTemp.enrolledDate = c.enrolledDate || ''
        contentTemp.lastContentAccessTime = c.lastContentAccessTime || ''
        contentTemp.lastReadContentStatus = c.lastReadContentStatus || ''
        contentTemp.lastReadContentId = c.lastReadContentId || ''
        contentTemp.lrcProgressDetails = c.lrcProgressDetails || ''
        contentTemp.issuedCertificates = c.issuedCertificates || []
        contentTemp.batchId = c.batchId || ''
        contentTemp.content = c.content || c.event || {}
        contentTemp.content.primaryCategory = c.content && c.content.primaryCategory || c.event && c.event.resourceType || ''
        return contentTemp
      })
    }
    // To sort in descending order of the enrolled date
    const formatContentNew = (formatConetent || []).sort((a: any, b: any) => {
      const dateA: any = new Date(a.lastContentAccessTime || 0)
      const dateB: any = new Date(b.lastContentAccessTime || 0)
      return dateB - dateA
    })

    if (strip.tabs && strip.tabs.length) {
      const formattedTabResults = this.splitEnrollmentTabsData(formatContentNew, tabIndex, strip)
      this.bindDataToVariable(formattedTabResults, tabIndex, this.dynamicPillIndex)

    }
  }

  splitEnrollmentTabsData(contentNew: NsContent.IContent[], tabIndex: any, strip: NsContentStripWithTabsAndPills.IContentStripUnit) {
    // const tabResults: any[] = [];
    const pillsResults: any[] = []
    const splitData = this.getInprogressAndCompleted(
      contentNew,
      (e: any) => e.completionStatus === 1 || e.completionPercentage < 100,
      strip,
    )

    if (strip.tabs && strip.tabs.length) {
      if (strip.tabs[tabIndex].pillsData && strip.tabs[tabIndex].pillsData.length) {

      for (let i = 0; i < strip.tabs[tabIndex].pillsData.length; i += 1) {
        if (strip.tabs[tabIndex].pillsData[i]) {
          pillsResults.push(
            {
              ...strip.tabs[tabIndex].pillsData[i],
              fetchTabStatus: 'done',
              tabLoading: false,
              ...(splitData.find(itmInner => {
                if (strip.tabs && strip.tabs[tabIndex].pillsData[i] && itmInner.value === strip.tabs[tabIndex].pillsData[i].value) {
                  return itmInner
                }
                return undefined
              })),
            }
          )
        }
      }
      }
      strip.tabs[tabIndex].pillsData = pillsResults
    }
    return strip.tabs
  }

  getInprogressAndCompleted(array: NsContent.IContent[],
                            customFilter: any,
                            strip: NsContentStripWithTabsAndPills.IContentStripUnit) {
                              const inprogress: any[] = []
    const completed: any[] = []
    // array.forEach((e: any, idx: number, arr: any[]) => (customFilter(e, idx, arr) ? inprogress : completed).push(e))
    array.forEach((e, idx, arr) => {
    const status = e.status ? (e.status as string).toLowerCase() : ''
    const statusRetired = status === 'retired'
    if (customFilter(e, idx, arr)) {
    if (!statusRetired) {
      inprogress.push(e)
    }
   } else {
    completed.push(e)
   }
    })
    // Sort the completed array with 'Live' status first and 'Retired' status second
    completed.sort((a: any, b: any) => {
      const statusA = a.status ? a.status.toLowerCase() : ''
      const statusB = b.status ? b.status.toLowerCase() : ''
      if (statusA === 'live' && statusB !== 'live') {
        return -1
      }
      if (statusA !== 'live' && statusB === 'live') {
        return 1
      }
      if (statusA === 'retired' && statusB !== 'retired') {
        return 1
      }
      if (statusA !== 'retired' && statusB === 'retired') {
        return -1
      }
      return 0
    })
    return [
      { value: 'inprogress', widgets: this.transformContentsToWidgets(inprogress, strip) },
      { value: 'completed', widgets: this.transformContentsToWidgets(completed, strip) }]
  }

  bindDataToVariable(tabsData: any, tabIndex: any, pillIndex: any) {
    this.resetSelectedPill(tabsData[tabIndex].pillsData)
    this.tabResults = tabsData
    tabsData[tabIndex].pillsData[pillIndex]['selected'] = true
    this.contentDataList = tabsData[tabIndex].pillsData[pillIndex].widgets
  }
}
