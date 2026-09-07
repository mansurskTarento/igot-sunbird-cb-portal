import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  NsContent,
} from '@sunbird-cb/collection'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { NsCardContent } from '@sunbird-cb/collection'
import { TranslateService } from '@ngx-translate/core'
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2'

import { WidgetUserServiceLib } from '@sunbird-cb/consumption'
import { IndexedDbService } from '@ws/app/src/lib/routes/search-v3/services/indexed-db.service'
import { InitService } from '../../services/init.service'
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)
@Component({
    selector: 'ws-cbp-plan',
    templateUrl: './cbp-plan.component.html',
    styleUrls: ['./cbp-plan.component.scss'],
    standalone: false
})
export class CbpPlanComponent implements OnInit {
  cbpConfig: any
  cbpAllConfig: any
  usersCbpCount: any
  upcommingList: any = []
  overDueList: any = []
  aparList: any = []
  overdueUncompleted: any = []
  upcomingUncompleted: any = []
  completedList: any = []
  toggleFilter = false
  cbpOriginalData: any
  filteredData: any
  contentFeedListCopy: any
  contentFeedList: any
  cbpLoader = false
  filterApplied = false
  filterCheckOnFilter = false
  filterObjData: any = {
    planYear: '',
    planType: '',
    primaryCategory: [],
    status: [],
    timeDuration: [],
    competencyArea: [],
    competencyTheme: [],
    competencySubTheme: [],
    providers: [],
  }
  mobileTopHeaderVisibilityStatus = true
  contentCompletedStatus = 2
  /** Years offered by the year filter — from cbp.json's `planYears`. */
  planYearList: string[] = []
  /** Financial year the page falls back to when none is selected or passed in. */
  currentPlanYear = ''
  /** Year `cbpOriginalData` was fetched for — what a new selection is compared against. */
  loadedPlanYear = ''
  /** Plan types offered by the plan type filter, as {id, name} — from cbp.json's `planTypes`. */
  planTypeList: any[] = []
  /**
   * The three buckets a plan falls into, offered when cbp.json configures no `planTypes` of
   * its own. They are mutually exclusive by design — the same split the home strips use:
   * APAR, an AI-drafted plan, or an ordinary training plan (everything else).
   */
  private readonly defaultPlanTypes = [
    { id: 'apar', name: 'APAR' },
    { id: 'nonapar', name: 'Non-APAR' },
    { id: 'aicbp', name: 'AI CBP' },
  ]
  constructor(
    private activatedRoute: ActivatedRoute,
    private widgetSvc: WidgetUserServiceLib,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private indexedDbSvc: IndexedDbService,
    private initSvc: InitService

  ) {
    this.langtranslations.languageSelectedObservable.subscribe(() => {
      if (localStorage.getItem('websiteLanguage')) {
        this.translate.setDefaultLang('en')
        const lang = localStorage.getItem('websiteLanguage')!
        this.translate.use(lang)
      }
    })
  }

  ngOnInit() {
    if (this.activatedRoute.snapshot.data.pageData) {
      this.cbpConfig = this.activatedRoute.snapshot.data.pageData.data.cbpConfig
      this.cbpAllConfig = this.activatedRoute.snapshot.data.pageData.data
    }
    this.resolvePlanYears()
    this.resolvePlanTypes()
    // The strips still link here with ?isApar=true; APAR is a plan type now, not a toggle.
    if (this.activatedRoute.snapshot.queryParamMap.get('isApar') === 'true') {
      this.filterObjData.planType = 'apar'
    }
    // The CBP strips carry the year they were showing onto "View All", so honour it here
    // rather than always opening on the current one.
    this.filterObjData.planYear = this.activatedRoute.snapshot.queryParamMap.get('planYear') || this.currentPlanYear
    this.upcommingList = this.transformSkeletonToWidgets(this.cbpAllConfig.cbpUpcomingStrips)
    this.overDueList = this.transformSkeletonToWidgets(this.cbpAllConfig.cbpUpcomingStrips)
    this.aparList = this.transformSkeletonToWidgets(this.cbpAllConfig.cbpUpcomingStrips)
    this.contentFeedList = this.transformSkeletonToWidgets(this.getFeedStrip())
    this.getCbPlans()
  }

