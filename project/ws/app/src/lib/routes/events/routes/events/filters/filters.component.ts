import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'
import { MomentDateAdapter } from '@angular/material-moment-adapter';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
}

@Component({
  selector: 'ws-app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class FiltersComponent {
  @Input() facetsData: any
  @Input() selectedFilters: any
  contentDataList: any = []

  contnet: any = []
  startDate: any = ''
  endDate: any = ''
  @Output() filterChange = new EventEmitter<any>()

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private snackbar: MatSnackBar, private datePipe: DatePipe,
    private activateRoute: ActivatedRoute, private bottomSheetRef: MatBottomSheetRef<any>
  ) {

  }

  openLink(type: any): void {
    if (type === 'apply') {
      this.bottomSheetRef.dismiss({
        facetData: this.facetsData,
      })
    } else {
      this.bottomSheetRef.dismiss({
        facetData: this.facetsData,
      })
    }
  }

  ngOnInit() {
    this.activateRoute.queryParamMap.subscribe((data: any) => {
      if (data.params.resourceType) {
        this.selectedFilters['resourceType'] = [data.params.resourceType]
      }
    })
    console.log("selectedFilters", this.selectedFilters)
  }

  returnZero() {
    return 0
  }

  canCheck(key: any, keyData: any) {
    if (this.selectedFilters[key]) {
      return this.selectedFilters[key].includes(keyData.name)
    }
  }

  onDateChange(event: any, eType: any, facet: any) {
    console.log(facet, eType, event)
    if (eType.key === 'fromDate') {
      this.startDate = this.datePipe.transform(event.value, 'yyyy-MM-dd')
    }
    if (eType.key === 'toDate') {
      this.endDate = this.datePipe.transform(event.value, 'yyyy-MM-dd')
    }
    if (this.startDate && this.endDate) {
      const date1 = new Date(this.startDate)
      const date2 = new Date(this.endDate)
      if (date1 > date2) {
        this.snackbar.open('Start date should not greater than end date.')
      } else {
        delete this.selectedFilters.eventDate
        delete this.selectedFilters.eventStatus
        this.selectedFilters[facet.key] = { fromDate: date1, toDate: date2 }
        this.filterChange.emit(this.selectedFilters)
      }
      console.log(this.selectedFilters)

    } else {
      if (!this.startDate) {
        this.snackbar.open('Choose a valid start date.')
      }
      if (!this.endDate) {
        this.snackbar.open('Choose a valid end date.')
      }
    }
  }

  changeSelection(event: any, key: any, keyData: any, allKeyData: any) {
    console.log('changeSelection', event, key, keyData, allKeyData)
    if (event) {
      if (['resourceType', 'eventDate', 'eventStatus'].includes(key)) {
        if (this.selectedFilters[key]) {
          let slected = this.selectedFilters[key]
          slected.push(keyData.name)
          this.selectedFilters[key] = slected
        } else {
          this.selectedFilters[key] = [keyData.name]
        }
        if (key === 'eventDate') {
          delete this.selectedFilters.eventStatus
          delete this.selectedFilters.dateRange
          this.startDate = ''
          this.endDate = ''
        }
        if (key === 'eventStatus') {
          delete this.selectedFilters.dateRange
          delete this.selectedFilters.eventDate
          this.startDate = ''
          this.endDate = ''
        }
        delete this.selectedFilters.key
      }
    } else {
      if (['resourceType', 'eventDate', 'eventStatus'].includes(key)) {
        let filtered = this.selectedFilters[key].filter((item: any) => item !== keyData.name)
        if (filtered.length === 0) {
          delete this.selectedFilters[key]
        } else {
          this.selectedFilters[key] = filtered
        }
      }
    }
    this.filterChange.emit(this.selectedFilters)
    console.log('selectedFilters', this.selectedFilters)
  }

  clearAll() {
    this.selectedFilters = {}
    this.startDate = ''
    this.endDate = ''
    this.filterChange.emit(this.selectedFilters)
  }

}
