import { NgModule } from '@angular/core'
import { PeerValidationModule } from '@ws/app'

@NgModule({
  imports: [PeerValidationModule],
  exports: [PeerValidationModule],
})
export class RoutePeerValidationModule { }
