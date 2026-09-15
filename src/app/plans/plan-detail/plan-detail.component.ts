import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Observable, forkJoin, of } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'
import { TranslateService } from '@ngx-translate/core'
import { WidgetEnrollService } from '@sunbird-cb/utils-v2'
import {
  CardTransformerService,
  CardType,
  CardViewModel,
  CommonMethodsService,
  ContentDictionaryService,
  IBreadcrumbItem,
  PlanCardViewModel,
} from '@sunbird-cb/consumption'
import { IPlanReadResult, PlansService } from '../services/plans.service'

/** State of the plan's comprehensive assessment, shown in the progress panel and on its card. */
type AssessmentState = 'locked' | 'available' | 'completed'

@Component({
  selector: 'ws-app-plan-detail',
  templateUrl: './plan-detail.component.html',
  styleUrls: ['./plan-detail.component.scss'],
  standalone: false,
})
export class PlanDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute)
  private readonly plansSvc = inject(PlansService)
  private readonly dictionarySvc = inject(ContentDictionaryService)
  private readonly cardTransformer = inject(CardTransformerService)
  private readonly enrollSvc = inject(WidgetEnrollService)
  private readonly commonSvc = inject(CommonMethodsService)
  private readonly translate = inject(TranslateService)
  private readonly destroyRef = inject(DestroyRef)

  // ── State ──────────────────────────────────────────────────────────────────
  readonly loading = signal(true)
  readonly plan = signal<PlanCardViewModel | null>(null)
  private readonly raw = signal<IPlanReadResult | null>(null)
  readonly courses = signal<CardViewModel[]>([])
  readonly assessment = signal<CardViewModel | null>(null)
  /** collectionId -> enrolment record, for the completion counts. */
  private readonly enrolments = signal<Record<string, any>>({})
  /**
   * Feeds the overdue / completed badge on each course card, built from THIS plan.
   *
   * Deliberately NOT CbpPlanCacheService.watchPlanMap(): that map is the user's global CBP
   * associations, which collapse each content id to a single plan (MAX endDate wins) and omit
   * content the user has no association for. On a plan page that produced cards badged against
   * a different plan's due date, sitting next to cards with no badge at all. Every course here
   * belongs to this plan, so they all take this plan's date.
   */
  readonly cbPlanMapData = computed<Record<string, any>>(() => {
    const raw = this.raw()
    const endDate = raw?.endDate
    if (!endDate) {
      return {}
    }

    const planDuration = this.planDurationFor(endDate)
    const map: Record<string, any> = {}
    this.courses().forEach(course => {
      map[course.identifier] = {
        endDate,
        planDuration,
        // The card reads 2 as "completed"; anything else leaves the date-derived state.
        contentStatus: this.isCompleted(course.identifier) ? 2 : 0,
        isApar: !!raw?.isApar,
      }
    })
    return map
  })
  private readonly caCourseIds = signal<string[]>([])
  private readonly langTick = signal(0)

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly planTitle = computed(() => this.plan()?.title ?? '')

  readonly breadcrumbData = computed<IBreadcrumbItem[]>(() => {
    this.langTick()
    return [
      { url: '/page/home', title: this.translate.instant('plansShowAll.home'), icon: 'home' },
      { url: '/app/plans', title: this.translate.instant('plansShowAll.plans') },
      // Back to the listing filtered to this plan's own type, not whatever it defaults to.
      {
        url: '/app/plans',
        queryParams: this.listingQueryParams(),
        title: this.translate.instant(this.listingTitleKey()),
      },
      { title: this.planTitle() },
    ]
  })

  /** Back / breadcrumb target keeps the listing on the plan type this plan belongs to. */
  readonly listingQueryParams = computed(() => ({ planType: this.listingPlanType() }))

  readonly createdBy = computed(() => this.plan()?.createdByName || '—')

  readonly dueDate = computed(() => this.raw()?.endDate ?? '')

  /**
   * Some plans carry `planYear` ('2026-27') and some do not. When it is absent the reporting
   * year is derived from the end date — the financial year it falls in, which is how the
   * listing labels plans too.
   */
  readonly reportingYear = computed(() => {
    const declared = this.plan()?.planYear
    if (declared) {
      return declared
    }
    const endDate = this.raw()?.endDate
    if (!endDate) {
      return ''
    }
    const parsed = new Date(endDate)
    return isNaN(parsed.getTime()) ? '' : this.plansSvc.getCurrentFinancialYear(parsed)
  })

  readonly totalCourses = computed(() => this.courses().length)

  readonly completedCourses = computed(() =>
    this.courses().filter(course => this.isCompleted(course.identifier)).length)

  /** CA courses are flagged the same way the course card flags them. */
  readonly caCourses = computed(() => {
    const caIds = this.caCourseIds()
    return this.courses().filter(course =>
      caIds.includes(course.identifier) || !!(course.metadata as any)?.isCA)
  })

  readonly completedCaCourses = computed(() =>
    this.caCourses().filter(course => this.isCompleted(course.identifier)).length)

  /**
   * The assessment unlocks once every course in the plan is complete. The read response says
   * nothing about this, so it is derived — an empty plan leaves it locked rather than
   * unlocking on a vacuous "all zero courses done".
   */
  readonly assessmentState = computed<AssessmentState>(() => {
    const assessment = this.assessment()
    if (assessment && this.isCompleted(assessment.identifier)) {
      return 'completed'
    }
    const total = this.totalCourses()
    return total > 0 && this.completedCourses() === total ? 'available' : 'locked'
  })

  readonly assessmentStateKey = computed(() => {
    switch (this.assessmentState()) {
      case 'completed': return 'cardcontentv2.completed'
      case 'available': return 'planDetail.available'
      default: return 'planDetail.locked'
    }
  })

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.primeTranslations()
    this.caCourseIds.set(this.parseCaCourseIds())

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id')
        if (id) {
          this.fetchPlan(id)
        } else {
          this.loading.set(false)
        }
      })
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private fetchPlan(id: string): void {
    this.loading.set(true)

    this.plansSvc.readPlan(id)
      .pipe(
        switchMap(raw => {
          if (!raw) {
            return of(null)
          }
          this.raw.set(raw)
          // Same transformer the listing and the home strips use, so plan type and status are
          // derived by one rule everywhere.
          const [plan] = this.cardTransformer
            .transformCards([raw], CardType.PlanCard) as PlanCardViewModel[]
          this.plan.set(plan ?? null)

          const courseIds = raw.contentList.map(item => item?.identifier).filter(Boolean)
          const assessmentId = raw.comprehensiveAssessment
          const allIds = assessmentId ? [...courseIds, assessmentId] : courseIds
          if (!allIds.length) {
            return of(null)
          }

          // One dictionary read for every id, rather than one per card.
          //
          // The cast normalises the Observable type at the library boundary: @sunbird-cb/
          // consumption is symlinked to its build output and resolves `rxjs` from its OWN
          // node_modules, so its Observable<T> is a structurally different type from the
          // portal's. Inference across the two fails to compile under the spec tsconfig.
          const contents$ =
            this.dictionarySvc.getContents(allIds) as unknown as Observable<Record<string, any>>

          return forkJoin({
            contents: contents$.pipe(catchError(() => of({} as Record<string, any>))),
            enrolments: this.fetchEnrolments(allIds),
          })
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        if (result) {
          this.applyContents(result.contents)
          this.enrolments.set(result.enrolments)
        }
        this.loading.set(false)
      })
  }

  private applyContents(contents: Record<string, any>): void {
    const raw = this.raw()
    if (!raw) {
      return
    }

    // APAR / AI-CBP are properties of the PLAN, not of the content: nothing in the content
    // dictionary carries them, so a card built straight from dictionary metadata shows no type
    // chip. The home strips get these because resolveCbpAssociations() stamps the owning plan's
    // flags onto every content id as it flattens them — this does the same for one plan.
    const planType = this.plan()?.planType
    const planFlags: Record<string, any> = {
      isApar: planType === 'APAR',
      ...(planType === 'AICBP' ? { planTypeV2: 'AICBP' } : {}),
    }

    const toCard = (id: string): CardViewModel | null => {
      const content = contents?.[id]
      if (!content) {
        return null
      }
      const [card] = this.cardTransformer
        .transformCards([{ ...content, ...planFlags }], CardType.CourseCard) as CardViewModel[]
      return card ?? null
    }

    this.courses.set(
      raw.contentList
        .map(item => toCard(item?.identifier))
        .filter((card): card is CardViewModel => !!card))

    this.assessment.set(raw.comprehensiveAssessment ? toCard(raw.comprehensiveAssessment) : null)
  }

  /** collectionId -> enrolment record, matching how the rest of the app keys this response. */
  private fetchEnrolments(courseIds: string[]) {
    return this.enrollSvc.fetchEnrollContentData({ request: { courseId: courseIds } }).pipe(
      // Progress is an enhancement to the page, not a precondition for rendering it.
      catchError(() => of(null)),
      switchMap((res: any) => {
        const courses = res?.result?.courses
        const map: Record<string, any> = {}
        if (Array.isArray(courses)) {
          courses.forEach((entry: any) => {
            const key = entry?.collectionId ?? entry?.courseId
            if (key) {
              map[key] = entry
            }
          })
        }
        return of(map)
      }),
    )
  }

  /**
   * Same overdue / upcoming / success bucketing the CBP flows apply elsewhere
   * (WidgetUserServiceLib.getPlanDuration): past due is 'overdue', more than 29 days out is
   * 'success' (which the card renders as no badge), everything between is 'upcoming'.
   *
   * Both dates are reduced to a UTC day number before subtracting, so a DST boundary between
   * today and the due date cannot shift the result by a day.
   */
  private planDurationFor(endDate: string): string {
    const end = new Date(endDate)
    if (isNaN(end.getTime())) {
      return 'success'
    }
    const toDayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    const days = Math.round((toDayNumber(end) - toDayNumber(new Date())) / 86400000)
    if (days < 0) {
      return 'overdue'
    }
    return days > 29 ? 'success' : 'upcoming'
  }

  private isCompleted(identifier: string): boolean {
    const entry = this.enrolments()[identifier]
    if (!entry) {
      return false
    }
    return entry.completionPercentage === 100 || entry.status === 2
  }

  /** Ids of the user's CA course units, stored by CommonMethodsService as a JSON string. */
  private parseCaCourseIds(): string[] {
    try {
      const parsed = JSON.parse(this.commonSvc.getCourseUnitIds() || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private listingPlanType(): string {
    switch (this.plan()?.planType) {
      case 'APAR': return 'apar'
      case 'AICBP': return 'aicbp'
      default: return 'cbp'
    }
  }

  private listingTitleKey(): string {
    switch (this.plan()?.planType) {
      case 'APAR': return 'plansShowAll.aparPlan'
      case 'AICBP': return 'plansShowAll.aiCbpDraftPlan'
      default: return 'plansShowAll.cbpPlan'
    }
  }

  /** See the note in PlansModule on why this module has its own TranslateService. */
  private primeTranslations(): void {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.langTick.update(tick => tick + 1))

    const lang = localStorage.getItem('websiteLanguage') || 'en'
    this.translate.setDefaultLang('en')
    this.translate.use(lang)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.langTick.update(tick => tick + 1))
  }
}
