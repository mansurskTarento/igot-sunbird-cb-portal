import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { OrganizationModule } from '@ws/app'

@NgModule({
  imports: [CommonModule, OrganizationModule],
  exports: [OrganizationModule],
})
export class RouteOrganizationModule {

}
