import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ws-app-show-all',
  templateUrl: './show-all.component.html',
  styleUrls: ['./show-all.component.scss']
})
export class ShowAllComponent implements OnInit {
  courses: any[] = []
  pagedCourses: any[] = []
  pageSize = 8
  initialPaginationSize = 8;
  initialPaginationSizeOptions = [8, 20, 50, 100];
  currentPage = 1
  totalPages = 1
  sortKey = 'name'
  sortOrder: 'asc' | 'desc' = 'asc'
  loading = false
  customOptions: any[] = []
  constructor(private http: HttpClient,
    private translate: TranslateService,) { 
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en');
      const lang = localStorage.getItem('websiteLanguage')!;
      this.translate.use(lang);
    }
    this.customOptions = [
      { name: 'A-Z', value: 'a-z' },
      { name: 'Z-A', value: 'z-a' }
    ]

  }

  ngOnInit() {
    this.fetchCourses()
  }

  fetchCourses() {
    this.loading = true
    this.http.get<any>('/api/course/v1/explore', {}).subscribe(
      res => {
        this.courses = res?.result?.content || []
        this.applySort()
        this.setPage(1)
        this.loading = false
      },
      _err => {
        this.loading = false
      }
    )
  }

  applySort() {
    this.courses.sort((a, b) => {
      let valA = a[this.sortKey]
      let valB = b[this.sortKey]
      
      if (this.sortKey === 'avgRating') {
        valA = Number(valA) || 0
        valB = Number(valB) || 0
      } else if (this.sortKey === 'createdOn') {
        valA = new Date(valA).getTime() || 0
        valB = new Date(valB).getTime() || 0
      } else {
        valA = (valA || '').toString().toLowerCase()
        valB = (valB || '').toString().toLowerCase()
      }
      
      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1
      return 0
    })
    this.setPage(1)
  }

  setSort(key: string) {
    if (this.sortKey === key) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortKey = key
      this.sortOrder = 'asc'
    }
    this.applySort()
  }

  setPage(page: number) {
    this.currentPage = page
    this.totalPages = Math.ceil(this.courses.length / this.pageSize)
    const start = (page - 1) * this.pageSize
    const end = start + this.pageSize
    this.pagedCourses = this.courses.slice(start, end)
  }

  onPageChange(event: any){
    console.log('page changed', event);
    this.currentPage = event.currentPage;
    this.pageSize = event.limit;
    this.initialPaginationSize = this.pageSize;
    this.setPage(this.currentPage);

  }
  onChangeSortSearch(event: any) {
    console.log('sort changed', event);
    if(event === 'most_relevant'){
    } else if(event === 'recently_added_newest'){
    this.sortKey = 'createdOn';
    this.sortOrder = 'desc';
    } else if(event === 'highest_rated'){
    this.sortKey = 'avgRating';
    this.sortOrder = 'desc';
    } else if(event === 'a-z'){
    this.sortKey = 'name';
    this.sortOrder = 'asc';
    } else if(event === 'z-a'){
    this.sortKey = 'name';
    this.sortOrder = 'desc';
    }
    this.applySort();
  }

}
