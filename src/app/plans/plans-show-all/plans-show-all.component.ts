import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { MatDialog } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import { ValueService } from '@sunbird-cb/utils-v2'
import {
  CardType,
  CardTransformerService,
  FilterConfig,
  IBreadcrumbItem,
  PlanCardViewModel,
  SelectedFilters,
} from '@sunbird-cb/consumption'
import { PLAN_FACETS, PlanTypeKey, PlansService } from '../services/plans.service'
import { PlansFilterMobileComponent } from '../plans-filter-mobile/plans-filter-mobile.component'

interface IPlanTypeMeta {
  key: PlanTypeKey
  /** Translation key for the page heading, e.g. 'APAR Plan'. */
  titleKey: string
  /**
   * Server-side narrowing for this plan type. `isApar` is a facet the plan search already
   * exposes, so it is filterable by construction; `planType` is sent on the assumption the
   * API names the AI-CBP flag the same way the plan payload does. An API that ignores an
   * unknown filter key just returns a wider set — `narrowToPlanType()` below re-applies the
   * split on the client so the rendered list is right either way.
   */
  filter: Record<string, any>
}

const PLAN_TYPES: IPlanTypeMeta[] = [
  { key: 'apar', titleKey: 'plansShowAll.aparPlan', filter: { isApar: true } },
  {
    key: 'aicbp',
    titleKey: 'plansShowAll.aiCbpDraftPlan',
    filter: { isApar: false, planType: 'AICBP' },
  },
  { key: 'cbp', titleKey: 'plansShowAll.cbpPlan', filter: { isApar: false } },
]

/** Maps a plan-type key to the `planType` a transformed card reports. */
const CARD_PLAN_TYPE: Record<PlanTypeKey, PlanCardViewModel['planType']> = {
  apar: 'APAR',
  aicbp: 'AICBP',
  cbp: 'CBP',
}

const SORT_OPTIONS = [
  { labelKey: 'plansShowAll.sortDueDateAsc', orderBy: 'endDate', orderDirection: 'asc' as const },
  { labelKey: 'plansShowAll.sortDueDateDesc', orderBy: 'endDate', orderDirection: 'desc' as const },
  { labelKey: 'plansShowAll.sortRecentlyCreated', orderBy: 'createdAt', orderDirection: 'desc' as const },
  { labelKey: 'plansShowAll.sortNameAsc', orderBy: 'name', orderDirection: 'asc' as const },
  { labelKey: 'plansShowAll.sortNameDesc', orderBy: 'name', orderDirection: 'desc' as const },
]

/**
 * Headings and control types for the filter panel, keyed by facet name. A facet the API
 * returns that is not listed here still renders — FilterByComponent derives a heading from
 * the key — this map only pins the wording and the radio/checkbox choice the design calls for.
 */
const FACET_META: Record<string, { heading: string, selectType: 'checkbox' | 'radio', order: number }> = {
  createdByName: { heading: 'Created By', selectType: 'checkbox', order: 3 },
  orgName: { heading: 'Organisation Plan', selectType: 'checkbox', order: 4 },
  orgIdList: { heading: 'Working Organisation', selectType: 'radio', order: 5 },
  designation: { heading: 'Working Designation', selectType: 'radio', order: 6 },
}

/** Facets that duplicate a control the panel already renders from static options. */
const SUPPRESSED_FACETS = new Set(['isApar', 'planYear', 'contentType', 'status'])

@Component({
  selector: 'ws-app-plans-show-all',
  templateUrl: './plans-show-all.component.html',
  styleUrls: ['./plans-show-all.component.scss'],
  standalone: false,
})
export class PlansShowAllComponent implements OnInit {

  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly plansSvc = inject(PlansService)
  private readonly cardTransformer = inject(CardTransformerService)
  private readonly valueSvc = inject(ValueService)
  private readonly dialog = inject(MatDialog)
  private readonly translate = inject(TranslateService)
  private readonly destroyRef = inject(DestroyRef)

  readonly planTypes = PLAN_TYPES
  readonly sortOptions = SORT_OPTIONS
  readonly pageSizeOptions = [12, 24, 50, 100]

