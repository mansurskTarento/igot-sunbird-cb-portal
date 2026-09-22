import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
// import { ConfigurationsService } from '@sunbird-cb/utils-v2'

const API_END_POINTS = {
  READ_PLAN: (id: string) => `/apis/proxies/v8/cbplan/v4/read/${id}`,
}

/** Plan types the listing can be scoped to. Matches the mock's "Plan Type" filter. */
export type PlanTypeKey = 'apar' | 'aicbp' | 'cbp'

/** One plan as `/cbplan/v4/read/:id` returns it, before any card mapping. */
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
   * One plan by id, normalised to the shape the CBPlan user dictionary uses — which is what
   * UserCbpPlansService caches in IndexedDB and what every plan consumer already reads.
   *
   * The two endpoints describe the same plan differently, so a screen that can be fed by
   * either (the detail page resolves from the cache first and falls back here) would otherwise
   * have to branch on which one answered:
   *
   *   read endpoint          dictionary / cache
   *   id                     planId
   *   caLinkedId             comprehensiveAssessment
   *
   * `contentList` carries content ids only; their metadata comes from the content dictionary,
   * and `comprehensiveAssessment` is a single content id resolved the same way.
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
          // Both names kept: `id` because callers and the existing tests read it, `planId`
          // so the object is interchangeable with a cached one.
          planId: content.planId ?? content.id,
          comprehensiveAssessment: content.comprehensiveAssessment ?? content.caLinkedId,
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
}
