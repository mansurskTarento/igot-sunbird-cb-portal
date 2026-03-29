import { Component, OnInit } from '@angular/core'



import {
  RoleTab,
  ContentTab,
  VideoTutorial,
  HowToGuide,
  FaqItem,
  Category,
  VIDEO_CATEGORIES_MAP,
  GUIDE_CATEGORIES_MAP,
  FAQ_CATEGORIES_MAP,
  // VIDEO_TUTORIALS,
  // HOW_TO_GUIDES,
  // FAQ_ITEMS,
  HOW_TO_GUIDES_MAP, VIDEO_TUTORIALS_MAP, FAQ_ITEMS_MAP,
} from './help-center.model'



@Component({
  selector: 'app-help-center',
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.scss'],
  standalone: false
})
export class HelpCenterComponent implements OnInit {


  gridSearch = '';


  searchQuery = '';

  activeRoleTab: RoleTab = 'learner';
  activeContentTab: ContentTab = 'all';

  // Section expand/collapse state
  videoSectionOpen = true;
  guidesSectionOpen = true;
  faqSectionOpen = true;

  // Active category filters
  activeVideoCategory = 'all';
  activeGuideCategory = 'all';
  activeFaqCategory = 'all';

  // Data
  // videoCategories: Category[] = VIDEO_CATEGORIES;
  // guideCategories: Category[] = GUIDE_CATEGORIES;
  // faqCategories: Category[] = FAQ_CATEGORIES;

  // allVideos: VideoTutorial[] = VIDEO_TUTORIALS;
  // allGuides: HowToGuide[] = HOW_TO_GUIDES;
  // allFaqs: FaqItem[] = FAQ_ITEMS;

  roleTabs = [
    { id: 'learner' as RoleTab, label: 'Learner', icon: 'school' },
    { id: 'mdo-leader' as RoleTab, label: 'MDO Leader/Admin', icon: 'badge' },
    { id: 'content-building' as RoleTab, label: 'Content Partners', icon: 'computer' },
  ];

  contentTabs = [
    { id: 'all' as ContentTab, label: 'All Content', icon: 'grid_view' },
    { id: 'videos' as ContentTab, label: 'Video Tutorials', icon: 'play_circle_filled' },
    // { id: 'guides' as ContentTab, label: 'How-to Guides', icon: 'menu_book' },
    { id: 'faqs' as ContentTab, label: 'FAQs', icon: 'help_outline' },
  ];


  ngOnInit() {

  }

  get filteredVideos(): VideoTutorial[] {
    let videos =
      this.activeVideoCategory === 'all'
        ? this.allVideos
        : this.allVideos.filter((v) => v.category === this.activeVideoCategory)

    if (!this.searchQuery.trim()) return videos

    const q = this.searchQuery.toLowerCase()

    return videos.filter((v) =>
      v.title.toLowerCase().includes(q)
    )
  }