  // ── State ──────────────────────────────────────────────────────────────────
  readonly planTypeKey = signal<PlanTypeKey>('apar')
  readonly planYear = signal('')
  readonly currentPage = signal(1)
  readonly pageSize = signal(12)
  readonly sortIndex = signal(0)
  readonly appliedFilters = signal<SelectedFilters>({})
  readonly cards = signal<PlanCardViewModel[]>([])
  readonly totalCount = signal(0)
  readonly loading = signal(true)
  readonly isFilterPanelOpen = signal(false)
  readonly isLtMedium = signal(false)
  private readonly facets = signal<Record<string, { value: string, count: number }[]>>({})
  /**
   * Bumped whenever translations become available or the language changes, so every
   * `translate.instant()` computed below re-resolves. A counter rather than the language
   * code: priming the service ends on the same code it started with, and re-setting a
   * signal to its current value would not invalidate anything.
   */
  private readonly langTick = signal(0)

  readonly planYearOptions = computed(() => {
    this.langTick()
    return this.plansSvc.getPlanYearOptions().map(option => ({
      value: option.value,
      label: option.isCurrent
        ? this.translate.instant('plansShowAll.currentReportingYear', { year: option.value })
        : option.value,
    }))
  })

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly activePlanType = computed<IPlanTypeMeta>(() =>
    PLAN_TYPES.find(type => type.key === this.planTypeKey()) ?? PLAN_TYPES[0])

  readonly pageTitle = computed(() => {
    this.langTick()
    return this.translate.instant(this.activePlanType().titleKey)
  })

  readonly breadcrumbData = computed<IBreadcrumbItem[]>(() => {
    this.langTick()
    return [
      { url: '/page/home', title: this.translate.instant('plansShowAll.home'), icon: 'home' },
      { url: '/app/plans', title: this.translate.instant('plansShowAll.plans') },
      // The plan type is the page itself, so it is the trailing crumb and carries no link.
      { title: this.translate.instant(this.activePlanType().titleKey) },
    ]
  })

  /** Label of the selected reporting year, shown on the toolbar's year button. */
  readonly planYearLabel = computed(() =>
    this.planYearOptions().find(option => option.value === this.planYear())?.label ?? this.planYear())

  readonly sortLabel = computed(() => {
    this.langTick()
    return this.translate.instant(SORT_OPTIONS[this.sortIndex()]?.labelKey ?? '')
  })

  readonly appliedFilterCount = computed(() =>
    Object.values(this.appliedFilters()).reduce((total, values) => total + (values?.length ?? 0), 0))

  readonly skeletonRows = computed(() => Array.from({ length: Math.min(this.pageSize(), 8) }, () => 0))

  /**
   * Panel sections: plan type and reporting year are always offered as radio lists (they are
   * the listing's two primary axes and are driven by the toolbar as well), followed by
   * whatever the API returned facets for.
   */
  readonly filterConfig = computed<FilterConfig[]>(() => {
    this.langTick()
    const selected = this.appliedFilters()

    const staticSections: FilterConfig[] = [
      {
        key: 'planTypeKey',
        heading: this.translate.instant('plansShowAll.planType'),
        selectType: 'radio',
        showSearch: false,
        showSeeMore: false,
        showCount: false,
        order: 1,
        options: PLAN_TYPES.map(type => ({
          name: type.key,
          displayName: this.translate.instant(type.titleKey),
          isChecked: type.key === this.planTypeKey(),
        })),
      },
    ]

    const facetSections: FilterConfig[] = Object.entries(this.facets())
      .filter(([key, values]) => !SUPPRESSED_FACETS.has(key) && Array.isArray(values) && values.length > 0)
      .map(([key, values]) => {
        const meta = FACET_META[key]
        return {
          key,
          heading: meta?.heading ?? key,
          selectType: meta?.selectType ?? 'checkbox',
          showSearch: values.length > 4,
          showSeeMore: values.length > 4,
          seeMoreLimit: 4,
          showCount: false,
          order: meta?.order ?? 999,
          options: values.map(value => ({
            name: value.value,
            displayName: value.value,
            count: value.count,
            isChecked: (selected[key] ?? []).includes(value.value),
          })),
        }
      })

    return [...staticSections, ...facetSections].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  })

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.primeTranslations()

