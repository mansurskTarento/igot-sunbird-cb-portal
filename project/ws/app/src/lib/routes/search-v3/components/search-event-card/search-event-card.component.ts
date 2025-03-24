import { DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2';

@Component({
  selector: 'ws-app-search-event-card',
  templateUrl: './search-event-card.component.html',
  styleUrls: ['./search-event-card.component.scss'],
  providers: [DatePipe],
})
export class SearchEventCardComponent implements OnInit, OnChanges {
  @Input() content: any;
  @Input() cbpPlans: any[] = [];
  @Output() telemetry = new EventEmitter<any>();
  defaultThumbnail = '/assets/instances/eagle/app_logos/default.png';
  defaultSLogo = '/assets/instances/eagle/app_logos/igot-katmayogi-logo.svg';
  formattedTime: string | null = '';
  contentBookmarked = false;
  isIgot = false;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private langTranslations: MultilingualTranslationsService,
    private datePipe: DatePipe
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en');
      const lang = localStorage.getItem('websiteLanguage')!;
      this.translate.use(lang);
    }
  }

  ngOnInit(): void {
    this.formatStartTime();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cbpPlans'] && changes['cbpPlans'].currentValue) {
      if (this.cbpPlans?.length && this.content) {
        this.isIgot = this.cbpPlans.some(
          (ele: any) => ele.identifier === this.content.identifier
        );
      } else {
        this.isIgot = false;
      }
    }
  }

  translateLabels(label: string, type: any) {
    if (label) {
      return this.langTranslations.translateLabel(label, type, '');
    }
  }

  formatStartTime() {
    if (this.content?.startTime) {
      const timeStr = this.content.startTime;
      const date = new Date();

      if (timeStr.includes('Z')) {
        // UTC format (e.g., "14:00:00Z")
        const time = timeStr.split('Z')[0];
        const [hours, minutes, seconds] = time.split(':').map(Number);
        date.setUTCHours(hours, minutes, seconds, 0);
      } else {
        // Offset format (e.g., "17:30:00+05:30")
        const [time, _offset] = timeStr.split('+');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        date.setHours(hours, minutes, seconds, 0);
      }

      this.formattedTime = this.datePipe.transform(date, 'h:mm a');
    }
  }

  isCurrentlyActive(): boolean {
    if (
      !this.content?.startDate ||
      !this.content?.startTime ||
      !this.content?.endDate ||
      !this.content?.endTime
    ) {
      return false;
    }

    const now = new Date();
    let startDateTime: Date;
    let endDateTime: Date;

    if (this.content.startTime.includes('Z')) {
      // UTC format
      startDateTime = new Date(
        `${this.content.startDate}T${this.content.startTime}`
      );
    } else {
      const [startTimeStr, startOffset] = this.content.startTime.split('+');
      startDateTime = new Date(
        `${this.content.startDate}T${startTimeStr}+${startOffset}`
      );
    }

    if (this.content.endTime.includes('Z')) {
      endDateTime = new Date(`${this.content.endDate}T${this.content.endTime}`);
    } else {
      const [endTimeStr, endOffset] = this.content.endTime.split('+');
      endDateTime = new Date(
        `${this.content.endDate}T${endTimeStr}+${endOffset}`
      );
    }

    return now >= startDateTime && now <= endDateTime;
  }

  navigateToEvent() {
    const eventId = this.content?.identifier;
    if (eventId) {
      this.router.navigate([`/app/event-hub/home/${eventId}`]);
      this.telemetry.emit(this.content)
    }
  }
}