  /**
   * The year filter's options come from cbp.json (`planYears`). Falls back to the current
   * financial year alone if the config omits them, so the filter is never empty.
   *
   * The default year is the current financial year — the one the API itself defaults to —
   * unless the configured list doesn't include it, in which case the newest configured
   * year wins, otherwise the page would open on a year the filter can't show as selected.
   */
  private resolvePlanYears() {
    const configured = this.cbpAllConfig && this.cbpAllConfig.planYears
    this.planYearList = Array.isArray(configured) && configured.length ? configured : []
    const financialYear = this.widgetSvc.getCurrentFinancialYear()
    if (!this.planYearList.length) {
      this.planYearList = [financialYear]
    }
    this.currentPlanYear = this.planYearList.includes(financialYear) ? financialYear : this.planYearList[0]
  }

  /**
   * The plan type filter's options come from cbp.json (`planTypes`), the same way the year
   * filter's do. Entries may be plain strings or `{ id, name }` objects; both end up as
   * `{ id, name }` so the panel has a label to show and the feed a value to match on.
   *
   * An instance that configures nothing falls back to `defaultPlanTypes` rather than to an
   * empty list, so the section is always offered — the three buckets exist whether or not
   * cbp.json names them, and hiding the filter left no way to narrow to one of them.
   */
  private resolvePlanTypes() {
    const configured = this.cbpAllConfig && this.cbpAllConfig.planTypes
    this.planTypeList = (Array.isArray(configured) ? configured : [])
      .map((planType: any) => (
        typeof planType === 'string'
          ? { id: planType, name: planType }
          : { id: planType && (planType.id || planType.key), name: planType && (planType.name || planType.label || planType.id) }
      ))
      .filter((planType: any) => !!planType.id)
    if (!this.planTypeList.length) {
      this.planTypeList = this.defaultPlanTypes.map(planType => ({ ...planType }))
    }
  }

