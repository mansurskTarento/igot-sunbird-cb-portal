import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AdminRoutingModule } from './admin-routing.module'
import { AdminComponent } from './components/admin/admin.component'
import { ExcelService } from './components/excel.service'

import { UserImageModule } from '@sunbird-cb/collection'
import { FormsModule } from '@angular/forms'
import { PipeNameTransformModule, PipeCountTransformModule } from '@sunbird-cb/utils-v2'
import { ConfigurationsComponent } from './components/configurations/configurations.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [AdminComponent,
    ConfigurationsComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatTabsModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    UserImageModule,
    PipeNameTransformModule,
    FormsModule,
    PipeCountTransformModule,
    MatFormFieldModule,
    MatInputModule, MatSidenavModule, MatMenuModule,
  ],
  providers: [ExcelService],
})
export class AdminModule { }
