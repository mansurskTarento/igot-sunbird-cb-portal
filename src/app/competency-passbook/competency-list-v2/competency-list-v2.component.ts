// Core imports
import { Component, OnDestroy, OnInit, Inject } from '@angular/core'
import { DOCUMENT } from '@angular/common'
import { Router } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
// RxJS imports
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
// Project files and components
import { ConfigurationsService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { NsContent } from '@sunbird-cb/collection/src/public-api'
import { TranslateService } from '@ngx-translate/core'
import { environment } from 'src/environments/environment'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { MatLegacyTabChangeEvent as MatTabChangeEvent } from '@angular/material/legacy-tabs'
import { CompetencyPassbookService } from '../competency-passbook.service'

@Component({
  selector: 'ws-competency-list-v2',
  templateUrl: './competency-list-v2.component.html',
  styleUrls: ['./competency-list-v2.component.scss'],
})

export class CompetencyListV2Component implements OnInit, OnDestroy {

  isMobile = false
  toggleFilter = false
  skeletonArr = <any>[]
  showAll = false
  private destroySubject$ = new Subject()
  // not used so commenting these variables
  // three_month_back = new Date(new Date().setMonth(new Date().getMonth() - 3))
  // six_month_back = new Date(new Date().setMonth(new Date().getMonth() - 6))
  // one_year_back = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
  showFilterIndicator = 'all'
  filteredData: any[] = []
  filterApplied = false
  apiResponse: any[] = []
  allCompetencies: any[] = []
  allThemeData: any[] = []
  allSubThemeData: any[] = []
  myCompetencyList: any[] = []
  totalCompetencyCount = 0
  totalCompetencySubThemeCount = 0
  totalContentConsumed = 0
  appliedFilter: any = {
    competencyarea: [],
    theme: [],
    subtheme: [],
  }

  leftStatus: { id: string, count: number, consumedCourse: number }[] = []
  filteredCompetencyArray: any[] = []
  myCompetencies: {
    id: string
    name: string
    subThemes: { id: string, name: string }[]
    counts: {
      iGOTCourses: number
      extCourses: number
      selfAchievement: number
      externalTraining: number
      total: number
    }
    themes: {
      id: string
      name: string
      areaId: string
      areaName: string
      subThemes: { id: string, name: string }[]
      competencyDetails: any[]
      viewMore: boolean
      counts: {
        iGOTCourses: number
        extCourses: number
        selfAchievement: number
        externalTraining: number
        total: number
      }
    }[]
  }[] = []
  TYPE_CONST = {
    behavioral: {
      capsValue: 'Behavioural',
      value: 'behavioural',
      otherValue: 'behavioral',
    },
    functional: {
      capsValue: 'Functional',
      value: 'functional',
    },
    domain: {
      capsValue: 'Domain',
      value: 'domain',
    },
  }

  competencyArray: any
  competency: any = {
    skeletonLoading: true,
    error: false,
    all: <any>[],
    allValue: 0,
    behavioural: <any>[],
    functional: <any>[],
    domain: <any>[],
  }

  leftCardDetails: any = [{
    name: this.TYPE_CONST.behavioral.value,
    label: this.TYPE_CONST.behavioral.capsValue,
    type: 'Behavioural',
    total: 0,
    competencySubTheme: 0,
    contentConsumed: 0,
    filter: {
      all: 0,
      threeMonths: 0,
      sixMonths: 0,
      lastYear: 0,
      threeMonthsSubTheme: 0,
      sixMonthsSubTheme: 0,
      lastYearSubTheme: 0,
    },
  }, {
    name: this.TYPE_CONST.functional.value,
    label: this.TYPE_CONST.functional.capsValue,
    type: this.TYPE_CONST.functional.capsValue,
    total: 0,
    competencySubTheme: 0,
    contentConsumed: 0,
    filter: {
      all: 0,
      threeMonths: 0,
      sixMonths: 0,
      lastYear: 0,
      threeMonthsSubTheme: 0,
      sixMonthsSubTheme: 0,
      lastYearSubTheme: 0,
    },
  }, {
    name: this.TYPE_CONST.domain.value,
    label: this.TYPE_CONST.domain.capsValue,
    type: this.TYPE_CONST.domain.capsValue,
    total: 0,
    competencySubTheme: 0,
    contentConsumed: 0,
    filter: {
      all: 0,
      threeMonths: 0,
      sixMonths: 0,
      lastYear: 0,
      threeMonthsSubTheme: 0,
      sixMonthsSubTheme: 0,
      lastYearSubTheme: 0,
    },
  }]

  filterObjData: any
  filterObjData2: any
  tabValue = ''
  certificateMappedObject: any = {}
  compentencyKey!: NsContent.ICompentencyKeys
  constructor(
    private router: Router,
    private matSnackBar: MatSnackBar,
    private langtranslations: MultilingualTranslationsService,
    private translate: TranslateService,
    private configSvc: ConfigurationsService,
    private competencyPassbookSvc: CompetencyPassbookService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    if (window.innerWidth < 768) {
      this.isMobile = true
      this.skeletonArr = [1, 2, 3]
    } else {
      this.skeletonArr = [1, 2, 3, 4, 5, 6]
      this.showAll = true
      this.isMobile = false
    }
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
  }

  ngOnInit() {
    this.compentencyKey = this.configSvc.compentency[environment.compentencyVersionKey]

    this.filterObjData = {
      primaryCategory: [],
      status: [],
      timeDuration: [],
      [this.compentencyKey.vCompetencyArea]: [],
      [this.compentencyKey.vCompetencyTheme]: [],
      [this.compentencyKey.vCompetencySubTheme]: [],
      providers: [],
    }
    this.filterObjData2 = { ...this.filterObjData }

    // this.getUserEnrollmentList()
    this.getAllCompetencyList()
    setTimeout(() => {
      this.getMyCompetencyList()
    }, 1000)


  }

  getMyCompetencyList(): void {
    this.competency.skeletonLoading = true
    this.competencyPassbookSvc.getMyCompetencyList()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe(
        (response: any) => {
          if (response && response.result && response.result.competencies) {
            this.myCompetencyList = response.result.competencies
            this.buildMyCompetency()
          }
          this.competency.skeletonLoading = false
        },
        (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.competency.skeletonLoading = false
            this.matSnackBar.open('Unable to pull My Competency list details!')
          }
        }
      )
  }

  getSubThemeName(subThemeId: string): string {
    return this.allSubThemeData.find((sub: any) => sub.refId === subThemeId)?.name || subThemeId
  }

  buildMyCompetency(): void {
    this.myCompetencies = []
    this.myCompetencyList.forEach((item: any) => {
      const areaId = item.competencyAreaId
      const themeId = item.competencyThemeId
      const subThemeId = item.competencySubThemeId

      let areaEntry = this.myCompetencies.find((a: any) => a.id === areaId)
      const area = this.allCompetencies.find((c: any) => c.refId === areaId)?.name || ''
      if (!areaEntry && area) {
        areaEntry = {
          id: areaId,
          name: this.allCompetencies.find((c: any) => c.refId === areaId)?.name || '',
          subThemes: [],
          counts: { iGOTCourses: 0, extCourses: 0, selfAchievement: 0, externalTraining: 0, total: 0 },
          themes: [],
        }
        this.myCompetencies.push(areaEntry)
      }
      if (areaEntry) {
        let themeEntry = areaEntry.themes.find((t: any) => t.id === themeId)
        if (!themeEntry) {
          themeEntry = {
            id: themeId,
            areaId: areaId,
            areaName: area,
            name: this.allThemeData.find((t: any) => t.refId === themeId)?.name || '',
            subThemes: [],
            competencyDetails: [],
            viewMore: false,
            counts: { iGOTCourses: 0, extCourses: 0, selfAchievement: 0, externalTraining: 0, total: 0 },
          }
          areaEntry.themes.push(themeEntry)
        }

        if (!themeEntry.subThemes.some((s: any) => s.id === subThemeId)) {
          themeEntry.subThemes.push({
            id: subThemeId,
            name: this.allSubThemeData.find((sub: any) => sub.refId === subThemeId)?.name || subThemeId,
          })
        }

        if (!areaEntry.subThemes.some((s: any) => s.id === subThemeId)) {
          areaEntry.subThemes.push({
            id: subThemeId,
            name: this.allSubThemeData.find((sub: any) => sub.refId === subThemeId)?.name || subThemeId,
          })
        }

        if (item.competencyDetails) {
          item.competencyDetails.subThemeId = subThemeId
          item.competencyDetails.subThemeName = this.getSubThemeName(subThemeId)
          themeEntry.competencyDetails.push(item.competencyDetails)

          const iGOTCount = Array.isArray(item.competencyDetails.iGOTCourses)
            ? item.competencyDetails.iGOTCourses.length : 0
          const extCount = Array.isArray(item.competencyDetails.extCourses)
            ? item.competencyDetails.extCourses.length : 0
          const selfCount = Array.isArray(item.competencyDetails.selfAchievement)
            ? item.competencyDetails.selfAchievement.length : 0
          const externalTrainingCount = Array.isArray(item.competencyDetails.externalTraining)
            ? item.competencyDetails.externalTraining.length : 0

          themeEntry.counts.iGOTCourses += iGOTCount
          themeEntry.counts.extCourses += extCount
          themeEntry.counts.selfAchievement += selfCount
          themeEntry.counts.externalTraining += externalTrainingCount
          themeEntry.counts.total += iGOTCount + extCount + selfCount + externalTrainingCount

          areaEntry.counts.iGOTCourses += iGOTCount
          areaEntry.counts.extCourses += extCount
          areaEntry.counts.selfAchievement += selfCount
          areaEntry.counts.total += iGOTCount + extCount + selfCount
        }
      }
    })
    this.filteredCompetencyArray = this.myCompetencies
    this.findCounts()

  }

  findCounts(): void {
    this.leftStatus = []
    this.totalCompetencyCount = 0
    this.totalCompetencySubThemeCount = 0
    this.totalContentConsumed = 0

    this.myCompetencies.forEach((areaEntry) => {
      const subThemeCount = areaEntry.subThemes ? areaEntry.subThemes.length : 0
      const consumedCourse = areaEntry.counts.total || 0
      const themName = this.allCompetencies.find((comp: any) => comp.refId === areaEntry.id)?.name || areaEntry.id
      const findThemInLeftCardDetails = this.leftCardDetails.find((obj: any) => obj.name.toLowerCase() === themName.toLowerCase())
      if (findThemInLeftCardDetails) {
        findThemInLeftCardDetails.contentConsumed += consumedCourse
        findThemInLeftCardDetails.competencySubTheme += subThemeCount
        this.competency[themName.toLowerCase()] = areaEntry.themes || []
      }
      this.totalCompetencyCount += areaEntry.themes ? areaEntry.themes.length : 0
    })
  }

  getAllCompetenciesCount(): number {
    return this.myCompetencies.reduce((sum, areaEntry) => {
      return sum + (areaEntry.themes?.length || 0)
    }, 0)
  }

  getAllCompetencyList(): void {
    this.competencyPassbookSvc.fetchAllCompetencyList()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe(
        (response: any) => {
          if (response && response.result && response.result.framework && response.result.framework.categories) {
            this.apiResponse = response.result.framework.categories
            this.allCompetencies = this.apiResponse.filter((v: any) => v.code === 'competencyarea')[0].terms
            this.allThemeData = this.apiResponse.filter((v: any) => v.code === 'theme')[0].terms
            this.allSubThemeData = this.apiResponse.filter((v: any) => v.code === 'subtheme')[0].terms
          }
        },
        (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open('Unable to pull Competency list details!')
          }
        }
      )
  }

  mapEnrollmentData(courseData: any) {
    const enrollData: any = {}
    if (courseData && courseData.courses && courseData.courses.length) {
      courseData.courses.forEach((data: any) => {
        data['contentId'] = data.courseId
        data['courseName'] = data?.content?.name
        enrollData[data.courseId || data.collectionId] = data
      })
    }
    return enrollData
  }



  handleLeftFilter(months: string): void {
    // Do not delete, need to work on this...
    // this.leftCardDetails.forEach((_obj: any) => {
    //   this.competency[`${_obj.name}Value`] = _obj.filter[months]
    //   if (months === 'all') {
    //     this.competency[`${_obj.name}SubTheme`] = _obj.competencySubTheme
    //   } else {
    //     this.competency[`${_obj.name}SubTheme`] = _obj.filter[`${months}SubTheme`]
    //   }
    // })
    this.showFilterIndicator = months
  }

  filterCompetencyByTab(tab: string): void {
    if (!tab || tab === 'all') {
      this.filteredCompetencyArray = [...this.myCompetencies]
    } else {
      this.filteredCompetencyArray = this.myCompetencies.filter((area: any) => {
        const areaName = area.name?.toLowerCase()
        return areaName === tab
          || (tab === 'behavioural' && areaName === 'behavioral')
          || (tab === 'behavioral' && areaName === 'behavioural')
      })
    }
  }

  handleTabChange(event: MatTabChangeEvent): void {
    const param = event.tab.textLabel.toLowerCase()
    this.tabValue = param
    this.filterCompetencyByTab(param)
    this.filterObjData2 = { ...this.filterObjData }
    // Re-apply filters if any are active
    if (this.filterApplied) {
      this.filterData()
    }
  }

  handleShowAll(): void {
    this.showAll = !this.showAll
    if (this.showAll) {
      this.filteredCompetencyArray = [...this.myCompetencies]
    } else {
      this.filteredCompetencyArray = this.myCompetencies.slice(0, 3)
    }
  }

  handleClick(param: string): void {
    this.filterCompetencyByTab(param)
  }

  handleViewMore(obj: any, flag?: string): void {
    obj.viewMore = flag ? false : true
  }

  handleNavigate(obj: any): void {
    localStorage.setItem('details_page_competency', JSON.stringify(obj))
    this.router.navigate(['/page/competency-passbook/details'])
  }

  handleSearch(event: string, competencyTheme: string): void {
    competencyTheme = competencyTheme.toLowerCase()
    this.filterCompetencyByTab(competencyTheme)
    if (event.length) {
      this.filteredCompetencyArray = this.filteredCompetencyArray
        .map((area: any) => ({
          ...area,
          themes: area.themes.filter((theme: any) =>
            theme.name?.toLowerCase().trim().includes(event.toLowerCase())
          ),
        }))
        .filter((area: any) => area.themes.length > 0)
    }
  }

  // Filters related functionalities...
  handleFilter(event: boolean): void {
    this.toggleFilter = event
    if (event) {
      this.document.body.classList.add('overflow-hidden')
    } else {
      this.document.body.classList.remove('overflow-hidden')
    }
  }

  handleApplyFilter(event: any) {
    this.toggleFilter = false
    this.document.body.classList.remove('overflow-hidden')
    this.appliedFilter = event
    this.filterData()
  }

  handleClearFilterObj(event: any) {
    this.filterObjData2 = event
    this.appliedFilter = { competencyarea: [], theme: [], subtheme: [] }
    this.filterApplied = false
    this.filterCompetencyByTab(this.tabValue || 'all')
  }

  filterData() {
    const areaFilters: string[] = this.appliedFilter.competencyarea || []
    const themeFilters: string[] = this.appliedFilter.theme || []
    const subThemeFilters: string[] = this.appliedFilter.subtheme || []

    // If no filters selected, reset to tab-based view
    if (!areaFilters.length && !themeFilters.length && !subThemeFilters.length) {
      this.filterApplied = false
      this.filterCompetencyByTab(this.tabValue || 'all')
      return
    }

    this.filterApplied = true
    // Start from the full dataset (respecting current tab)
    this.filterCompetencyByTab(this.tabValue || 'all')
    let filtered = [...this.filteredCompetencyArray]

    // Step 1: Filter by competency area name
    if (areaFilters.length) {
      filtered = filtered.filter((area: any) => {
        const areaName = area.name?.toLowerCase().trim()
        return areaFilters.some((f: string) => {
          const filterName = f.toLowerCase().trim()
          return areaName === filterName
            || (filterName === 'behavioural' && areaName === 'behavioral')
            || (filterName === 'behavioral' && areaName === 'behavioural')
        })
      })
    }

    // Step 2: Filter themes within each area
    if (themeFilters.length) {
      filtered = filtered
        .map((area: any) => ({
          ...area,
          themes: area.themes.filter((theme: any) =>
            themeFilters.some((f: string) =>
              theme.name?.toLowerCase().trim() === f.toLowerCase().trim()
            )
          ),
        }))
        .filter((area: any) => area.themes.length > 0)
    }

    // Step 3: Filter by sub-themes within each theme
    if (subThemeFilters.length) {
      filtered = filtered
        .map((area: any) => ({
          ...area,
          themes: area.themes
            .map((theme: any) => ({
              ...theme,
              subThemes: theme.subThemes.filter((st: any) =>
                subThemeFilters.some((f: string) =>
                  st.name?.toLowerCase().trim() === f.toLowerCase().trim()
                )
              ),
            }))
            .filter((theme: any) => theme.subThemes.length > 0),
        }))
        .filter((area: any) => area.themes.length > 0)
    }

    this.filteredCompetencyArray = filtered
  }

  ngOnDestroy(): void {
    this.destroySubject$.unsubscribe()
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabel(label, type, '')
  }
}
