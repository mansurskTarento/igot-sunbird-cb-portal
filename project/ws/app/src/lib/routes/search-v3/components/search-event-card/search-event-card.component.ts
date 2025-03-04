import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2';

@Component({
  selector: 'ws-app-search-event-card',
  templateUrl: './search-event-card.component.html',
  styleUrls: ['./search-event-card.component.scss'],
  providers: [DatePipe],
})
export class SearchEventCardComponent implements OnInit {
  @Input() content: any;

  defaultThumbnail = '/assets/instances/eagle/app_logos/default.png';
  defaultSLogo = '/assets/instances/eagle/app_logos/igot-katmayogi-logo.svg';
  formattedTime: string | null = '';
  contentBookmarked = false;
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

  getEventDetails(eventID: any) {
    this.router.navigate([`/app/event-hub/home/${eventID}`]);
  }

  translateLabels(label: string, type: any) {
    if (label) {
      return this.langTranslations.translateLabel(label, type, '');
    }
  }

  formatStartTime() {
    if (this.content?.startTime) {
      const dateObj = new Date(`1970-01-01T${this.content.startTime}`);
      const timezoneOffset = this.content.startTime.includes('+')
        ? `UTC${this.content.startTime.split('+')[1]}`
        : 'UTC';

      this.formattedTime = this.datePipe.transform(
        dateObj,
        'hh:mm a',
        timezoneOffset
      );
    }
  }
}
