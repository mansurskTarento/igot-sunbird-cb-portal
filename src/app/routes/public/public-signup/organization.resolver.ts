import { Injectable } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { SignupService } from './signup.service';
import _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppPublicOrganizationResolver
  implements Resolve<Observable<{ organizationDetails: any; designationsList: any[] }>> {
  constructor(
    private signupSvc: SignupService,
    private snackBar: MatSnackBar
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<{ organizationDetails: any; designationsList: any[] }> {
    const orgId = route.paramMap.get('orgId');
    if (!orgId) {
      return of({ organizationDetails: null, designationsList: [] });
    }

    const registrationLink = `https://${environment.sitePath}/crp/${route.params.qrCodeId}/${route.params.orgId}`;

    return this.signupSvc.getRegistrationLinkStatus({ registrationLink }).pipe(
      switchMap((response: any) => {
        if (
          !response ||
          response.responseCode !== 'OK' ||
          response?.params?.errmsg !== 'Registration link is active'
        ) {
          this.snackBar.open(
            'Registration link is invalid or expired. Please reach out to your department MDO or write to us at mission.karmayogi@gov.in with organization and designation name.',
            'X',
            { duration: 20000, panelClass: ['error'] }
          );
          return of({ organizationDetails: null, designationsList: [] });
        }

        return this.signupSvc.getOrgReadData(orgId).pipe(
          switchMap((organizationDetails: any) => {
            if (!organizationDetails) {
              this.snackBar.open(
                'Oops! The registration link seems to be invalid. Please double-check the link or request a new one.',
                'X',
                { duration: 20000, panelClass: ['error'] }
              );
              return of({ organizationDetails: null, designationsList: [] });
            }

            if (!organizationDetails.frameworkid) {
              this.snackBar.open(
                'Designations not available for this organization',
                'X',
                { duration: 20000, panelClass: ['error'] }
              );
              return of({ organizationDetails, designationsList: [] });
            }

            return this.signupSvc.getFrameworkInfo(organizationDetails.frameworkid).pipe(
              map((frameworkResponse: any) => {
                const frameworkDetails = _.get(frameworkResponse, 'result.framework');
                const categoriesOfFramework = _.get(frameworkDetails, 'categories', []);
                const organisationsList = this.getTermsByCode(categoriesOfFramework, 'org');
                const disOrderedList = _.get(organisationsList, '[0].children', []);
                const designationsList = _.sortBy(disOrderedList, 'name');

                return {
                  organizationDetails,
                  designationsList,
                };
              }),
              catchError((error) => {
                this.handleError(error, 'Framework information could not be fetched.');
                return of({ organizationDetails: null, designationsList: [] });
              })
            );
          }),
          catchError((error) => {
            this.handleError(error, 'Organization information could not be fetched.');
            return of({ organizationDetails: null, designationsList: [] });
          })
        );
      }),
      catchError((error) => {
        this.handleError(error, 'Error validating registration link.');
        return of({ organizationDetails: null, designationsList: [] });
      })
    );
  }

  private getTermsByCode(categories: any[], code: string) {
    const selectedCategory = categories.filter(
      (category: any) => category.code === code
    );
    return _.get(selectedCategory, '[0].terms', []);
  }

  private handleError(error: any, message: string) {
    const errorMsg = _.get(error, 'error.params.errmsg', message);
    this.snackBar.open(errorMsg, 'X', { duration: 20000, panelClass: ['error'] });
  }
}
