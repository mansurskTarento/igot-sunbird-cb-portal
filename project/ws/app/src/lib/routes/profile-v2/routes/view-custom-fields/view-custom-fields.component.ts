import { Component, Input } from '@angular/core'
import { UserProfileService } from '../../../user-profile/services/user-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
// tslint:disable
import _ from 'lodash'
import { MatDialog } from '@angular/material/dialog'
import { CustomFieldsComponent } from '../custom-fields/custom-fields.component'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { ActivatedRoute } from '@angular/router'
import { ConfigDetails } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-app-view-custom-fields',
  templateUrl: './view-custom-fields.component.html',
  styleUrls: ['./view-custom-fields.component.scss'],
  standalone: false
})
export class ViewCustomFieldsComponent {

  @Input() organisationSpecificDetails: any
  @Input() editConfig: any = null
  @Input() apiConfig: any = null

  editCustomDetails = false
  customAttrList: any = []
  customAttrForm: any = {}
  customFieldValues: any = []
  customAttrListIds: any = []

  userId: string = ''
  orgId: string = ''
  currentUser: any = {}
  isMobile: any

  constructor(
    private userProfileService: UserProfileService,
    private configService: ConfigurationsService,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private route: ActivatedRoute,
    // private commondataSvc: CommonDataService
  ) {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches
      })

    this.route.fragment.subscribe(fragment => {
      if (fragment === 'orgDetails') {
        setTimeout(() => {
          const element = document.getElementById(fragment)
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            })
            setTimeout(() => {
              this.handleEditCustomDetails()
            }, 1000)
          }
        }, 500)
      }
    })
  }

  ngOnInit() {
    this.currentUser = this.configService && this.configService.userProfile
    this.userId = this.currentUser.userId || ''
    this.orgId = this.currentUser.rootOrgId || ''
    // this.orgId = "0140788510336040962"
    this.getOrgDetails()

  }

  getOrgDetails() {
    const request = {
      request: { organisationId: this.orgId },
    }
    const configDetails: ConfigDetails = {
      apiConfig: this.apiConfig,
      urlConfigPath: 'orgV1Read',
      defaultUrl: ''
    }
    this.userProfileService.readOrgData(request, configDetails).subscribe((res: any) => {
      this.customAttrListIds = _.get(res, 'result.response.customfieldsdata.customFieldIds', [])
      if (this.customAttrListIds && this.customAttrListIds.length) {
        this.getCustomAttributes()
      }
    }, error => {
      console.error('Error fetching organization details', error)
    })
  }

  getCustomAttributes(): void {
    const payload = {
      filterCriteriaMap: {
        organisationId: this.orgId,
        // organisationId: "0140788510336040962",
        isEnabled: true,
        customFieldId: this.customAttrListIds,
      },

      pageNumber: 0,
      pageSize: 50,
      orderDirection: 'DESC',
      orderBy: 'updatedOn',
      facets: [],
    }
    const configDetails: ConfigDetails = {
      apiConfig: this.apiConfig,
      urlConfigPath: 'customFieldsV1Search',
      defaultUrl: ''
    }
    this.userProfileService.fetchCustomFields(payload, configDetails).subscribe((res: any) => {
      this.customAttrList = _.get(res, 'result.searchResults.data', [])
      if (this.customAttrList && this.customAttrList.length > 0) {
        this.readCustomattributeDetails()
      }
    }, error => {
      console.log('Error', error)
    })

  }

  readCustomattributeDetails() {
    const configDetails: ConfigDetails = {
      apiConfig: this.apiConfig,
      urlConfigPath: 'profileV1GetAdditionalFields',
      defaultUrl: ''
    }
    this.userProfileService.readCustomattributeDetails(this.userId, this.orgId, configDetails).subscribe((res: any) => {
      this.customFieldValues = _.get(res, 'result.response.customFieldValues', [])
      // this.commondataSvc.fetchMandatoryNotification()
    }, error => {
      console.log('Error', error)
    })
  }

  getValue(attributeName: string) {
    const customField = this.customFieldValues.find((item: any) => item.attributeName === attributeName)
    return customField ? customField.value : ''
  }

  getListItemName(arryListItem: any, listItem: any) {
    const customField = this.customFieldValues.find((_filed: any) => _filed.attributeName === arryListItem.attributeName)
    if (customField && customField.values && customField.values.length) {
      const _item = customField.values.find((_filed: any) => _filed.attributeName.toLocaleLowerCase() === listItem.name.toLocaleLowerCase())
      return _item ? _item.value : arryListItem.isMandatory ? 'Not Applicable' : ''
    }
    return ''
  }

  getName(attributeName: string) {
    return this.customAttrList.find((item: any) => item.attributeName === attributeName)?.name || attributeName
  }

  isFieldEnabled(attributeName: string): boolean {
    if (!this.organisationSpecificDetails || !this.organisationSpecificDetails.fields) {
      return true
    }
    const field = this.organisationSpecificDetails.fields[attributeName]
    return field ? field.enabled : true
  }

  // Update handleEditCustomDetails to build the form and populate values
  handleEditCustomDetails() {
    const dialogRef = this.dialog.open(CustomFieldsComponent, {
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false,
      data: { editConfig: this.editConfig, apiConfig: this.apiConfig },
    })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.getOrgDetails()
      }
    })
  }

}
