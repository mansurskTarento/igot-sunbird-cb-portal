import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { SignupService } from './signup.service';
import _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class AppPublicOrganizationResolver implements Resolve<any> {
  constructor(private signupSvc: SignupService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<{ organizationDetails: any; designationsList: any[] }> {
    const orgId = route.paramMap.get('orgId');
    if (!orgId) {
      return of({ organizationDetails: null, designationsList: [] });
    }

    return this.signupSvc.getOrgReadData(orgId).pipe(
      switchMap((organizationDetails: any) => {
        if (!organizationDetails) {
          return of({ organizationDetails: null, designationsList: [] });
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
          catchError(() => of({ organizationDetails: null, designationsList: [] })) 
        );
      }),
      catchError(() => of({ organizationDetails: null, designationsList: [] })) 
    );
  }

  private getTermsByCode(categories: any[], code: string) {
    const selectedCategory = categories.filter((category: any) => category.code === code);
    return _.get(selectedCategory, '[0].terms', []);
  }
}
