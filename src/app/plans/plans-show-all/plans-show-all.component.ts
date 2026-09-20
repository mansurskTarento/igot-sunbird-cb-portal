import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { from } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import { ValueService } from '@sunbird-cb/utils-v2'
import {
  CardType,
  CardTransformerService,
  FilterConfig,
  IBreadcrumbItem,
  IUserCbpPlan,
  IUserCbpPlanCacheEntry,
  PlanCardViewModel,
  SelectedFilters,
  UserCbpPlansService,
} from '@sunbird-cb/consumption'
import { PlanTypeKey, PlansService } from '../services/plans.service'
import { PlansFilterMobileComponent } from '../plans-filter-mobile/plans-filter-mobile.component'

/**
 * What the listing can be scoped to: the three plan types the API splits, plus 'all'.
 *
 * 'all' is local to this page rather than added to PlanTypeKey, because it is a view over
 * the three types and not a fourth kind of plan — nothing downstream (a plan's detail page,
 * a card's badge) can be 'all'.
 */
type PlanFilterKey = PlanTypeKey | 'all'

interface IPlanTypeMeta {
  key: PlanFilterKey
  /** Translation key for the page heading, e.g. 'APAR Plan'. */
  titleKey: string
}

const PLAN_TYPES: IPlanTypeMeta[] = [
  { key: 'all', titleKey: 'plansShowAll.allPlans' },
  { key: 'apar', titleKey: 'plansShowAll.aparPlan' },
  { key: 'aicbp', titleKey: 'plansShowAll.aiCbpDraftPlan' },
  { key: 'cbp', titleKey: 'plansShowAll.cbpPlan' },
]

/**
 * Sort options, applied in memory.
 *
 * Only fields CBPlan V4 actually sends are offered. "Recently created" used to be here and
 * is not any more: the V4 plan carries no creation date, and a sort control that silently
 * does nothing is worse than one that is absent.
 */
const SORT_OPTIONS = [
  { labelKey: 'plansShowAll.sortDueDateAsc', field: 'endDate' as const, direction: 1 },
  { labelKey: 'plansShowAll.sortDueDateDesc', field: 'endDate' as const, direction: -1 },
  { labelKey: 'plansShowAll.sortNameAsc', field: 'title' as const, direction: 1 },
  { labelKey: 'plansShowAll.sortNameDesc', field: 'title' as const, direction: -1 },
]

