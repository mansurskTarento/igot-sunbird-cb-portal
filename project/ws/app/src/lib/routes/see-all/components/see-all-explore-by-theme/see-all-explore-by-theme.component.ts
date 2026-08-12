import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core'
import { FormControl } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { NsContent, ValueService } from '@sunbird-cb/utils-v2'
import { ContentDictionaryService } from '@sunbird-cb/consumption'
import { SeeAllService } from '../../services/see-all.service'
import { Observable, combineLatest, forkJoin, of } from 'rxjs'
import { catchError, debounceTime, finalize, map } from 'rxjs/operators'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Component({
  selector: 'ws-app-see-all-explore-by-theme',
  templateUrl: './see-all-explore-by-theme.component.html',
  styleUrls: ['./see-all-explore-by-theme.component.scss'],
  standalone: false
})
export class SeeAllExploreByThemeComponent implements OnInit {
  private readonly ALL_THEMES_LABEL = 'All Themes'

  private readonly activated = inject(ActivatedRoute)
  private readonly seeAllSvc = inject(SeeAllService)
  private readonly dictionarySvc = inject(ContentDictionaryService)
  private readonly valueSvc = inject(ValueService)
  private readonly destroyRef = inject(DestroyRef)

  keyData = ''
  sectionConfig = signal<any>(null)

  pageTitle = computed(() => this.sectionConfig()?.header || '')

  breadcrumbData = computed<any[]>(() => [
    { url: '/page/home', title: 'Home', icon: 'home' },
    { title: this.pageTitle() },
  ])

  private visiblePills: any[] = []

  themeOptions = signal<{ label: string, pill: any }[]>([])
  themeSelected = signal('')
  themeContentMap = signal<Record<string, NsContent.IContent[]>>({})
  loader = signal(true)
  screenSizeIsLtMedium = signal(false)
  searchControl = new FormControl('')
  private searchTerm = signal('')
  pageSize = signal(10)
  currentPage = signal(1)
  pageSizeOptions = [10, 20, 50, 100]
  totalItemsCount = computed(() => this.visibleContent().length)

  searchPlaceholder = computed(() => `Search ${this.themeSelected() || 'Theme'}` || 'Search')

  visibleContent = computed<NsContent.IContent[]>(() => {
    const selectedTheme = this.themeSelected()
    const contents = selectedTheme === this.ALL_THEMES_LABEL ?
      this.allThemesContent() :
      (this.themeContentMap()[selectedTheme] || []).slice()
    const term = this.searchTerm().trim().toLowerCase()
    return term ?
      contents.filter(content => (content.name || content.title || '').toLowerCase().includes(term)) :
      contents
  })

  allThemesContent = computed<NsContent.IContent[]>(() => {
    const seen = new Set<string>()
    const result: NsContent.IContent[] = []
    Object.values(this.themeContentMap()).forEach(list =>
      list.forEach(content => {
        const key = content.identifier || content.name || ''
        if (key && seen.has(key)) { return }
        if (key) { seen.add(key) }
        result.push(content)
      }),
    )
    return result
  })

  pagedContent = computed(() => {
    const size = this.pageSize()
    const start = (this.currentPage() - 1) * size
    return this.visibleContent().slice(start, start + size)
  })

  selectedPillConfig = computed(() =>
    this.themeOptions().find(option => option.label === this.themeSelected())?.pill?.contentConfig ||
    this.sectionConfig())

  contentDataList = computed(() =>
    this.pagedContent().map((content, idx) => ({
      content,
      config: this.selectedPillConfig(),
      position: idx,
      widgetData: {
        content,
        cardSubType: 'card-portrait',
        context: { pageSection: 'exploreByTheme', position: idx },
      },
    })),
  )

  exploreByThemeNoData = computed(() => !this.loader() && this.visibleContent().length === 0)

  exploreByThemeNoDataMessage = computed(() => {
    const pill = this.themeOptions().find(option => option.label === this.themeSelected())?.pill
    return pill?.contentConfig?.noDataMessage || this.sectionConfig()?.noDataMessage || ''
  })

  ngOnInit() {
    this.valueSvc.isLtMedium$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isLtMedium => this.screenSizeIsLtMedium.set(isLtMedium))

