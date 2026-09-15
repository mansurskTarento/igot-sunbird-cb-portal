import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
// import { ConfigurationsService } from '@sunbird-cb/utils-v2'

const API_END_POINTS = {
  // Plan-level search. The CBPlan V3 "user dictionary" endpoint the home strips use returns
  // CONTENT (one item per content id), so it cannot back a plan listing — see
  // CardTransformerService.processPlanCards.
  SEARCH_PLANS: '/apis/proxies/v8/cbplan/v2/search',
  READ_PLAN: (id: string) => `/apis/proxies/v8/cbplan/v3/read/${id}`,
}

/** Plan types the listing can be scoped to. Matches the mock's "Plan Type" filter. */
export type PlanTypeKey = 'apar' | 'aicbp' | 'cbp'

export interface IPlanSearchRequest {
  filter: Record<string, any>
  pageNumber: number
  pageSize: number
  searchString?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  facets: string[]
}

/** One plan as `/cbplan/v2/read/:id` returns it, before any card mapping. */
export interface IPlanReadResult {
  id: string
  name: string
  planType?: string
  isApar?: boolean
  endDate?: string
  createdAt?: string
  createdByName?: string
  contentType?: string
  status?: string
  /**
   * Courses in the plan, always normalised to this shape by `readPlan()` — the API sends
   * either objects (`{ identifier, mandatory }`) or bare id strings depending on the plan.
   * Metadata comes from the content dictionary; only the ids are carried here.
   */
  contentList: { identifier: string, mandatory?: boolean }[]
  /** Content id of the plan's comprehensive assessment, when it has one. */
  comprehensiveAssessment?: string
  contextData?: Record<string, any>
  [key: string]: any
}

export interface IPlanSearchResult {
  data: any[]
  totalCount: number
  /** Raw facet map as the API sends it: { facetKey: [{ value, count }] }. */
  facets: Record<string, { value: string, count: number }[]>
}

/**
 * Facets the listing asks for — exactly the sections the filter panel renders, nothing more.
 *
 * `createdByName` is part of the set the Training Plans search already relies on; the
 * organisation and designation keys are requested on the assumption the API can facet them,
 * and the panel simply omits any section answered with no values.
 *
 * Plan type and reporting year are deliberately absent: both are chosen from the toolbar and
 * carried in the URL, so faceting them would be asking the server for choices the page
 * already owns.
 */
export const PLAN_FACETS = [
  'createdByName',
  'orgName',
  'orgIdList',
  'designation',
]

@Injectable()
export class PlansService {
  private readonly http = inject(HttpClient)
  // private readonly configSvc = inject(ConfigurationsService)

  /** Financial year runs April -> March, formatted YYYY-YY (e.g. Aug 2026 -> '2026-27'). */
  getCurrentFinancialYear(date: Date = new Date()): string {
    const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
    return `${startYear}-${`0${(startYear + 1) % 100}`.slice(-2)}`
  }

  /**
   * Reporting years offered in the toolbar and the filter panel: next, current, previous —
   * the three the design lists. Derived rather than configured so the list rolls over on
   * 1 April without a release. Labelling is the caller's job, since the "(Current R.Y.)"
   * suffix is translated.
   */
  getPlanYearOptions(): { value: string, isCurrent: boolean }[] {
    const startYear = Number(this.getCurrentFinancialYear().split('-')[0])
    // July keeps the constructed date inside the financial year regardless of timezone.
    return [1, 0, -1].map(offset => ({
      value: this.getCurrentFinancialYear(new Date(startYear + offset, 6, 1)),
      isCurrent: offset === 0,
    }))
  }

  /**
   * One plan by id. Returns the plan itself only — `contentList` carries content ids, whose
   * metadata the caller resolves through the content dictionary (IndexedDB), and
   * `comprehensiveAssessment` is a single content id resolved the same way.
   */
  readPlan(id: string): Observable<IPlanReadResult | null> {
    return this.http.get(API_END_POINTS.READ_PLAN(id)).pipe(
      map((res: any) => {
        const content = res?.result?.content
        if (!content) {
          return null
        }
        return {
          ...content,
          contentList: this.normaliseContentList(content.contentList),
        } as IPlanReadResult
      }),
      catchError(() => of(null)),
    )
  }

  /**
   * `contentList` comes back in two shapes: objects carrying the id plus a `mandatory` flag,
   * and — on plans the newer read returns — bare id strings. Both are flattened to the object
   * form here so every caller reads `item.identifier` and nothing downstream has to branch.
   * Entries without a usable id are dropped rather than becoming `{ identifier: undefined }`,
   * which would otherwise reach the content dictionary as a lookup for "undefined".
   */
  private normaliseContentList(contentList: unknown): { identifier: string, mandatory?: boolean }[] {
    if (!Array.isArray(contentList)) {
      return []
    }

    const normalised: { identifier: string, mandatory?: boolean }[] = []
    contentList.forEach((entry: any) => {
      if (typeof entry === 'string') {
        if (entry.trim()) {
          normalised.push({ identifier: entry.trim() })
        }
        return
      }
      const identifier = entry?.identifier ?? entry?.contentId
      if (typeof identifier === 'string' && identifier.trim()) {
        normalised.push({ identifier: identifier.trim(), mandatory: entry?.mandatory })
      }
    })
    return normalised
  }

  search(request: IPlanSearchRequest): Observable<IPlanSearchResult> {
    const body: IPlanSearchRequest = {
      ...request,
      filter: {
        ...request.filter,
        // Scope to the signed-in user's org, exactly as the Training Plans search does.
        // orgIdList: [this.configSvc.userProfile?.rootOrgId].filter(Boolean),
        status: ['Live'], // Only live plans are relevant to the listing.
      },
    }

    return this.http.post(API_END_POINTS.SEARCH_PLANS, body).pipe(
      map((res: any) => {
        // The endpoint double-nests: { result: { result: { data, totalCount, facets } } }.
        const inner = res?.result?.result ?? res?.result ?? {}
        return {
          data: Array.isArray(inner.data) ? inner.data : [],
          totalCount: Number(inner.totalCount) || 0,
          facets: inner.facets && typeof inner.facets === 'object' ? inner.facets : {},
        }
      }),
      // A listing that renders "no plans" beats one that renders a stack trace.
      catchError(() => of({ data: [], totalCount: 0, facets: {} })),
    )
  }
}
