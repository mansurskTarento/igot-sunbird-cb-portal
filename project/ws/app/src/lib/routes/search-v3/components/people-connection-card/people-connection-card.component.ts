import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NsUser } from '@sunbird-cb/utils-v2';
import { NSNetworkDataV2 } from '../../../network-v2/models/network-v2.model';
import { NetworkV2Service } from '../../../network-v2/services/network-v2.service';
// import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ws-app-people-connection-card',
  templateUrl: './people-connection-card.component.html',
  styleUrls: ['./people-connection-card.component.scss'],
})
export class PeopleConnectionCardComponent {
  @Input() user!: NSNetworkDataV2.INetworkUser;
  @Output() connection = new EventEmitter<string>();
  // @ViewChild('toastSuccess', { static: true }) toastSuccess!: ElementRef<any>;
  // @ViewChild('toastError', { static: true }) toastError!: ElementRef<any>;
  me!: NsUser.IUserProfile;
  howerUser!: any;
  unmappedUser!: any;

  constructor(
    private networkV2Service: NetworkV2Service,
    // private snackBar: MatSnackBar,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private translate: TranslateService // private connectionHoverService: ConnectionHoverService, //  private configSvc: ConfigurationsService,
  ) {
    if (this.activeRoute.parent) {
      this.me = this.activeRoute.parent.snapshot.data.me;
    }
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en');
      const lang = localStorage.getItem('websiteLanguage')!;
      this.translate.use(lang);
    }
  }

  ngOnInit() {
    this.howerUser = this.user;
    this.unmappedUser = this.user;
  }
  getUseravatarName() {
    let name = '';
    if (this.user && !this.user.personalDetails) {
      if (this.user.firstName) {
        if (
          this.user.lastName &&
          this.user.lastName !== null &&
          this.user.lastName !== undefined
        ) {
          name = `${this.user.firstName} ${this.user.lastName}`;
        } else {
          name = `${this.user.firstName}`;
        }
      } else if (this.user.fullName) {
        name = `${this.user.fullName}`;
      } else {
        name = `${this.user.name}`;
      }
    } else if (this.user && this.user.personalDetails) {
      if (this.user.personalDetails.middlename) {
        // tslint:disable-next-line:max-line-length
        if (
          this.user.personalDetails.surname &&
          this.user.personalDetails.surname !== null &&
          this.user.personalDetails.surname !== undefined
        ) {
          // tslint:disable-next-line: max-line-length
          name = `${this.user.personalDetails.firstname} ${this.user.personalDetails.middlename} ${this.user.personalDetails.surname}`;
        } else {
          name = `${this.user.personalDetails.firstname} ${this.user.personalDetails.middlename}`;
        }
      } else if (this.user.personalDetails.firstname) {
        // tslint:disable-next-line:max-line-length
        if (
          this.user.personalDetails.surname &&
          this.user.personalDetails.surname !== null &&
          this.user.personalDetails.surname !== undefined
        ) {
          // tslint:disable-next-line: max-line-length
          name = `${this.user.personalDetails.firstname} ${this.user.personalDetails.surname}`;
        } else {
          name = `${this.user.personalDetails.firstname}`;
        }
      } else if (this.user.personalDetails.firstName) {
        // tslint:disable-next-line:max-line-length
        if (
          this.user.personalDetails.surname &&
          this.user.personalDetails.surname !== null &&
          this.user.personalDetails.surname !== undefined
        ) {
          // tslint:disable-next-line: max-line-length
          name = `${this.user.personalDetails.firstName} ${this.user.personalDetails.surname}`;
        } else {
          name = `${this.user.personalDetails.firstName}`;
        }
      }
    }
    return name;
  }
  connetToUser() {
    const req = {
      connectionId: this.user.id || this.user.identifier || this.user.wid,
      userIdFrom: this.me ? this.me.userId : '',
      userNameFrom: this.me ? this.me.userId : '',
      userDepartmentFrom:
        this.me && this.me.departmentName ? this.me.departmentName : '',
      userIdTo: this.unmappedUser.userId,
      userNameTo: this.user.id || this.user.identifier || this.user.wid,
      userDepartmentTo: this.unmappedUser.employmentDetails.departmentName,
    };
    this.networkV2Service.createConnection(req).subscribe(
      () => {
        // this.openSnackbar(this.toastSuccess.nativeElement.value);
        this.connection.emit('connection-updated');
      },
      () => {
        // this.openSnackbar(this.toastError.nativeElement.value);
      }
    );
  }

  // private openSnackbar(primaryMsg: string, duration: number = 5000) {
  //   this.snackBar.open(primaryMsg, 'X', {
  //     duration,
  //   });
  // }

  goToUserProfile(user: any) {
    this.router.navigate(
      ['/app/person-profile', user.userId || user.id || user.wid],
      { fragment: 'profileInfo' }
    );
  }

  get usr() {
    return this.howerUser;
  }
}
