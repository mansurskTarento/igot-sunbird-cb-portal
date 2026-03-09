// Core imports
import { Component, OnDestroy, OnInit, Inject } from '@angular/core'
import { DOCUMENT } from '@angular/common'
import { Router } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
// RxJS imports
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
// Project files and components
import { ConfigurationsService, MultilingualTranslationsService, WidgetEnrollService } from '@sunbird-cb/utils-v2'

import { NsContent } from '@sunbird-cb/collection/src/public-api'
import { TranslateService } from '@ngx-translate/core'
import { environment } from 'src/environments/environment'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { MatLegacyTabChangeEvent as MatTabChangeEvent } from '@angular/material/legacy-tabs'
import { CompetencyPassbookService } from '../competency-passbook.service'

@Component({
  selector: 'ws-competency-list',
  templateUrl: './competency-list.component.html',
  styleUrls: ['./competency-list.component.scss'],
})

export class CompetencyListComponent implements OnInit, OnDestroy {

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
      total: number
    }
    themes: {
      id: string
      name: string
      subThemes: { id: string, name: string }[]
      competencyDetails: any[]
      viewMore: boolean
      counts: {
        iGOTCourses: number
        extCourses: number
        selfAchievement: number
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
    private widgetEnrollService: WidgetEnrollService,
    private configService: ConfigurationsService,
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
            this.competency.skeletonLoading = true
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
          counts: { iGOTCourses: 0, extCourses: 0, selfAchievement: 0, total: 0 },
          themes: [],
        }
        this.myCompetencies.push(areaEntry)
      }
      if (areaEntry) {
        let themeEntry = areaEntry.themes.find((t: any) => t.id === themeId)
        if (!themeEntry) {
          themeEntry = {
            id: themeId,
            name: this.allThemeData.find((t: any) => t.refId === themeId)?.name || '',
            subThemes: [],
            competencyDetails: [],
            viewMore: false,
            counts: { iGOTCourses: 0, extCourses: 0, selfAchievement: 0, total: 0 },
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
          themeEntry.competencyDetails.push(item.competencyDetails)

          const iGOTCount = Array.isArray(item.competencyDetails.iGOTCourses)
            ? item.competencyDetails.iGOTCourses.length : 0
          const extCount = Array.isArray(item.competencyDetails.extCourses)
            ? item.competencyDetails.extCourses.length : 0
          const selfCount = Array.isArray(item.competencyDetails.selfAchievement)
            ? item.competencyDetails.selfAchievement.length : 0

          themeEntry.counts.iGOTCourses += iGOTCount
          themeEntry.counts.extCourses += extCount
          themeEntry.counts.selfAchievement += selfCount
          themeEntry.counts.total += iGOTCount + extCount + selfCount

          areaEntry.counts.iGOTCourses += iGOTCount
          areaEntry.counts.extCourses += extCount
          areaEntry.counts.selfAchievement += selfCount
          areaEntry.counts.total += iGOTCount + extCount + selfCount
        }
      }
    })
    this.filteredCompetencyArray = this.myCompetencies

    this.findCounts()



    console.log('My Competency Map:', this.myCompetencies)
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

            console.log('All Competencies:', this.allCompetencies)
            console.log('All Theme Data:', this.allThemeData)
            console.log('All SubTheme Data:', this.allSubThemeData)
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

  getUserEnrollmentList(): void {

    let enrollmentMapData: any = {}
    const userId: any = this.configService && this.configService.userProfile && this.configService.userProfile.userId
    const req = { "request": { "retiredCoursesEnabled": true, "status": "Completed" } }
    this.widgetEnrollService.fetchInternalEnrollmentData(userId, req)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe(
        (response: any) => {
          let competenciesV5: any[] = []
          enrollmentMapData = this.mapEnrollmentData(response?.result)
          response?.result?.courses.forEach((eachCourse: any) => {
            // To eliminate In progress or Yet to start courses...
            if (enrollmentMapData[eachCourse.contentId].status !== 2) { return }
            if (eachCourse.content && eachCourse.content[this.compentencyKey.vKey]) {
              competenciesV5 = [...competenciesV5, ...eachCourse.content[this.compentencyKey.vKey]]
            }

            const courseDetails = {
              courseName: eachCourse.courseName.trim(),
              viewMore: false,
              batchId: eachCourse.batchId,
              contentId: eachCourse.contentId,
            }
            if (eachCourse.issuedCertificates.length) {
              // tslint: disable-next-line
              eachCourse.issuedCertificates = eachCourse.issuedCertificates.map((icObj: any) => {
                const nicObj = { ...icObj, ...courseDetails }
                return nicObj
              })
            } else {
              eachCourse.issuedCertificates.push(courseDetails)
            }
            if ((eachCourse.content[this.compentencyKey.vKey] && eachCourse.content[this.compentencyKey.vKey].length)) {
              const subThemeMapping: any = {}
              eachCourse.content[this.compentencyKey.vKey].forEach((v5Obj: any) => {
                if (this.certificateMappedObject[v5Obj[this.compentencyKey.vCompetencyTheme]]) {

                  // Certificate consumed logic...
                  eachCourse.issuedCertificates.forEach((certObj: any) => {
                    // tslint:disable-next-line: max-line-length
                    if (this.certificateMappedObject[v5Obj[this.compentencyKey.vCompetencyTheme]].certificate
                      .findIndex((_obj: any) => _obj.courseName === certObj.courseName) === -1) {
                      this.certificateMappedObject[v5Obj[this.compentencyKey.vCompetencyTheme]].certificate
                        .push(certObj)
                    }
                  })

                  // Content consumed logic...
                  if (this.certificateMappedObject[v5Obj[this.compentencyKey.vCompetencyTheme]].contentConsumed
                    .indexOf(eachCourse.courseName.trim()) === -1) {
                    this.certificateMappedObject[v5Obj[this.compentencyKey.vCompetencyTheme]].contentConsumed
                      .push(eachCourse.courseName.trim())

                    // Completed on logic...
                    this.certificateMappedObject[v5Obj[this.compentencyKey.vCompetencyTheme]].completedOn
                      .push(eachCourse.completedOn)
                  }

                } else {
                  this.certificateMappedObject[v5Obj[this.compentencyKey.vCompetencyTheme]] = {
                    certificate: eachCourse.issuedCertificates,
                    contentConsumed: [eachCourse.courseName],
                    subThemes: [],
                    completedOn: [eachCourse.completedOn],
                  }
                }
                // Sub theme mapping logic...
                if (subThemeMapping[v5Obj[this.compentencyKey.vCompetencyTheme]]) {
                  if (subThemeMapping[v5Obj[this.compentencyKey.vCompetencyTheme]]
                    .indexOf(v5Obj[this.compentencyKey.vCompetencySubTheme]) === -1) {
                    subThemeMapping[v5Obj[this.compentencyKey.vCompetencyTheme]]
                      .push(v5Obj[this.compentencyKey.vCompetencySubTheme])
                  }
                } else {
                  subThemeMapping[v5Obj[this.compentencyKey.vCompetencyTheme]] = []
                  subThemeMapping[v5Obj[this.compentencyKey.vCompetencyTheme]]
                    .push(v5Obj[this.compentencyKey.vCompetencySubTheme])
                }
              })
              for (const key in subThemeMapping) {
                if (subThemeMapping.hasOwnProperty(key)) {
                  this.certificateMappedObject[key].subThemes.push(subThemeMapping[key])
                }
              }
            }
          })

          competenciesV5.forEach((v5Obj: any) => {
            v5Obj.subTheme = []
            v5Obj.contentConsumed = []
            v5Obj.issuedCertificates = []
            // tslint:disable-next-line: max-line-length
            const competencyArea = (v5Obj[this.compentencyKey.vCompetencyArea].toLowerCase() === 'behavioral')
              ? 'behavioural' : v5Obj[this.compentencyKey.vCompetencyArea].toLowerCase()
            if (this.competency[competencyArea]
              .findIndex((obj: any) =>
                obj[this.compentencyKey.vCompetencyTheme] === v5Obj[this.compentencyKey.vCompetencyTheme]
              ) === -1) {
              this.competency[competencyArea].push(v5Obj)
            }

            this.competency[competencyArea].forEach((_obj: any) => {
              if (_obj[this.compentencyKey.vCompetencyTheme] === v5Obj[this.compentencyKey.vCompetencyTheme]) {
                if (_obj.subTheme.indexOf(v5Obj[this.compentencyKey.vCompetencySubTheme]) === -1) {
                  _obj.subTheme.push(v5Obj[this.compentencyKey.vCompetencySubTheme])
                  // tslint: disable-next-line: whitespace
                }
                // tslint: disable-next-line: whitespace
              }
            })
          })
          // tslint: disable-next-line
          this.competency.all = [...this.competency.behavioural, ...this.competency.functional, ...this.competency.domain]
          this.getOtherData()
          this.competency.all = this.competency.all.sort((a: any, b: any) => b.latest - a.latest)

          this.competencyArray = (this.isMobile) ? this.competency.all.slice(0, 3) : this.competency.all
          this.competency.skeletonLoading = false

          console.log('Competency after merging with enrollment data:', this.competency)
        },
        (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open('Unable to pull Enrollment list details!')
            this.competency.skeletonLoading = false
          }
        }
      )
  }

  getOtherData(): void {

    this.competency.all.forEach((allObj: any) => {
      allObj.issuedCertificates = this.certificateMappedObject[allObj[this.compentencyKey.vCompetencyTheme]].certificate
      allObj.contentConsumed = this.certificateMappedObject[allObj[this.compentencyKey.vCompetencyTheme]].contentConsumed
      allObj.courseSubThemes = this.certificateMappedObject[allObj[this.compentencyKey.vCompetencyTheme]].subThemes
      // tslint:disable-next-line: max-line-length
      allObj['latest'] = (this.certificateMappedObject[allObj[this.compentencyKey.vCompetencyTheme]].completedOn.length) ? Math.max(...this.certificateMappedObject[allObj[this.compentencyKey.vCompetencyTheme]].completedOn) : null

      this.leftCardDetails.forEach((_lObj: any) => {
        if (_lObj.type === allObj[this.compentencyKey.vCompetencyArea]) {
          _lObj.competencySubTheme += allObj.subTheme.length
          _lObj.contentConsumed += allObj.contentConsumed.length
        }
      })
    })
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
    localStorage.setItem('details_page', JSON.stringify(obj))
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
    this.filterObjData = event
    this.document.body.classList.remove('overflow-hidden')
    this.filterData(event)
  }

  handleClearFilterObj(event: any) {
    this.filterObjData2 = event
    this.filterCompetencyByTab(this.tabValue || 'all')
  }

  filterData(filterValue: any) {
    const areaFilters = filterValue[this.compentencyKey.vCompetencyArea] || []
    const themeFilters = filterValue[this.compentencyKey.vCompetencyTheme] || []
    const subThemeFilters = filterValue[this.compentencyKey.vCompetencySubTheme] || []

    if (!areaFilters.length && !themeFilters.length && !subThemeFilters.length) {
      this.filterApplied = false
      this.filterCompetencyByTab(this.tabValue || 'all')
      return
    }

    this.filterCompetencyByTab(this.tabValue || 'all')
    let filtered = [...this.filteredCompetencyArray]

    // Filter by competency area name
    if (areaFilters.length) {
      filtered = filtered.filter((area: any) => {
        const areaName = area.name?.toLowerCase().trim()
        return areaFilters.some((r: any) => {
          const filterName = (r.toLowerCase() === 'behavior') ? 'behavioural' : r.toLowerCase()
          return areaName === filterName || areaName.includes(filterName)
        })
      })
    }

    // Filter themes within each area by theme name and/or sub-theme
    if (themeFilters.length || subThemeFilters.length) {
      filtered = filtered
        .map((area: any) => {
          let themes = [...area.themes]
          if (themeFilters.length) {
            themes = themes.filter((theme: any) => themeFilters.includes(theme.name))
          }
          if (subThemeFilters.length) {
            themes = themes.filter((theme: any) =>
              theme.subThemes.some((st: any) =>
                subThemeFilters.includes(st.name) || subThemeFilters.includes(st.id)
              )
            )
          }
          return { ...area, themes }
        })
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
