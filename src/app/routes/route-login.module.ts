import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { LoginRootComponent } from '../component/login-root/login-root.component'
import { LoginRootDirective } from '../component/login-root/login-root.directive'
import { LoginComponent } from '../component/login/login.component'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatIconModule } from '@angular/material/icon'
import { PageResolve } from '@sunbird-cb/utils-v2'

@NgModule({
  declarations: [LoginRootComponent, LoginRootDirective, LoginComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule.forChild([
      {
        path: '',
        component: LoginRootComponent,
        resolve: {
          pageData: PageResolve,
        },
      },
    ]),
  ],
})
export class RouteLoginModule {}