/** The one facet V4 can support, derived from the plans themselves. */
const CREATED_BY_FACET = 'createdByName'

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
  private readonly userCbpPlansSvc = inject(UserCbpPlansService)
  private readonly cardTransformer = inject(CardTransformerService)
  private readonly valueSvc = inject(ValueService)
  private readonly dialog = inject(MatDialog)
  private readonly translate = inject(TranslateService)
  private readonly destroyRef = inject(DestroyRef)

  readonly planTypes = PLAN_TYPES
  readonly sortOptions = SORT_OPTIONS
  readonly pageSizeOptions = [12, 24, 50, 100]

  // ── State ──────────────────────────────────────────────────────────────────
  readonly planTypeKey = signal<PlanFilterKey>('apar')
  readonly planYear = signal('')
  readonly currentPage = signal(1)
  readonly pageSize = signal(12)
  readonly sortIndex = signal(0)
  readonly appliedFilters = signal<SelectedFilters>({})
  readonly loading = signal(true)
  readonly isFilterPanelOpen = signal(false)
  readonly isLtMedium = signal(false)

  /**
   * The whole V4 payload for the loaded year — all three plan lists at once.
   *
   * This is the only thing on the page that comes from the network. Plan type, filters,
   * sorting and paging are all narrowings OF this value, computed below, so switching any
   * of them re-renders without a request. The year is the exception: it selects which
   * dataset this holds, so changing it reloads (see `loadPlans`).
   */
  private readonly planData = signal<IUserCbpPlanCacheEntry | null>(null)

  /** The year `planData` was loaded for, so a param change that isn't the year won't refetch. */
  private readonly loadedYear = signal('')

  /**
   * Bumped whenever translations become available or the language changes, so every
   * `translate.instant()` computed below re-resolves. A counter rather than the language
   * code: priming the service ends on the same code it started with, and re-setting a
   * signal to its current value would not invalidate anything.
   */
  private readonly langTick = signal(0)

  // ── Derived: plan type ─────────────────────────────────────────────────────
  readonly activePlanType = computed<IPlanTypeMeta>(() =>
    PLAN_TYPES.find(type => type.key === this.planTypeKey()) ?? PLAN_TYPES[0])

  /**
   * The active plan type's plans, as cards.
   *
   * No filtering by plan type happens here — UserCbpPlansService already split the response
   * into the three lists, so picking one IS the filter. That is also why the old
   * client-side `narrowToPlanType()` is gone: there is nothing left to narrow.
   */
  private readonly typeCards = computed<PlanCardViewModel[]>(() => {
    const data = this.planData()
    if (!data) {
      return []
    }
    const plans: IUserCbpPlan[] = this.plansForKey(data, this.planTypeKey())
    // Same transformer the home strips use, so a plan looks identical in both places.
    return this.cardTransformer.transformCards(plans, CardType.PlanCard) as PlanCardViewModel[]
  })

  /** The list behind one plan-type key; 'all' is the three of them end to end. */
  private plansForKey(data: IUserCbpPlanCacheEntry, key: PlanFilterKey): IUserCbpPlan[] {
    switch (key) {
      case 'apar':
        return data.aparPlanList
      case 'aicbp':
        return data.aiCbpPlanList
      case 'cbp':
        return data.cbpPlanList
      default:
        return [...data.aparPlanList, ...data.aiCbpPlanList, ...data.cbpPlanList]
    }
  }

  /**
   * How many plans each type holds for the loaded year.
   *
   * Counted off the whole year's data, NOT the Created By selection: these numbers say how
   * much is in each bucket, so they must not move when a filter inside a bucket changes —
   * otherwise switching type would land on a count the user never saw.
   */
  private readonly planTypeCounts = computed<Record<PlanFilterKey, number>>(() => {
    const data = this.planData()
    const empty = { all: 0, apar: 0, aicbp: 0, cbp: 0 }
    if (!data) {
      return empty
    }
    return {
      all: data.aparPlanList.length + data.aiCbpPlanList.length + data.cbpPlanList.length,
      apar: data.aparPlanList.length,
      aicbp: data.aiCbpPlanList.length,
      cbp: data.cbpPlanList.length,
    }
  })

  // ── Derived: filter → sort → page ──────────────────────────────────────────

  /**
   * Facet values counted off the loaded plans rather than asked of the server.
   *
   * Counts describe the current plan type's list, so they always match what removing a
   * filter would actually show — which a server facet computed over a wider set does not.
   */
  private readonly createdByValues = computed<{ value: string, count: number }[]>(() => {
    const counts = new Map<string, number>()
    this.typeCards().forEach(card => {
      const name = card.createdByName
      if (name) {
        counts.set(name, (counts.get(name) ?? 0) + 1)
      }
    })
    return Array.from(counts, ([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value))
  })

  private readonly filteredCards = computed<PlanCardViewModel[]>(() => {
    const selected = this.appliedFilters()[CREATED_BY_FACET] ?? []
    if (!selected.length) {
      return this.typeCards()
    }
    return this.typeCards().filter(card => selected.includes(card.createdByName))
  })

  private readonly sortedCards = computed<PlanCardViewModel[]>(() => {
    const sort = SORT_OPTIONS[this.sortIndex()] ?? SORT_OPTIONS[0]
    return [...this.filteredCards()].sort((a, b) => this.compare(a, b, sort.field, sort.direction))
  })

  /** Filtered total, not a server count — so the pager matches the list it pages. */
  readonly totalCount = computed(() => this.sortedCards().length)

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())))

  /**
   * The current page's slice.
   *
   * The page index is clamped rather than trusted: it comes from the URL, and a filter that
   * shrinks the list can leave it past the end — which would render an empty grid on a page
   * that has results.
   */
  readonly cards = computed<PlanCardViewModel[]>(() => {
    const page = Math.min(Math.max(1, this.currentPage()), this.totalPages())
    const start = (page - 1) * this.pageSize()
    return this.sortedCards().slice(start, start + this.pageSize())
  })

  // ── Derived: labels ────────────────────────────────────────────────────────

  /**
   * Reporting years from `instanceConfig.cbpPlanYear` when the instance configures them —
   * it carries its own labels — falling back to the three years derived around today.
   */
  readonly planYearOptions = computed(() => {
    this.langTick()
    const configured = this.userCbpPlansSvc.getPlanYearList()
    if (configured.length) {
      return configured.map(option => ({ value: option.value, label: option.label || option.value }))
    }
    return this.plansSvc.getPlanYearOptions().map(option => ({
      value: option.value,
      label: option.isCurrent
        ? this.translate.instant('plansShowAll.currentReportingYear', { year: option.value })
        : option.value,
    }))
  })

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

  /**
   * The number on the Filter button: how many narrowings are actually in force.
   *
   * Derived from the page's own state rather than from the panel's last payload, which got
   * this wrong twice. `planTypeKey` only reaches `appliedFilters` once the panel has been
   * opened and applied, so a plan type chosen from the URL counted for nothing — and once
   * it was there it counted for one even when set to All, which narrows nothing at all.
   */
  readonly appliedFilterCount = computed(() => {
    const planTypeCount = this.planTypeKey() === 'all' ? 0 : 1
    const createdByCount = (this.appliedFilters()[CREATED_BY_FACET] ?? []).length
    return planTypeCount + createdByCount
  })

  /**
   * What the filter panels are told is selected.
   *
   * The plan type is folded in because the toolbar and the URL can set it without the panel
   * ever being opened — and a panel that is not told about it shows no chip and no Clear
   * All, while the Filter badge next to it reads 1.
   */
  readonly panelSelections = computed<SelectedFilters>(() => ({
    ...this.appliedFilters(),
    planTypeKey: [this.planTypeKey()],
  }))

  readonly skeletonRows = computed(() => Array.from({ length: Math.min(this.pageSize(), 8) }, () => 0))

  /**
   * Panel sections: plan type as a radio list (it is the listing's primary axis and the
   * toolbar drives it too), then Created By built from the loaded plans.
   *
   * The organisation and designation sections the server used to facet are gone: V4 carries
   * no field to build them from, and rendering an empty section is worse than omitting it.
   */
  readonly filterConfig = computed<FilterConfig[]>(() => {
    this.langTick()
    const selected = this.appliedFilters()

    const counts = this.planTypeCounts()
    const planTypeSection: FilterConfig = {
      key: 'planTypeKey',
      heading: this.translate.instant('plansShowAll.planType'),
      selectType: 'radio',
      showSearch: false,
      showSeeMore: false,
      showCount: true,
      order: 1,
      // An empty type is shown greyed rather than dropped: the four buckets exist whether or
      // not this user has plans in them, and a list that changes length as the data changes
      // makes the page harder to learn. The one exception is the type being viewed, which
      // stays selectable so a zero-result listing can still be navigated away from.
      options: PLAN_TYPES.map(type => ({
        name: type.key,
        displayName: this.translate.instant(type.titleKey),
        count: counts[type.key],
        isChecked: type.key === this.planTypeKey(),
        disabled: counts[type.key] === 0 && type.key !== this.planTypeKey(),
      })),
    }

    const createdByValues = this.createdByValues()
    if (!createdByValues.length) {
      return [planTypeSection]
    }

    const createdBySection: FilterConfig = {
      key: CREATED_BY_FACET,
      heading: this.translate.instant('plansShowAll.createdBy'),
      selectType: 'checkbox',
      showSearch: createdByValues.length > 4,
      showSeeMore: createdByValues.length > 4,
      seeMoreLimit: 4,
      showCount: true,
      order: 2,
      options: createdByValues.map(entry => ({
        name: entry.value,
        displayName: entry.value,
        count: entry.count,
        isChecked: (selected[CREATED_BY_FACET] ?? []).includes(entry.value),
      })),
    }

    return [planTypeSection, createdBySection]
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
        const typeParam = params.get('planType') as PlanFilterKey | null
        this.planTypeKey.set(
          PLAN_TYPES.some(type => type.key === typeParam) ? (typeParam as PlanFilterKey) : 'apar')

        const yearParam = params.get('planYear')
        const year = this.planYearOptions().some(option => option.value === yearParam)
          ? (yearParam as string)
          : this.userCbpPlansSvc.getCurrentPlanYear()
        this.planYear.set(year)

        const pageParam = Number(params.get('page'))
        this.currentPage.set(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1)

        const sizeParam = Number(params.get('pageSize'))
        this.pageSize.set(this.pageSizeOptions.includes(sizeParam) ? sizeParam : 12)

        // The year is the only param that changes WHICH plans are loaded; plan type, page
        // and page size are all narrowings of a dataset already in memory.
        if (year !== this.loadedYear()) {
          this.loadPlans(year)
        }
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

  /**
   * The page's only request: one CBPlan V4 call for a year's plans.
   *
   * Cache-first by design — UserCbpPlansService serves a valid IndexedDB entry and only
   * POSTs on a miss or an expired TTL, so flipping between years the user has already
   * visited costs nothing. Pass `callApi` to force the network (the pull-to-refresh case).
   */
  private loadPlans(year: string, callApi = false): void {
    this.loading.set(true)
    this.loadedYear.set(year)

    // `from(...Async())` rather than the service's Observable getter: @sunbird-cb/consumption
    // resolves its own rxjs, and piping that Observable through the portal's operators is a
    // type mismatch between two copies of the same library.
    from(this.userCbpPlansSvc.getUserCbpPlansAsync(callApi, { planYear: year }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: IUserCbpPlanCacheEntry) => {
          this.planData.set(data)
          this.loading.set(false)
        },
        error: () => {
          this.planData.set(null)
          this.loading.set(false)
        },
      })
  }

  /** Forces a fresh V4 call for the year on screen, bypassing the cache. */
  refresh(): void {
    this.loadPlans(this.planYear(), true)
  }

  /**
   * Orders two cards on one field, direction included.
   *
   * The direction is applied here rather than by the caller because of the missing-date
   * rule: a plan with no usable `endDate` has nothing to order by, so it belongs at the END
   * of the list in both directions. Multiplying a "missing sorts last" result by -1 would
   * float those plans to the top of the descending sort instead.
   */
  private compare(
    a: PlanCardViewModel,
    b: PlanCardViewModel,
    field: 'endDate' | 'title',
    direction: number,
  ): number {
    if (field === 'endDate') {
      const timeA = new Date(a.endDate).getTime()
      const timeB = new Date(b.endDate).getTime()
      const missingA = Number.isNaN(timeA)
      const missingB = Number.isNaN(timeB)
      if (missingA || missingB) {
        return missingA && missingB ? 0 : (missingA ? 1 : -1)
      }
      return direction * (timeA - timeB)
    }
    return direction * (a.title || '').localeCompare(b.title || '')
  }

  // ── Toolbar handlers ───────────────────────────────────────────────────────
  onPlanTypeChange(key: PlanFilterKey): void {
    this.patchQueryParams({ planType: key, page: 1 })
  }

  onPlanYearChange(year: string): void {
    this.patchQueryParams({ planYear: year, page: 1 })
  }

  onSortChange(index: number): void {
    this.sortIndex.set(index)
    this.currentPage.set(1)
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
      data: { filterConfig: this.filterConfig(), selectedFilters: this.panelSelections() },
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
    // keeping it as a filter. The reporting year is not in the panel at all — the toolbar's
    // year control owns it.
    //
    // An absent `planTypeKey` means the user removed that chip, and "no plan-type
    // narrowing" is exactly what All is — so it resolves there rather than silently
    // leaving the previous type in force.
    const nextType = (selected['planTypeKey']?.[0] as PlanFilterKey | undefined) ?? 'all'

    this.appliedFilters.set(selected)
    this.currentPage.set(1)

    if (nextType !== this.planTypeKey()) {
      this.patchQueryParams({ planType: nextType, page: 1 })
    }
  }

  /**
   * Clear All resets the plan type to All as well as dropping the facets.
   *
   * Without that it would not clear: the panel seeds its chips from the config, the config
   * marks whichever plan type is in the URL, and the chip would reappear the moment it was
   * removed — leaving a Clear All button that visibly does nothing.
   */
  onFilterCleared(): void {
    this.appliedFilters.set({})
    this.currentPage.set(1)
    if (this.planTypeKey() !== 'all') {
      this.patchQueryParams({ planType: 'all', page: 1 })
    }
  }

  private patchQueryParams(params: Record<string, string | number>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    })
  }
}
