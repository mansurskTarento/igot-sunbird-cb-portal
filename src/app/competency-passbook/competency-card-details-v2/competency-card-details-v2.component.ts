// Core imports
import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { jsPDF } from 'jspdf'
// RxJS imports
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
// Project files and components
import { CompetencyPassbookService } from '../competency-passbook.service'
import { TranslateService } from '@ngx-translate/core'
import { MultilingualTranslationsService, EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { environment } from 'src/environments/environment'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { CertificateDialogComponent } from '@sunbird-cb/collection/src/lib/_common/certificate-dialog/certificate-dialog.component'
import { MatSnackBar } from '@angular/material/snack-bar'

@Component({
  selector: 'ws-competency-card-details-v2',
  templateUrl: './competency-card-details-v2.component.html',
  styleUrls: ['./competency-card-details-v2.component.scss'],
})

export class CompetencyCardDetailsV2Component implements OnInit, OnDestroy {
  isMobile = false
  params: any
  detailsData: any
  viewMoreST = false
  destroySubject$ = new Subject<void>()
  myCompetencyList: any[] = []
  filteredSelfAchievements: any[] = []
  filteredIGOTCourses: any[] = []
  filteredExtCourses: any[] = []
  filteredProviderReported: any[] = []
  activeTab = ''
  currentTabData: any[] = []
  @ViewChildren('certificate') certificateElements!: QueryList<ElementRef>
  constructor(
    private actRouter: ActivatedRoute,
    private router: Router,
    private cpService: CompetencyPassbookService,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private events: EventService,
    private dialog: MatDialog,
    private matSnackBar: MatSnackBar,
  ) {
    this.langtranslations.languageSelectedObservable.subscribe(() => {
      if (localStorage.getItem('websiteLanguage')) {
        this.translate.setDefaultLang('en')
        const lang = localStorage.getItem('websiteLanguage')!
        this.translate.use(lang)
      }
    })
    this.actRouter.queryParams.subscribe((params: any) => {
      this.params = params
    })
    // tslint: disable-next-line: whitespace
    if (localStorage.getItem('details_page_competency') !== '' && localStorage.getItem('details_page_competency') !== 'undefined') {
      this.detailsData = JSON.parse(localStorage.getItem('details_page_competency') as any)
    }
  }

  ngOnInit() {
    this.getMyCompetencyList()
  }

  getMyCompetencyList(): void {
    this.cpService.getMyCompetencyList()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe(
        (response: any) => {
          if (response && response.result && response.result.competencies) {
            this.myCompetencyList = response.result.competencies
            this.filterCompetenciesBySubThemes()
          }
        },
        (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open('Unable to pull My Competency list details!')
          }
        }
      )
  }

  filterCompetenciesBySubThemes(): void {
    const subThemes = this.detailsData?.subThemes || []
    if (!this.myCompetencyList.length || !subThemes.length) {
      return
    }

    const subThemeIds = new Set(subThemes.map((st: any) => st.id))
    const subThemeMap = new Map(subThemes.map((st: any) => [st.id, st.name]))

    // Filter competencies that match any of the subthemes
    const matchedCompetencies = this.myCompetencyList.filter(
      (comp: any) => subThemeIds.has(comp.competencySubThemeId)
    )

    // Maps to group courses by acquiredContextId, collecting subtheme names
    const selfAchievementMap = new Map<string, any>()
    const iGOTCoursesMap = new Map<string, any>()
    const extCoursesMap = new Map<string, any>()

    const courseMaps: { [key: string]: Map<string, any> } = {
      selfAchievement: selfAchievementMap,
      iGOTCourses: iGOTCoursesMap,
      extCourses: extCoursesMap,
    }

    for (const comp of matchedCompetencies) {
      const subThemeName = subThemeMap.get(comp.competencySubThemeId) || comp.competencySubThemeId
      const details = comp.competencyDetails || {}

      for (const type of ['selfAchievement', 'iGOTCourses', 'extCourses']) {
        const courses = details[type]
        if (courses && courses.length) {
          const map = courseMaps[type]
          for (const course of courses) {
            const key = course.acquiredContextId
            if (map.has(key)) {
              const existing = map.get(key)
              if (!existing.subThemes.includes(subThemeName)) {
                existing.subThemes.push(subThemeName)
              }
            } else {
              map.set(key, {
                ...course,
                subThemes: [subThemeName],
              })
            }
          }
        }
      }
    }

    this.filteredSelfAchievements = Array.from(selfAchievementMap.values()).map(item => ({ ...item, viewMore: false }))
    this.filteredIGOTCourses = Array.from(iGOTCoursesMap.values()).map(item => ({ ...item, viewMore: false }))
    this.filteredExtCourses = Array.from(extCoursesMap.values()).map(item => ({ ...item, viewMore: false }))
    if (this.filteredIGOTCourses.length) {
      this.fetchIGOTCourseDetails()
    }
    if (this.filteredExtCourses.length) {
      this.fetchExtCourseDetails()
    }
    if (this.filteredSelfAchievements.length) {
      this.fetchSelfAchievementCourseDetails()
    }
    if (this.filteredIGOTCourses.length) {
      this.activeTab = 'iGOTCourses'
    } else if (this.filteredExtCourses.length) {
      this.activeTab = 'extCourses'
    } else if (this.filteredSelfAchievements.length) {
      this.activeTab = 'selfAchievement'
    }
    this.assignData(this.activeTab)
  }

  fetchIGOTCourseDetails(): void {
    const identifiers = this.filteredIGOTCourses.map((course: any) => course.acquiredContextId)
    const payload = {
      request: {
        filters: {
          identifier: identifiers,
        },
        fields: ['identifier', 'name'],
        limit: identifiers.length,
      },
    }
    this.cpService.getIGOTCourseList(payload)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe(
        (response: any) => {
          const results: any[] = response?.result?.content || []
          const nameMap = new Map<string, string>(results.map((item: any) => [item.identifier, item.name]))
          this.filteredIGOTCourses = this.filteredIGOTCourses.map((course: any) => ({
            ...course,
            name: nameMap.get(course.acquiredContextId) || course.name || '',
          }))
          if (this.activeTab === 'iGOTCourses') {
            this.assignData('iGOTCourses')
          }
        },
        (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open('Unable to fetch iGOT course details!')
          }
        }
      )
  }

  fetchSelfAchievementCourseDetails(): void {
    const identifiers = this.filteredSelfAchievements.map((course: any) => course.acquiredContextId)
    const payload = {
      request: {
        achievementIds: identifiers,
      }

    }
    this.cpService.getAcheivementsList(payload)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe(
        (response: any) => {
          const results: any[] = response?.result?.search_results?.data || []
          const nameMap = new Map<string, string>(results.map((item: any) => [item.id, item.contextData.title]))
          this.filteredSelfAchievements = this.filteredSelfAchievements.map((course: any) => ({
            ...course,
            name: nameMap.get(course.acquiredContextId) || course.name || '',
          }))
          if (this.activeTab === 'selfAchievement') {
            this.assignData('selfAchievement')
          }
        },
        (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open('Unable to fetch self achievement details!')
          }
        }
      )
  }

  fetchExtCourseDetails(): void {
    const identifiers = this.filteredExtCourses.map((course: any) => course.acquiredContextId)
    const payload = {
      filterCriteriaMap: {
        contentId: identifiers
      },
      requestedFields: [
        "name", "contentId"
      ],
      pageNumber: 0,
      pageSize: identifiers.length,
    }
    this.cpService.getExternalCourseList(payload)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe(
        (response: any) => {
          const results: any[] = response?.data || []
          const nameMap = new Map<string, string>(results.map((item: any) => [item.contentId, item.name]))
          this.filteredExtCourses = this.filteredExtCourses.map((course: any) => ({
            ...course,
            name: nameMap.get(course.acquiredContextId) || course.name || '',
          }))
          if (this.activeTab === 'extCourses') {
            this.assignData('extCourses')
          }
        },
        (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open('Unable to fetch external course details!')
          }
        }
      )
  }

  getCertificateSVG(obj: any, type?: string): void {
    // tslint: disable-next-line
    obj['loading'] = true
    if (obj && obj.printURI) {
      if (type === 'DOWNLOAD') {
        this.handleDownloadCertificatePDF(obj.printURI)
      }
      if (type === 'SHARE') {
        this.shareCertificate(obj.certificateId)
      }
      obj['loading'] = false
    } else {
      this.cpService.fetchCertificate(obj.certificateId)
        .pipe(takeUntil(this.destroySubject$))
        .subscribe(res => {
          // tslint: disable-next-line
          obj['printURI'] = res.result.printUri
          obj['loading'] = false
          this.dialog.open(CertificateDialogComponent, {
            width: '1200px',
            data: { cet: res.result.printUri, certId: obj.certificateId },
          })
        }, (error: HttpErrorResponse) => {
          if (!error.ok) {
            obj['loading'] = false
            obj['error'] = 'Failed to fetch Certificate'
          }
        })
    }
  }

  async handleDownloadCertificatePDF(uriData: any): Promise<void> {
    const img = new Image()
    img.src = uriData
    img.width = 1820
    img.height = 1000
    img.onload = () => {
      // tslint:disable-next-line
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [img.width, img.height]
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, img.width, img.height)
        // tslint:disable-next-line: max-line-length
        const quality = 1.0 // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingQuality
        const dataImg = canvas.toDataURL('application/pdf', quality)
        const pdf = new jsPDF('landscape', 'px', 'a4')

        // add the image to the PDF
        pdf.addImage(dataImg, 10, 20, 600, 350)

        // download the PDF
        pdf.save('Certificate.pdf')
      }
    }
  }

  shareCertificate(certId: any) {
    this.raiseShareIntreactTelemetry(certId, 'share')
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${environment.contentHost}/apis/public/v8/cert/download/${certId}`
    return window.open(url, '_blank')
  }

  handleNavigate(courseObj: any): void {
    if (this.activeTab === 'extCourses') {
      this.router.navigateByUrl(`/app/toc/ext/${courseObj.acquiredContextId}`)
    } else if (this.activeTab === 'iGOTCourses') {
      this.router.navigateByUrl(`app/toc/${courseObj.acquiredContextId}/overview`)
    }
  }

  handleViewMore(obj: any, flag?: string): void {
    obj.viewMore = flag ? false : true
  }

  raiseShareIntreactTelemetry(certId?: string, type?: string, action?: string) {
    this.events.raiseInteractTelemetry(
      {
        type: WsEvents.EnumInteractTypes.CLICK,
        id: `${type}-${WsEvents.EnumInteractSubTypes.CERTIFICATE}`,
        subType: action ? action : '',
      },
      {
        id: certId,   // id of the certificate
        type: WsEvents.EnumInteractSubTypes.CERTIFICATE,
      }
    )
  }

  assignData(tabName: string) {
    if (tabName === 'iGOTCourses') {
      this.currentTabData = this.filteredIGOTCourses
    } else if (tabName === 'extCourses') {
      this.currentTabData = this.filteredExtCourses
    } else if (tabName === 'selfAchievement') {
      this.currentTabData = this.filteredSelfAchievements
    }
  }

  resetAllViewMore(): void {
    this.filteredSelfAchievements.forEach(item => item.viewMore = false)
    this.filteredIGOTCourses.forEach(item => item.viewMore = false)
    this.filteredExtCourses.forEach(item => item.viewMore = false)
  }

  handleActiveTab(tabName: string): void {
    this.resetAllViewMore()
    this.activeTab = tabName
    this.assignData(tabName)
  }

  handleView(eachCert: any): void {
    const url = eachCert.certificateId
    window.open(url, '_blank')
  }

  ngOnDestroy(): void {
    this.destroySubject$.unsubscribe()
  }
}
