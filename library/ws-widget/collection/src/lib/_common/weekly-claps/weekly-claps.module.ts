import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WeeklyClapsComponent } from './weekly-claps.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { InfoDialogModule } from './../info-dialog/info-dialog.module'
import { SkeletonLoaderModule } from './../skeleton-loader/skeleton-loader.module'
import { TranslateModule } from '@ngx-translate/core'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [WeeklyClapsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    InfoDialogModule,
    SkeletonLoaderModule,
    TranslateModule,
  ],
  exports: [
    WeeklyClapsComponent,
  ],
  entryComponents: [WeeklyClapsComponent],
})
export class WeeklyClapsModule { }