  async getCbPlans() {
    this.cbpLoader = true
    // Year-scoped on the server: a different year is a different request, cached per year.
    this.loadedPlanYear = this.filterObjData.planYear
    let response = await this.widgetSvc.fetchCbpPlanListV3(this.filterObjData.planYear).toPromise()
    response = await this.stampEnrolmentStatus(response)
    if (response?.length) {
      this.cbpOriginalData = response
      this.upcommingList = []
      this.contentFeedList = []
      this.overDueList = []
      this.aparList = []
      this.completedList = []
      // Reset too: these accumulate, and a year change runs this a second time.
      this.upcomingUncompleted = []
      this.overdueUncompleted = []
      response = response?.sort((a: any, b: any): any => {
        if (a.planDuration === NsCardContent.ACBPConst.OVERDUE && b.planDuration === NsCardContent.ACBPConst.OVERDUE) {
          const firstDate: any = new Date(a.endDate)
          const secondDate: any = new Date(b.endDate)
          return firstDate > secondDate ? -1 : 1
        }
      })
      await response?.forEach((ele: any) => {
        if (ele.planDuration === 'overdue') {
          this.overDueList.push(ele)
        } else {
          this.upcommingList.push(ele)
        }
        if (ele.isApar === true) {
          this.aparList.push(ele)
        }
      })
      this.completedList = response?.filter((allData: any) => allData.contentStatus === this.contentCompletedStatus)
      // Every plan type shows until the plan type filter narrows it.
      this.contentFeedListCopy = response
      this.contentFeedList = this.transformContentsToWidgets(response, this.getFeedStrip())
      this.upcommingList = this.transformContentsToWidgets(this.upcommingList, this.cbpAllConfig.cbpUpcomingStrips)
      this.overDueList = this.transformContentsToWidgets(this.overDueList, this.cbpAllConfig.cbpUpcomingStrips)
      this.aparList = this.transformContentsToWidgets(this.aparList, this.cbpAllConfig.cbpUpcomingStrips)

      const vall = this.overDueList.length + this.upcommingList.length
      this.upcommingList.filter((data: any) => {
        if (data && data.widgetData && data.widgetData.content && data.widgetData.content.contentStatus < this.contentCompletedStatus) {
          // if (data.widgetData.content.planDuration && data.widgetData.content.planDuration !== 'success') {
          this.upcomingUncompleted.push(data)
          // }
        }
      })
      this.overDueList.filter((data: any) => {
        if (data && data.widgetData && data.widgetData.content && data.widgetData.content.contentStatus < this.contentCompletedStatus) {
          this.overdueUncompleted.push(data)
        }
      })
      this.usersCbpCount = {
        upcoming: this.upcomingUncompleted.length,
        overdue: this.overdueUncompleted.length,
        completed: this.completedList.length,
        apar: this.aparList.length,
        all: vall,
      }
      if (this.filterObjData.planType) {
        this.filterData(this.filterObjData)
      }
    } else {
      // A year with no plans still has to clear what the previous year left behind.
      this.cbpOriginalData = []
      this.upcommingList = []
      this.overDueList = []
      this.contentFeedList = []
      this.completedList = []
      this.aparList = []
      this.upcomingUncompleted = []
      this.overdueUncompleted = []
      this.usersCbpCount = { upcoming: 0, overdue: 0, completed: 0, apar: 0, all: 0 }
    }
    this.cbpLoader = false
    // this.widgetSvc.fetchCbpPlanList().subscribe(async (res: any) => {
    //   if(res.length) {
    //     this.cbpOriginalData = res
    //     this.upcommingList = []
    //     this.contentFeedList = []
    //     this.overDueList = []
    //     res = res.sort((a: any, b: any): any => {
    //       if(a.planDuration === NsCardContent.ACBPConst.OVERDUE && b.planDuration === NsCardContent.ACBPConst.OVERDUE) {
    //         const firstDate: any = new Date(a.endDate)
    //         const secondDate: any = new Date(b.endDate)
    //         return  firstDate > secondDate  ? -1 : 1
    //       }
    //     })
    //     await res.forEach((ele: any) => {
    //       if (ele.planDuration === 'overdue') {
    //         this.overDueList.push(ele)
    //       } else {
    //         this.upcommingList.push(ele)
    //       }
    //     })

    //     this.contentFeedListCopy = res
    //     this.contentFeedList = this.transformContentsToWidgets(res, this.getFeedStrip())
    //     this.upcommingList = this.transformContentsToWidgets(this.upcommingList, this.cbpAllConfig.cbpUpcomingStrips)
    //     this.overDueList = this.transformContentsToWidgets(this.overDueList, this.cbpAllConfig.cbpUpcomingStrips)
    //     const all = this.overDueList.length + this.upcommingList.length
    //     this.usersCbpCount = {
    //       upcoming: this.upcommingList.length,
    //       overdue: this.overDueList.length,
    //       all: all
    //     }
    //   } else {
    //     this.upcommingList = []
    //     this.overDueList = []
    //     this.contentFeedList = []
    //   }
    //   this.cbpLoader =false
    // })
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
        cardSubType: strip.viewMoreUrl && strip.viewMoreUrl.stripConfig
          && strip.viewMoreUrl.stripConfig.cardSubType,
        cardCustomeClass: strip.customeClass ? strip.customeClass : '',
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
  /**
   * The enrolment dictionary keyed by content id — served from the IndexedDB cache that
   * InitService warms at startup, and fetched on the spot if that cache is still cold
   * (direct navigation to /cbp can beat the startup pre-load).
   */
  private async getEnrolmentDictionary(): Promise<Record<string, any>> {
    try {
      const cached = await this.indexedDbSvc.getEnrollmentDetails()
      if (cached && Object.keys(cached).length) {
        return cached
      }
      return await this.initSvc.fetchEnrolmentDictionary()
    } catch {
      // no enrolment data => cards simply render without a progress tag
      return {}
    }
  }

  /**
   * Copies the user's enrolment state onto each plan item so the cards can show the
   * In-Progress / Completed tags. `status` is 0 not started, 1 in progress, 2 completed;
   * a content id absent from the dictionary means the user is not enrolled at all.
   */
  private async stampEnrolmentStatus(contents: any): Promise<any[]> {
    if (!contents || !contents.length) {
      return contents
    }
    const dictionary = await this.getEnrolmentDictionary()
    return contents.map((content: any) => {
      const enrolment = dictionary[content.identifier]
      return enrolment
        ? { ...content, enrolmentStatus: enrolment.status, enrolmentActive: enrolment.active }
        : content
    })
  }

  /**
   * Every plan the year holds, whatever its type. APAR plans used to be partitioned out of
   * here by the APAR toggle; now that APAR is one plan type among several, narrowing is the
   * plan type filter's job alone and no type is hidden by default.
   */
  private allPlans(): any[] {
    return this.cbpOriginalData || []
  }

  /**
   * A plan belongs to exactly one type: APAR (`isApar`), a draft AI plan (`planTypeV2` of
   * AICBP) or an ordinary training plan — which is what everything else is. The same split
   * the home strips use, so the three options never overlap. Any other configured id falls
   * back to matching the item's own plan type.
   *
   * Note `planTypeV2` and not `planType`: the plan list stamps a constant `planType` of
   * 'cbPlan' on every item, so it says nothing about which bucket the item is in.
   */
  private matchesPlanType(data: any, planType: string): boolean {
    const selected = String(planType).toLowerCase()
    const isApar = data.isApar === true
    if (selected === 'apar') {
      return isApar
    }
    const itemType = String(data.planTypeV2 || (data.metadata && data.metadata.planTypeV2) || '').toLowerCase()
    if (selected === 'aicbp') {
      return !isApar && itemType === 'aicbp'
    }
    // 'nonapar' is the label the home strips use for the same bucket 'cbplan' names here.
    if (selected === 'nonapar' || selected === 'cbplan') {
      return !isApar && itemType !== 'aicbp'
    }
    return itemType === selected
  }
  private transformSkeletonToWidgets(
    strip: any
  ) {
    return [1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10].map(_content => ({
      widgetType: 'card',
      widgetSubType: 'cardContent',
      widgetHostClass: 'mb-2',
      cardCustomeClass: strip.customeClass ? strip.customeClass : '',
      widgetData: {
        cardSubType: strip.viewMoreUrl && strip.viewMoreUrl.loaderConfig
          && strip.viewMoreUrl.loaderConfig.cardSubType || 'card-portrait-skeleton',
      },
    }))
  }
  getFeedStrip() {
    return window.screen.width < 768 ? this.cbpAllConfig.cbpFeedMobileStrip : this.cbpAllConfig.cbpFeedStrip
  }

  toggleFilterEvent(event: any) {
    this.toggleFilter = event
  }
  async applyFilter(event: any) {
    this.toggleFilter = false
    const yearChanged = this.hasPlanYearChanged(event)
    this.filterObjData = event
    if (yearChanged) {
      // The plan list is scoped to one year server side, so the year is not something the
      // page can filter locally — it has to fetch that year's plans first.
      await this.getCbPlans()
    }
    this.filterData(event)
  }

  /**
   * True when `event` selects a plan year other than the one the loaded data is for.
   * Compared against `loadedPlanYear` rather than `filterObjData`, because the chip-dismiss
   * path mutates `filterObjData` in place before handing it back here.
   */
  private hasPlanYearChanged(event: any): boolean {
    const selected = event && event.planYear
    return !!selected && selected !== this.loadedPlanYear
  }

  async clearFilterObj(event: any) {
    const yearChanged = this.hasPlanYearChanged(event)
    this.filterObjData = event
    if (yearChanged) {
      await this.getCbPlans()
    }
    // tslint: disable-next-line: whitespace
    this.filterData(event)
    // tslint: disable-next-line: whitespace
  }

  filterData(filterValue: any) {
    let finalFilterValue: any = []
    if (filterValue['planType'] ||
      filterValue['primaryCategory'].length ||
      filterValue['status'].length ||
      filterValue['timeDuration'].length ||
      filterValue['competencyArea'].length ||
      filterValue['competencyTheme'].length ||
      filterValue['competencySubTheme'].length ||
      filterValue['providers'].length
    ) {
      let filterAppliedonLocal = false
      this.filteredData = this.allPlans()
      this.filterApplied = true
      if (filterValue['planType']) {
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData)
          .filter((data: any) => this.matchesPlanType(data, filterValue['planType']))
        filterAppliedonLocal = true
      }
      if (filterValue['primaryCategory'].length) {
        filterAppliedonLocal = filterAppliedonLocal ? true : false
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData).filter((data: any) => {
          if (filterValue['primaryCategory'].includes(data.primaryCategory)) {
            if (filterValue['primaryCategory'].includes('Moderated Courses') && data.secureSettings) {
              return data
            }
            return data
          }
        })
        filterAppliedonLocal = true
      }

      if (filterValue['status'].length) {
        filterAppliedonLocal = filterAppliedonLocal ? true : false
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData).filter((data: any) => {
          const statusData = filterValue['status'].includes('all') ? ['0', '1', '2'] : filterValue['status']
          if (statusData.includes(String(data.contentStatus))) {
            return data
          }
        })
        filterAppliedonLocal = true
      }

