import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { NsDiscussionV2 } from '@sunbird-cb/discussion-v2'

@Component({
  selector: 'ws-app-discuss-v2-home',
  templateUrl: './discuss-v2-home.component.html',
  styleUrls: ['./discuss-v2-home.component.scss'],
  standalone: false
})
export class DiscussV2HomeComponent implements AfterViewInit, OnDestroy {
  shortCutData: any[] = [
    {
      name: 'Saved Posts',
      icon: 'bookmark_border',
      link: '/page/learn',
    },
    {
      name: 'Posts By You',
      icon: 'list_alt',
      link: '',
    },
    {
      name: 'Pending Request',
      icon: 'update',
      link: '',
    },
  ]

  feedsWidgetData!: NsDiscussionV2.IDiscussV2WidgetDataV2 | null
  communityWidgetData: any = {}
  private initialTab: string | undefined
  private tabObserver?: MutationObserver

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private elementRef: ElementRef) {
    this.getConfigurationData()
  }

  getConfigurationData() {
    if (this.activatedRoute.snapshot.data.pageData &&
      this.activatedRoute.snapshot.data.pageData.data
    ) {
      this.feedsWidgetData = this.activatedRoute.snapshot.data.pageData.data.feedsWidgetData
      this.communityWidgetData = this.activatedRoute.snapshot.data.pageData.data.communityWidgetData
    }
    this.initialTab = this.activatedRoute.snapshot.data.initialTab
  }

  ngAfterViewInit() {
    if (this.initialTab === 'my_communities') {
      this.selectTabByLabel('my communities')
    }
  }

  ngOnDestroy() {
    this.tabObserver?.disconnect()
  }

  // Landing-page widget's mat-tab-group has no @Input to preselect a tab,
  // so the initial deep-linked tab is activated by clicking its rendered label.
  private selectTabByLabel(label: string) {
    const tryClickTab = () => {
      const tabs = Array.from(this.elementRef.nativeElement.querySelectorAll('.mat-mdc-tab')) as HTMLElement[]
      const target = tabs.find(tab => tab.textContent && tab.textContent.trim().toLowerCase() === label)
      if (target) {
        target.click()
        return true
      }
      return false
    }

    if (tryClickTab()) {
      return
    }

    this.tabObserver = new MutationObserver(() => {
      if (tryClickTab() && this.tabObserver) {
        this.tabObserver.disconnect()
      }
    })
    this.tabObserver.observe(this.elementRef.nativeElement, { childList: true, subtree: true })
  }

  searchTextMethod(searchTxt: any) {

    console.log(event, 'searchTextMethod')
    this.router.navigate(['/app/discussion-forum-v2/search'], {
      queryParams: { c: searchTxt.trim() },
    })
  }
  showAllCommunityByTopic(topic: string) {
    this.router.navigate([`/app/discussion-forum-v2/communities/${topic}`])
  }
  showAllCommunityByTopicCard(topic: any) {
    this.router.navigate([`/app/discussion-forum-v2/communities/${topic.value}`])
  }
  communityCardClick(cardData: any) {

    this.router.navigate(['/app/discussion-forum-v2/community', cardData.communityId])
  }

  showAllTopics(_eventData: any) {
    this.router.navigate(['/app/discussion-forum-v2/topics/all'])

  }
}
