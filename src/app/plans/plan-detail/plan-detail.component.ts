import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Observable, combineLatest, forkJoin, from, of } from 'rxjs'
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators'
import { TranslateService } from '@ngx-translate/core'
import { WidgetEnrollService } from '@sunbird-cb/utils-v2'
import {
  CardTransformerService,
  CardType,
  CardViewModel,
  ContentDictionaryService,
  IBreadcrumbItem,
  IUserCbpPlan,
  PlanCardViewModel,
  UserCbpPlansService,
} from '@sunbird-cb/consumption'
import { IPlanReadResult, PlansService } from '../services/plans.service'

/** State of the plan's comprehensive assessment, shown in the progress panel and on its card. */
type AssessmentState = 'locked' | 'available' | 'completed'

/** Plan-type keys `/app/plans` understands; anything else in the URL is ignored. */
const LISTING_PLAN_TYPES = ['apar', 'aicbp', 'cbp']

/** Reporting year as the listing's filter and the plan APIs both spell it — '2026-27'. */
const PLAN_YEAR_PATTERN = /^\d{4}-\d{2}$/

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
  private readonly userCbpPlansSvc = inject(UserCbpPlansService)
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
  private readonly langTick = signal(0)
  /**
   * Listing plan-type key handed over in the URL by the card that was clicked, used only
   * until the plan itself resolves — without it the back link renders as "CBP Plan" for a
   * beat on every APAR and AI-CBP plan, because `plan()` is still null.
   */
  private readonly planTypeHint = signal<string>('')
  /** The same for the reporting year, until `reportingYear()` can answer for the plan itself. */
  private readonly planYearHint = signal<string>('')

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly planTitle = computed(() => this.plan()?.title ?? '')

  readonly breadcrumbData = computed<IBreadcrumbItem[]>(() => {
    this.langTick()
    return [
      { url: '/page/home', title: this.translate.instant('plansShowAll.home'), icon: 'home' },
      // Back to the listing filtered to this plan's own type, not whatever it defaults to.
      {
        url: '/app/plans',
        queryParams: this.listingQueryParams(),
        title: this.translate.instant(this.listingTitleKey()),
      },
      { title: this.planTitle() },
    ]
  })

  /**
   * Back / breadcrumb target keeps the listing on the plan type AND the reporting year this
   * plan belongs to. Without the year the listing falls back to the current one, so leaving a
   * 2025-26 plan lands on a page that does not contain the plan just left — the type filter
   * alone is not enough to get back where the user came from.
   *
   * The plan's own year once it has loaded, the URL's before that. Neither is guaranteed: a
   * plan with no year and no end date sends no `planYear`, and the listing defaults as usual.
   */
  readonly listingQueryParams = computed(() => {
    const planYear = this.reportingYear() || this.planYearHint()
    return planYear
      ? { planType: this.listingPlanType(), planYear }
      : { planType: this.listingPlanType() }
  })

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

  /**
   * The reporting year as the panel prints it — '2026 - 27'. Spacing only; `reportingYear()`
   * stays the bare 'YYYY-YY' the API and the listing's year filter both speak.
   */
  readonly reportingYearLabel = computed(() => {
    const year = this.reportingYear()
    const parts = year.split('-')
    return parts.length === 2 ? `${parts[0]} - ${parts[1]}` : year
  })

  readonly totalCourses = computed(() => this.courses().length)

  readonly completedCourses = computed(() =>
    this.courses().filter(course => this.isCompleted(course.identifier)).length)

  /**
   * The courses this plan's comprehensive assessment covers — flagged in applyContents from the
   * plan's own `mandatory` marks, and only when the plan actually links a CA.
   *
   * Deliberately NOT the `comprehensiveAssessmentCourseUnits` list CommonMethodsService keeps:
   * that holds the course units of every CA assigned to the user, so a plan with no CA of its
   * own showed "CA Courses Completed" for courses some other plan's CA happened to cover.
   */
  readonly caCourses = computed(() => {
    if (!this.raw()?.comprehensiveAssessment) {
      return []
    }
    return this.courses().filter(course => !!(course.metadata as any)?.isCA)
  })

  readonly completedCaCourses = computed(() =>
    this.caCourses().filter(course => this.isCompleted(course.identifier)).length)

  /**
   * Ids of the courses that gate the assessment: the ones the plan marks `mandatory`.
   *
   * Taken from the plan rather than from `courses()`, because a card is only built for content
   * the dictionary resolved — gating on the cards would silently drop a mandatory course whose
   * metadata failed to load, and unlock the assessment early.
   */
  readonly gatingCourseIds = computed<string[]>(() =>
    (this.raw()?.contentList ?? [])
      .filter(item => !!item?.mandatory && !!item?.identifier)
      .map(item => item.identifier))

  /**
   * The assessment unlocks once every MANDATORY course in the plan is complete. The read
   * response says nothing about the state itself, so it is derived from that flag — the same
   * rule the assessment's own TOC page applies, so the two screens cannot disagree.
   *
   * Optional courses never gate it, and a plan with nothing mandatory has nothing to wait on,
   * so its assessment is available from the start.
   */
  readonly assessmentState = computed<AssessmentState>(() => {
    const assessment = this.assessment()
    if (assessment && this.isCompleted(assessment.identifier)) {
      return 'completed'
    }
    const gating = this.gatingCourseIds()
    return gating.every(identifier => this.isCompleted(identifier)) ? 'available' : 'locked'
  })

  readonly assessmentStateIcon = computed(() => {
    switch (this.assessmentState()) {
      case 'completed': return 'check'
      case 'available': return 'lock_open'
      default: return 'lock'
    }
  })

  readonly assessmentStateKey = computed(() => {
    switch (this.assessmentState()) {
      case 'completed': return 'cardcontentv2.completed'
      case 'available': return 'planDetail.unlocked'
      default: return 'planDetail.locked'
    }
  })

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.primeTranslations()

    // Both maps, because the plan year in the query string decides whether this page needs
    // the read API at all — see resolvePlan$. distinctUntilChanged keeps an unrelated query
    // param change from re-running the whole load.
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([params, query]) => ({
          id: params.get('id') ?? '',
          planYear: query.get('planYear') ?? '',
          planType: query.get('planType') ?? '',
        })),
        distinctUntilChanged((a, b) =>
          a.id === b.id && a.planYear === b.planYear && a.planType === b.planType),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ id, planYear, planType }) => {
        this.planTypeHint.set(LISTING_PLAN_TYPES.includes(planType) ? planType : '')
        this.planYearHint.set(PLAN_YEAR_PATTERN.test(planYear) ? planYear : '')
        if (id) {
          this.fetchPlan(id, planYear)
        } else {
          this.loading.set(false)
        }
      })
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private fetchPlan(id: string, planYear: string): void {
    this.loading.set(true)

    this.resolvePlan$(id, planYear)
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

  /**
   * The plan itself — out of the CBPlan V4 cache when that year is already in IndexedDB, off
   * the read endpoint when it is not.
   *
   * The listing and the home strips both render from that cache entry, so a plan opened from
   * either is already on the device in full: name, dates, content ids, the lot. Reading it
   * back is free, where `readPlan` is a second request for data we are already holding.
   *
   * A miss — no entry, an entry past its TTL, or a plan belonging to some other year — falls
   * straight through to the API, which is exactly what this page did before. So the cache can
   * only remove a request, never add one.
   */
  private resolvePlan$(id: string, planYear: string): Observable<IPlanReadResult | null> {
    return from(this.findCachedPlan(id, planYear)).pipe(
      switchMap(cached => cached ? of(this.toReadResult(cached)) : this.plansSvc.readPlan(id)),
    )
  }

  /**
   * The plan in the cached year, if it is there.
   *
   * Scans all three lists rather than picking one by the `planType` param: a plan id is
   * unique across them, and letting a hand-edited or stale URL choose the list would turn a
   * wrong guess into a needless API call. The param stays a display hint, nothing more.
   */
  private async findCachedPlan(id: string, planYear: string): Promise<IUserCbpPlan | undefined> {
    try {
      const year = planYear || this.userCbpPlansSvc.getCurrentPlanYear()
      const entry = await this.userCbpPlansSvc.getCacheEntry(year)
      // Valid only. UserCbpPlansService keeps stale entries to fall back on when the API
      // fails, not to serve as a source of truth — a plan edited since would go unnoticed
      // here, and the read endpoint is the cheaper way to be right.
      if (!entry || !this.userCbpPlansSvc.isEntryValid(entry)) {
        return undefined
      }
      return [...entry.aparPlanList, ...entry.aiCbpPlanList, ...entry.cbpPlanList]
        .find((plan: IUserCbpPlan) => plan && plan.planId === id)
    } catch {
      // The cache is an optimisation; a database that is blocked or unavailable just means
      // this page loads the way it always did.
      return undefined
    }
  }

  /**
   * A cached V4 plan in the shape the rest of this page already speaks.
   *
   * Only three fields actually differ. Everything the card transformer reads — planYear,
   * endDate, isApar, planType, createdByOrgName, contentList — the V4 plan already carries
   * under the same names.
   */
  private toReadResult(plan: IUserCbpPlan): IPlanReadResult {
    return {
      ...plan,
      id: plan.planId,
      contentList: (plan.contentList ?? [])
        .filter(item => !!(item && item.identifier))
        .map(item => ({ identifier: item.identifier, mandatory: item.mandatory })),
      // V4 sends null where the read endpoint omits the field. Falsy either way, but the
      // declared types here are `string | undefined`, so the nulls are dropped.
      planType: plan.planType || undefined,
      // The dictionary now sends the CA id as `caLinkedId` (it used to be
      // `comprehensiveAssessment`); the library caches plans verbatim, so an entry written
      // before the rename can still carry the old name.
      comprehensiveAssessment:
        (plan as IUserCbpPlan & { caLinkedId?: string | null }).caLinkedId
        || plan.comprehensiveAssessment
        || undefined,
    }
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

    // `mandatory` only means "covered by the CA" when there is a CA. A plan without one can
    // still mark courses mandatory, and those must not pick up the CA chip or the rail count.
    const hasCa = !!raw.comprehensiveAssessment

    const toCard = (id: string, mandatory = false): CardViewModel | null => {
      const content = contents?.[id]
      if (!content) {
        return null
      }
      const [card] = this.cardTransformer.transformCards(
        [{ ...content, ...planFlags, ...(mandatory ? { isCA: true } : {}) }],
        CardType.CourseCard) as CardViewModel[]
      if (!card) {
        return null
      }
      // Set twice on purpose. The transformer keeps a fixed field set and parks everything
      // else under `metadata`, but CardCourseV2Component reads `isCA` off the TOP level
      // (unlike `isApar`, which it looks for in both places) — so the chip needs the stamp
      // here, while the rail's "CA Courses" count reads the metadata copy above.
      return mandatory ? { ...card, isCA: true } as CardViewModel : card
    }

    // A plan marks the courses its comprehensive assessment covers with `mandatory` on the
    // contentList entry; nothing on the content itself says so. Both plan sources carry the
    // flag — CBPlan V4 in IUserCbpPlanContent, the read endpoint through
    // PlansService.normaliseContentList — so this works cached or fetched.
    this.courses.set(
      raw.contentList
        .map(item => toCard(item?.identifier, hasCa && !!item?.mandatory))
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

  /** The loaded plan's own type, or the URL's hint while it is still loading. */
  private listingPlanType(): string {
    const loaded = this.plan()?.planType
    if (!loaded) {
      return this.planTypeHint() || 'cbp'
    }
    switch (loaded) {
      case 'APAR': return 'apar'
      case 'AICBP': return 'aicbp'
      default: return 'cbp'
    }
  }

  /** Derived from listingPlanType() so the crumb's label and its link can never disagree. */
  private listingTitleKey(): string {
    switch (this.listingPlanType()) {
      case 'apar': return 'plansShowAll.aparPlan'
      case 'aicbp': return 'plansShowAll.aiCbpDraftPlan'
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