    this.searchControl.valueChanges
      .pipe(debounceTime(100), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => {
        this.searchTerm.set(term || '')
        this.currentPage.set(1)
      })

    let pageSubType = ''
    let pageType = ''
    this.activated.queryParams.subscribe((res: any) => {
      this.keyData = (res.key) ? res.key : ''
      pageSubType = (res.pageSubType) ? res.pageSubType : ''
      pageType = (res.pageType) ? res.pageType : ''
    })

    this.seeAllSvc.getSeeAllFormsConfigJson(pageType || 'page', pageSubType || 'home', 2)
      .then(configData => this.applySection(configData))
      .catch(() => this.loader.set(false))
  }

  applySection(configData: any) {
    const homeSection: any[] = (configData && configData.homeSection) ? configData.homeSection : []
    const section = homeSection.find((homeSec: any) => homeSec.sectionKey === 'exploreByTheme')
    const allThemesOption = { label: this.ALL_THEMES_LABEL, pill: null }
    if (!section) {
      this.themeOptions.set([allThemesOption])
      this.themeSelected.set(this.ALL_THEMES_LABEL)
      this.loader.set(false)
      return
    }

    this.sectionConfig.set(section)

    const visiblePills: any[] = Array.isArray(section.pills) ?
      section.pills.filter((pill: any) => pill.visibilityMode !== 'hidden') : []
    if (!visiblePills.length) {
      this.themeOptions.set([allThemesOption])
      this.themeSelected.set(this.ALL_THEMES_LABEL)
      this.loader.set(false)
      return
    }

    const themeParam = this.activated.snapshot.queryParamMap.get('theme')
    const initialTheme = themeParam || section.defaultPillKey || visiblePills[0].pillLabel || visiblePills[0].pillKey
    this.themeOptions.set([
      allThemesOption,
      ...visiblePills.map((pill: any) => ({ label: pill.pillLabel || pill.pillKey, pill })),
    ])
    this.themeSelected.set(this.themeOptions().some(option => option.label === initialTheme) ?
      initialTheme : this.themeOptions()[0].label)

    this.visiblePills = visiblePills
    this.loadThemeContent(this.themeSelected())
  }

  private loadThemeContent(themeLabel: string) {
    const loadedContent = this.themeContentMap()
    const isAllThemes = themeLabel === this.ALL_THEMES_LABEL
    const pillsToLoad = this.visiblePills.filter((pill: any) => {
      const label = pill.pillLabel || pill.pillKey
      return (isAllThemes || label === themeLabel) && !(label in loadedContent)
    })

    if (!pillsToLoad.length) {
      this.loader.set(false)
      return
    }

    this.loader.set(true)
    this.loadPillsContent(pillsToLoad)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loader.set(false)),
      )
      .subscribe(map => this.themeContentMap.update(current => ({ ...current, ...map })))
  }

  loadPillsContent(pills: any[]): Observable<any> {
    const pillLoads = pills.map((pill: any) => {
      const contentIds: string[] = pill.contentConfig && Array.isArray(pill.contentConfig.contentIds) ?
        pill.contentConfig.contentIds : []
      return forkJoin(
        contentIds.map(id =>
          (this.dictionarySvc.getContent(id) as any).pipe(
            catchError(() => of(null)),
          )),
      ).pipe(
        map((contents: any[]) => ({
          label: pill.pillLabel || pill.pillKey,
          contents: contents.filter((content: any) => content).map((content: any) => this.normalizeContent(content)),
        })),
      )
    })
    return combineLatest(pillLoads).pipe(
      map((results: any[]) => {
        const map: Record<string, NsContent.IContent[]> = {}
        results.forEach((result: any) => { map[result.label] = result.contents })
        return map
      }),
    )
  }

  private normalizeContent(content: any) {
    return {
      ...content,
      title: content.title || content.name || content.metadata?.name,
      metadata: content.metadata || content,
    }
  }

  onThemeChange(themeLabel: string) {
    this.themeSelected.set(themeLabel)
    this.searchControl.setValue('', { emitEvent: false })
    this.searchTerm.set('')
    this.currentPage.set(1)
    this.loadThemeContent(themeLabel)
  }

  onPageChange(event: any) {
    this.currentPage.set(event.currentPage)
    this.pageSize.set(event.limit)
  }

  clearSearchControl() {
    this.searchControl.setValue('')
  }
}
