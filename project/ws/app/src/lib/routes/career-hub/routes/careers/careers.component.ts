import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { UntypedFormControl } from '@angular/forms'
import { WsEvents, EventService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { TranslateService } from '@ngx-translate/core'
import * as _ from 'lodash'

@Component({
    selector: 'ws-app-careers',
    templateUrl: './careers.component.html',
    styleUrls: ['./careers.component.scss'],
    standalone: false
})
export class CareersComponent implements OnInit {
  data!: any
  queryControl = new UntypedFormControl('')
  currentFilter = 'timestamp'
  pager = {}
  paginationData!: any
  currentActivePage!: any
  categoryId!: any
  fetchNewData = false

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventSvc: EventService,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService
  ) {
    this.data = this.route.snapshot.data.topics.data
    this.paginationData = this.data.pagination
    this.categoryId = this.route.snapshot.data['careersCategoryId'] || 1
    this.setPagination()
    this.langtranslations.languageSelectedObservable.subscribe(() => {
      if (localStorage.getItem('websiteLanguage')) {
        this.translate.setDefaultLang('en')
        const lang = localStorage.getItem('websiteLanguage')!
        this.translate.use(lang)
      }
    })
  }

  ngOnInit() {
    this.route.queryParams.subscribe(x => {
      this.currentActivePage = x.page || 1
    })
  }

  translateHub(hubName: string): string {
    const translationKey =  hubName
    return this.translate.instant(translationKey)
  }

  filter(key: string | 'timestamp' | 'viewcount') {
    if (key) {
      this.currentFilter = key
    }
  }
  updateQuery(key: string) {
    if (key) {

    }
  }

  navigateWithPage(page: any) {
    if (page !== this.currentActivePage) {
      this.router.navigate(['/app/careers/home'], { queryParams: { page } })
      this.fetchNewData = true
    }
  }

  setPagination() {
    this.pager = {
      startIndex: this.paginationData.first.page,
      endIndex: this.paginationData.last.page,
      // pages: Array.from(Array(this.paginationData.pageCount), (_x, index) => index + 1),
      pages: this.paginationData.pages,
      currentPage: this.paginationData.currentPage,
      totalPage: this.paginationData.pageCount,
    }
  }

  tabTelemetry(label: string, index: number) {
    const data: WsEvents.ITelemetryTabData = {
      label,
      index,
    }
    this.eventSvc.raiseInteractTelemetry(
      {
        type: WsEvents.EnumInteractTypes.CLICK,
        subType: WsEvents.EnumInteractSubTypes.CAREER_TAB,
        id: `${_.camelCase(data.label)}-tab`,
      },
      {},
      {
        module: WsEvents.EnumTelemetrymodules.CAREER,
      }
    )
  }

}