    this.valueSvc.isLtMedium$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isLtMedium => this.isLtMedium.set(isLtMedium))

    // Driven by the URL so a filtered listing stays shareable and survives a reload.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const typeParam = params.get('planType') as PlanTypeKey | null
        this.planTypeKey.set(
          PLAN_TYPES.some(type => type.key === typeParam) ? (typeParam as PlanTypeKey) : 'apar')

        const yearParam = params.get('planYear')
        this.planYear.set(
          this.planYearOptions().some(option => option.value === yearParam)
            ? (yearParam as string)
            : this.plansSvc.getCurrentFinancialYear())

        const pageParam = Number(params.get('page'))
        this.currentPage.set(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1)

        const sizeParam = Number(params.get('pageSize'))
        this.pageSize.set(this.pageSizeOptions.includes(sizeParam) ? sizeParam : 12)

        this.fetchPlans()
      })
  }

  /**
   * Loads strings into this module's own TranslateService (see the note in PlansModule on
   * why it has one) using the language the portal stores for the user, and re-resolves the
   * translated computeds once they land.
   */
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

  // ── Data ───────────────────────────────────────────────────────────────────
  private fetchPlans(): void {
    this.loading.set(true)
    const sort = SORT_OPTIONS[this.sortIndex()] ?? SORT_OPTIONS[0]

    this.plansSvc.search({
      filter: {
        planYear: this.planYear(),
        ...this.activePlanType().filter,
        ...this.serverFilters(),
      },
      // The API pages from zero; the UI counts from one.
      pageNumber: this.currentPage() - 1,
      pageSize: this.pageSize(),
      searchString: '',
      orderBy: sort.orderBy,
      orderDirection: sort.orderDirection,
      facets: PLAN_FACETS,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        // Same transformer the home strips use, so a plan looks identical in both places.
        const transformed = this.cardTransformer
          .transformCards(result.data, CardType.PlanCard) as PlanCardViewModel[]
        this.cards.set(this.narrowToPlanType(transformed))
        this.totalCount.set(result.totalCount)
        this.facets.set(result.facets)
        this.loading.set(false)
      })
  }

  /** Facet-derived selections only — the plan-type section drives the URL instead. */
  private serverFilters(): Record<string, string[]> {
    const { planTypeKey, ...rest } = this.appliedFilters()
    return rest as Record<string, string[]>
  }

  /**
   * Re-applies the plan-type split on the client. CBP and AI-CBP plans are both `isApar:
   * false`, so a server that does not understand the `planType` filter key returns them
   * together; this keeps the rendered page correct in that case. `totalCount` still comes
   * from the server, so page counts stay exact only once the API filters on plan type.
   */
  private narrowToPlanType(cards: PlanCardViewModel[]): PlanCardViewModel[] {
    const expected = CARD_PLAN_TYPE[this.planTypeKey()]
    return cards.filter(card => card.planType === expected)
  }

  // ── Toolbar handlers ───────────────────────────────────────────────────────
  onPlanTypeChange(key: PlanTypeKey): void {
    this.patchQueryParams({ planType: key, page: 1 })
  }

  onPlanYearChange(year: string): void {
    this.patchQueryParams({ planYear: year, page: 1 })
  }

  onSortChange(index: number): void {
    this.sortIndex.set(index)
    this.currentPage.set(1)
    this.fetchPlans()
  }

  onPageChange(event: { currentPage: number, limit: number }): void {
    this.patchQueryParams({ page: event.currentPage, pageSize: event.limit })
  }

  // ── Filter handlers ────────────────────────────────────────────────────────
  toggleFilterPanel(): void {
    if (this.isLtMedium()) {
      this.openMobileFilter()
      return
    }
    this.isFilterPanelOpen.update(open => !open)
  }

  /** Mobile uses the two-pane dialog: selections are staged and only applied on confirm. */
  private openMobileFilter(): void {
    this.dialog.open(PlansFilterMobileComponent, {
      data: { filterConfig: this.filterConfig(), selectedFilters: this.appliedFilters() },
      panelClass: 'plans-filter-mobile-panel',
      width: '100vw',
      maxWidth: '100vw',
      height: '100%',
      autoFocus: false,
    })
      .afterClosed()
      .subscribe((selected: SelectedFilters | undefined) => {
        if (selected) {
          this.onFilterApplied(selected)
        }
      })
  }

  onFilterApplied(selected: SelectedFilters): void {
    // Plan type lives in the URL, so pull it back out of the panel's payload rather than
    // sending it to the API as a filter. The reporting year is not in the panel at all — the
    // toolbar's year control owns it.
    const nextType = selected['planTypeKey']?.[0] as PlanTypeKey | undefined

    this.appliedFilters.set(selected)

    if (nextType && nextType !== this.planTypeKey()) {
      // The queryParamMap subscription re-fetches, so do not also fetch here.
      this.patchQueryParams({ planType: nextType, page: 1 })
      return
    }

    this.currentPage.set(1)
    this.fetchPlans()
  }

  onFilterCleared(): void {
    this.appliedFilters.set({})
    this.currentPage.set(1)
    this.fetchPlans()
  }

  private patchQueryParams(params: Record<string, string | number>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    })
  }
}
