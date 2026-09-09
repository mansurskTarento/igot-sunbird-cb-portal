import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2'

@Component({
    selector: 'ws-upcoming-timeline',
    templateUrl: './upcoming-timeline.component.html',
    styleUrls: ['./upcoming-timeline.component.scss'],
    standalone: false
})
export class UpcomingTimelineComponent implements OnInit {
  @Output()
  filterValueEmit = new EventEmitter()
  @Input() upcommingList: any
  @Input() overDueList: any
  @Input() aparList: any

  tabResults: any[] = []
  tabSelected: any
  dynamicTabIndex = 0
  cbpConfig: any
  seeAllPageConfig: any
  contentDataList: any
  constructor(private activatedRoute: ActivatedRoute,
              private translate: TranslateService,
              private langtranslations: MultilingualTranslationsService
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
      this.cbpConfig = this.activatedRoute.snapshot.data.pageData.Data
    }
  }

  upComingMethod(event: any) {
    // APAR is a plan type now rather than a flag of its own, so these tabs name it that way.
    //
    // Upcoming and Overdue ask for the side of the due date the section itself is built from —
    // every plan not yet due, and every plan already past due — rather than for a window
    // relative to today. A rolling window ("upcoming 30 days", "the last 3 months") lists only
    // part of what the section counts, and none of it at all once the selected plan year is one
    // that ended more than that window ago.
    const upcomingData: any = {
      planType: '',
      primaryCategory: [],
      status: ['0', '1'],
      timeDuration: ['upcoming'],
      competencyArea: [],
      competencyTheme: [],
      competencySubTheme: [],
      providers: [],
    }
    const overDue: any = {
      planType: '',
      primaryCategory: [],
      status: ['0', '1'],
      timeDuration: ['overdue'],
      competencyArea: [],
      competencyTheme: [],
      competencySubTheme: [],
      providers: [],
    }
    const apar: any = {
      planType: 'apar',
      primaryCategory: [],
      status: [],
      timeDuration: [],
      competencyArea: [],
      competencyTheme: [],
      competencySubTheme: [],
      providers: [],
    }
    const finalFilterData: any = event === 'apar' ? apar : event === 'overdue' ? overDue : upcomingData
    this.filterValueEmit.emit(finalFilterData)
  }
  scroll(el: any) {
    const element = el
    let topOfElement: any = document.getElementById(element)
    topOfElement = topOfElement.offsetTop - 140
    window.scroll({ top: topOfElement, behavior: 'smooth' })
  }
}