  get filteredGuides(): HowToGuide[] {
    let guides =
      this.activeGuideCategory === 'all'
        ? this.allGuides
        : this.allGuides.filter((g) => g.category === this.activeGuideCategory)

    if (!this.searchQuery.trim()) return guides

    const q = this.searchQuery.toLowerCase()

    return guides.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (g.titleHindi && g.titleHindi.toLowerCase().includes(q))
    )
  }

  get filteredFaqs(): FaqItem[] {
    const byCategory =
      this.activeFaqCategory === 'all'
        ? this.allFaqs
        : this.allFaqs.filter((f) => f.category === this.activeFaqCategory)
    if (!this.searchQuery.trim()) return byCategory
    const q = this.searchQuery.toLowerCase()
    return byCategory.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    )
  }

  get showVideos(): boolean {
    const hasData = this.filteredVideos.length > 0

    if (this.searchQuery.trim()) {
      return hasData // 👈 only show if results exist
    }

    return this.activeContentTab === 'all' || this.activeContentTab === 'videos'
  }

  get showGuides(): boolean {
    const hasData = this.filteredGuides.length > 0

    if (this.searchQuery.trim()) {
      return hasData
    }

    return this.activeContentTab === 'all' || this.activeContentTab === 'guides'
  }

  get showFaqs(): boolean {
    const hasData = this.filteredFaqs.length > 0

    if (this.searchQuery.trim()) {
      return hasData
    }

    return this.activeContentTab === 'all' || this.activeContentTab === 'faqs'
  }

  setRoleTab(tab: RoleTab): void {
    this.activeRoleTab = tab

    this.activeContentTab = 'all'

    this.activeVideoCategory = 'all'
    this.activeGuideCategory = 'all'
    this.activeFaqCategory = 'all'

    this.videoSectionOpen = true
    this.guidesSectionOpen = true
    this.faqSectionOpen = true

    // 🔥 Force refresh (optional but safe)
    this.searchQuery = ''
  }

  setContentTab(tab: ContentTab): void {
    this.activeContentTab = tab

    if (tab === 'videos') {
      this.videoSectionOpen = true
      this.guidesSectionOpen = true
      this.faqSectionOpen = true
    } else if (tab === 'guides') {
      this.videoSectionOpen = true
      this.guidesSectionOpen = true
      this.faqSectionOpen = true
    } else if (tab === 'faqs') {
      this.videoSectionOpen = true
      this.guidesSectionOpen = true
      this.faqSectionOpen = true
    }
  }

  toggleSection(section: 'video' | 'guides' | 'faq'): void {
    if (section === 'video') this.videoSectionOpen = !this.videoSectionOpen
    if (section === 'guides') this.guidesSectionOpen = !this.guidesSectionOpen
    if (section === 'faq') this.faqSectionOpen = !this.faqSectionOpen
  }

  toggleFaq(faq: FaqItem): void {
    faq.isOpen = !faq.isOpen
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value
  }

  getVideoCount(catId: string): number {
    let list =
      catId === 'all'
        ? this.allVideos
        : this.allVideos.filter(v => v.category === catId)

    if (!this.searchQuery.trim()) return list.length

    const q = this.searchQuery.toLowerCase()

    return list.filter(v => v.title.toLowerCase().includes(q)).length
  }

  getGuideCount(catId: string): number {
    let list =
      catId === 'all'
        ? this.allGuides
        : this.allGuides.filter(g => g.category === catId)

    if (!this.searchQuery.trim()) return list.length

    const q = this.searchQuery.toLowerCase()

    return list.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      (g.titleHindi && g.titleHindi.toLowerCase().includes(q))
    ).length
  }

  getFaqCount(catId: string): number {
    let list =
      catId === 'all'
        ? this.allFaqs
        : this.allFaqs.filter(f => f.category === catId)

    if (!this.searchQuery.trim()) return list.length

    const q = this.searchQuery.toLowerCase()

    return list.filter(f =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q)
    ).length
  }

  get allGuides(): HowToGuide[] {
    return HOW_TO_GUIDES_MAP[this.activeRoleTab] || []
  }

  get allVideos(): VideoTutorial[] {
    return VIDEO_TUTORIALS_MAP[this.activeRoleTab] || []
  }

  get allFaqs(): FaqItem[] {
    return FAQ_ITEMS_MAP[this.activeRoleTab] || []
  }

  openVideo(video: VideoTutorial): void {
    if (video.youtubeUrl) {
      window.open(video.youtubeUrl, '_blank')
    }
  }

  openPDF(pdf: any): void {
    if (pdf) {
      window.open(pdf.pdfUrl, '_blank')
    }
  }

  getYoutubeThumbnail(url: string): string {
    if (!url) return ''

    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
    )

    const videoId = match ? match[1] : null

    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : ''
  }

  get videoCategories(): Category[] {
    return VIDEO_CATEGORIES_MAP[this.activeRoleTab] || []
  }

  get guideCategories(): Category[] {
    return GUIDE_CATEGORIES_MAP[this.activeRoleTab] || []
  }

  get faqCategories(): Category[] {
    return FAQ_CATEGORIES_MAP[this.activeRoleTab] || []
  }


  get hasAnySearchResult(): boolean {
    if (!this.searchQuery.trim()) return true

    return (
      this.filteredVideos.length > 0 ||
      this.filteredGuides.length > 0 ||
      this.filteredFaqs.length > 0
    )
  }

  clearSearch(): void {
    this.searchQuery = ''
  }



}
