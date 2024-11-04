import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GridLayoutComponent } from './grid-layout.component'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { FormsModule } from '@angular/forms'
import { NPSGridService } from './nps-grid.service'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBarModule } from '@angular/material/snack-bar'

@NgModule({
  declarations: [GridLayoutComponent],
  imports: [CommonModule, WidgetResolverModule, MatFormFieldModule,
    MatButtonModule, MatIconModule, FormsModule, TranslateModule, MatSnackBarModule],
  exports: [GridLayoutComponent],
  entryComponents: [GridLayoutComponent],
  providers: [
    NPSGridService,
  ],
})
export class GridLayoutModule { }
