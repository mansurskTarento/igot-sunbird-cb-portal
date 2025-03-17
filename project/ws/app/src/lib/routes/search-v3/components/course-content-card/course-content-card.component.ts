import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NsContent } from '@sunbird-cb/collection/src/public-api';
import { environment } from 'src/environments/environment';
import {
  ConfigurationsService,
  EventService,
  WsEvents,
} from '@sunbird-cb/utils-v2';
// import { CertificateDialogComponent } from '@sunbird-cb/consumption';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CertificateDialogComponent } from '@sunbird-cb/collection/src/lib/_common/certificate-dialog/certificate-dialog.component';
import { CertificateService } from '../../../certificate/services/certificate.service';
import { Router } from '@angular/router';
import { WidgetContentLibService } from '@sunbird-cb/consumption';
// import { CertificateDialogComponent } from '@sunbird-cb/consumption/lib/_common/dialog-components/certificate-dialog/certificate-dialog.component';
@Component({
  selector: 'ws-app-course-content-card',
  templateUrl: './course-content-card.component.html',
  styleUrls: ['./course-content-card.component.scss'],
})
export class CourseContentCardComponent implements OnInit, OnChanges {
  @Input() content: any;
  @Input() enrollment: any[] = [];
  @Input() cbpPlans: any[] = [];
  contentBookmarked = false;
  defaultThumbnail = '/assets/instances/eagle/app_logos/default.png';
  defaultSLogo = '/assets/instances/eagle/app_logos/igot-katmayogi-logo.svg';
  compentencyKey!: NsContent.ICompentencyKeys;

  courseEnrollment: any;
  downloadCertificateLoading = false;
  isIgot = false;
  constructor(
    private configSvc: ConfigurationsService,
    private dialog: MatDialog,
    private events: EventService,
    private certificateService: CertificateService,
    private router: Router,
    private contSvc: WidgetContentLibService,

  ) {}

  ngOnInit(): void {
    this.compentencyKey =
      this.configSvc.compentency[environment.compentencyVersionKey];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enrollment'] && changes['enrollment'].currentValue) {
      if (this.enrollment?.length && this.content) {
        this.courseEnrollment =
          this.enrollment.find(
            (ele: any) => ele.courseId === this.content.identifier
          ) || null;
      }
    }
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

  checkForCiosDuration(item: any) {
    if (item && item.contentId && item.contentId.includes('ext_')) {
      return item.duration * 60;
    }
    return item.duration;
  }

  downloadCertificate(certificateData: any) {
    this.events.raiseInteractTelemetry(
      {
        type: WsEvents.EnumInteractTypes.CLICK,
        id: 'view-certificate',
        subType: WsEvents.EnumInteractSubTypes.CERTIFICATE,
      },
      {
        id:
          certificateData.issuedCertificates &&
          certificateData.issuedCertificates.length &&
          certificateData.issuedCertificates[0].identifier, // id of the certificate
        type: WsEvents.EnumInteractSubTypes.CERTIFICATE,
      }
    );
    if (certificateData.issuedCertificates.length > 0) {
      this.downloadCertificateLoading = true;
      const certificate: any = certificateData.issuedCertificates.sort(
        (a: any, b: any) =>
          new Date(a.lastIssuedOn).getTime() -
          new Date(b.lastIssuedOn).getTime()
      );
      let certData: any = certificate && certificate.length && certificate[0];
      this.certificateService
        .downloadCertificate_v2(certData.identifier)
        .subscribe((res: any) => {
          this.downloadCertificateLoading = false;
          const cet = res.result.printUri;
          this.dialog.open(CertificateDialogComponent, {
            width: '1300px',
            data: { cet, certId: certData.identifier },
          });
        });
    } else {
      this.downloadCertificateLoading = false;
    }
  }

  checkIfContentIsNew(createdOn: string): boolean {
    if (!createdOn) return false;
    const createdDate = new Date(createdOn);
    const currentDate = new Date();
    const diffInMs = currentDate.getTime() - createdDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays <= 14;
  }

  async getRedirectUrlData(content: any) {
    if (content && content.objectType === 'Event' && content.identifier) {
      this.router.navigate([`app/event-hub/home/${content.identifier}`]);
    } else {
      const urlData = await this.contSvc.getResourseLink(content);
      this.router.navigate([urlData.url], {
        queryParams: urlData.queryParams,
      });
    }
  }
}
