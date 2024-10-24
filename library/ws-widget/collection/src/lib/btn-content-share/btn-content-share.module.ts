import { NgModule, ModuleWithProviders } from '@angular/core'
import { CommonModule } from '@angular/common'

import { UserAutocompleteModule } from '../_common/user-autocomplete/user-autocomplete.module'

import { BtnContentShareComponent } from './btn-content-share.component'
import { BtnContentShareDialogComponent } from './btn-content-share-dialog/btn-content-share-dialog.component'
import { BtnLinkedinShareModule } from '../btn-linkedin-share/btn-linkedin-share.module'
import { BtnFacebookShareModule } from '../btn-facebook-share/btn-facebook-share.module'
import { BtnTwitterShareModule } from '../btn-twitter-share/btn-twitter-share.module'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
    declarations: [BtnContentShareComponent, BtnContentShareDialogComponent],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        UserAutocompleteModule,
        BtnLinkedinShareModule,
        BtnFacebookShareModule,
        BtnTwitterShareModule,
    ],
    exports: [BtnContentShareComponent]
})
export class BtnContentShareModule {
  public static forRoot(environment: any): ModuleWithProviders<BtnContentShareModule> {
    return {
      ngModule: BtnContentShareModule,
      providers: [
        {
          provide: 'env', // you can also use InjectionToken
          useValue: environment,
        },
      ],
    }
  }
}
