import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface FilterData {
  eventType: {
    karmayogiTalks: boolean;
    karmayogiSaptah: boolean;
  };
  eventStatus: {
    upcoming: boolean;
    live: boolean;
    past: boolean;
  };
  eventFormat: {
    online: boolean;
  };
  eventDateTime: {
    today: boolean;
    tomorrow: boolean;
    dateRange: {
      from: Date | null;
      to: Date | null;
    };
  };
  eventDuration: {
    lessThanHour: boolean;
    twoToThree: boolean;
    threeToFive: boolean;
  };
  searchTerm: string;
}

@Component({
  selector: 'ws-app-view-all',
  templateUrl: './view-all.component.html',
  styleUrls: ['./view-all.component.scss']
})
export class ViewAllComponent {

  titles: any = []
  @Output() filterChange = new EventEmitter<FilterData>()
  filterForm!: FormGroup
  constructor(private fb: FormBuilder) {
    this.titles = [
      { title: 'Events', url: '/app/event-hub/home', disableTranslate: true, icon: 'event' },
      { title: 'Recommended Events', url: `none`, icon: '' },
    ]
    this.initializeForm();
  }

  ngOnInit() {
    // Subscribe to form changes and emit updated filter data
    this.filterForm.valueChanges.subscribe(formValue => {
      this.filterChange.emit(formValue);
    });
  }

  clearAll() {
    this.filterForm.reset({
      eventType: {
        karmayogiTalks: false,
        karmayogiSaptah: false
      },
      eventStatus: {
        upcoming: false,
        live: false,
        past: false
      },
      eventFormat: {
        online: false
      },
      eventDateTime: {
        today: false,
        tomorrow: false,
        dateRange: {
          from: null,
          to: null
        }
      },
      eventDuration: {
        lessThanHour: false,
        twoToThree: false,
        threeToFive: false
      },
      searchTerm: ''
    });
  }


  private initializeForm() {
    this.filterForm = this.fb.group({
      eventType: this.fb.group({
        karmayogiTalks: [false],
        karmayogiSaptah: [false]
      }),
      eventStatus: this.fb.group({
        upcoming: [false],
        live: [false],
        past: [false]
      }),
      eventFormat: this.fb.group({
        online: [false]
      }),
      eventDateTime: this.fb.group({
        today: [false],
        tomorrow: [false],
        dateRange: this.fb.group({
          from: [null],
          to: [null]
        })
      }),
      eventDuration: this.fb.group({
        lessThanHour: [false],
        twoToThree: [false],
        threeToFive: [false]
      }),
      searchTerm: ['']
    });
  }
}