      if (filterValue['timeDuration'].length) {
        filterAppliedonLocal = filterAppliedonLocal ? true : false
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData).filter((data: any) => {
          if (filterValue['timeDuration'].some((time: any) => {
            const count = Number(time.slice(0, -2))
            if (time.includes('sw')) {
              // tslint:disable-next-line: max-line-length
              return dayjs(data.endDate).isSameOrAfter(dayjs(dayjs().subtract(count, 'week'))) && dayjs(data.endDate).isSameOrBefore(dayjs())
            }
            if (time.includes('ad')) {
              // tslint:disable-next-line: max-line-length
              return dayjs(data.endDate).isSameOrBefore(dayjs(dayjs().add(count, 'day'))) && dayjs(data.endDate).isSameOrAfter(dayjs())
            }
            if (time.includes('sm')) {
              // tslint:disable-next-line: max-line-length
              return dayjs(data.endDate).isSameOrAfter(dayjs(dayjs().subtract(count, 'month'))) && dayjs(data.endDate).isSameOrBefore(dayjs())
            }
            return true
            // tslint: disable-next-line: whitespace
          })
          ) {
            return data
          }
        })
        filterAppliedonLocal = true
      }// tslint: disable-next-line: whitespace
      if (filterValue['competencyArea'].length) {
        filterAppliedonLocal = filterAppliedonLocal ? true : false
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData).filter((data: any) => {
          if (filterValue['competencyArea'].some((r: any) => data.competencyArea.includes(r))) {
            return data
          }
        })
        filterAppliedonLocal = true
      }
      // tslint: disable-next-line: whitespace
      if (filterValue['competencyTheme'].length) {
        filterAppliedonLocal = filterAppliedonLocal ? true : false
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData).filter((data: any) => {
          if (filterValue['competencyTheme'].some((r: any) => data.competencyTheme.includes(r))) {
            return data
          }
        })
        filterAppliedonLocal = true
      }
      // tslint: disable-next-line: whitespace
      if (filterValue['competencySubTheme'].length) {
        filterAppliedonLocal = filterAppliedonLocal ? true : false
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData).filter((data: any) => {
          if (filterValue['competencySubTheme'].some((r: any) => data.competencySubTheme.includes(r))) {
            // tslint: disable-next-line: whitespace
            return data
            // tslint: disable-next-line: whitespace
          }
          // tslint: disable-next-line: whitespace
        })
        // tslint: disable-next-line: whitespace
        filterAppliedonLocal = true
      }

      if (filterValue['providers'].length) {
        filterAppliedonLocal = filterAppliedonLocal ? true : false
        finalFilterValue = (filterAppliedonLocal ? finalFilterValue : this.filteredData).filter((data: any) => {
          if (filterValue['providers'].includes(data.organisation[0])) {
            return data
          }
        })
        filterAppliedonLocal = true
      }
    } else {
      this.filterApplied = false
      finalFilterValue = this.allPlans()
    }
    this.contentFeedListCopy = finalFilterValue
    this.contentFeedList = this.transformContentsToWidgets(finalFilterValue, this.getFeedStrip())
  }

  searchData(event: any) {
    this.filterObjData = {
      // Searching clears the filters but stays in the year the user is looking at.
      planYear: this.filterObjData.planYear || this.currentPlanYear,
      planType: '',
      primaryCategory: [],
      status: [],
      timeDuration: [],
      competencyArea: [],
      competencyTheme: [],
      competencySubTheme: [],
      providers: [],
    }
    this.applyFilter(this.filterObjData)
    const searchData = this.allPlans()
    let searchFilterData = []
    if (event.query) {
      searchFilterData = searchData.filter((ele: any) => ele.name.toLowerCase().includes(event.query.toLowerCase()))
    } else {
      searchFilterData = searchData
    }

    this.contentFeedList = this.transformContentsToWidgets(searchFilterData, this.getFeedStrip())
  }
  closeFilterKey(data: any) {
    if (data.key === 'planType') {
      // No plan type means all of them, which is the page's default state.
      this.filterObjData[data.key] = ''
    } else {
      const index = this.filterObjData[data.key].indexOf(data.value)
      if (index > -1) { // only splice array when item is found
        this.filterObjData[data.key].splice(index, 1) // 2nd parameter means remove one item only
      }
    }
    this.applyFilter(this.filterObjData)
  }
  /**
   * The sidebar tabs build their own filter object and know nothing about the year in effect,
   * so it is carried over — dropping it would empty the chip the page always shows and
   * silently move the list off the year the user is looking at.
   */
  filterValueEmitMethod(event: any) {
    const carried = {
      ...event,
      planYear: this.filterObjData.planYear || this.currentPlanYear,
    }
    this.filterObjData = carried
    this.applyFilter(carried)
  }
}
