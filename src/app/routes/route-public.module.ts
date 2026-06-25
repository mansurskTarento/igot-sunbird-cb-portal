import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { MatCardModule } from '@angular/material/card'
import { BtnPageBackModule } from '@sunbird-cb/collection'

// Modules for components that have their own modules
import { PublicAboutModule } from './public/public-about/public-about.module'
import { PublicContactModule } from './public/public-contact/public-contact.module'
import { PublicLogoutModule } from './public/public-logout/public-logout.module'
import { PublicRequestModule } from './public/public-request/public-request.module'
import { PublicWelcomeModule } from './public/welcome/public-welcome.module'
import { PublicTocModule } from './public/public-toc/public-toc.module'

import { MobileAppModule } from './public/mobile-app/mobile-app.module'

// Components without their own modules (moved from AppModule declarations)
import { PublicContacthomeComponent } from './public/public-contacthome/public-contacthome.component'
import { PublicLoginWComponent } from './public/public-login-w/public-login-w.component'
import { PublicLoginWGComponent } from './public/public-login-wg/public-login-wg.component'
import { PrivacyPolicyComponent } from '../component/privacy-policy/privacy-policy.component'

// Component references for routes
import { PublicAboutComponent } from './public/public-about/public-about.component'
import { PublicContactComponent } from './public/public-contact/public-contact.component'
import { PublicLogoutComponent } from './public/public-logout/public-logout.component'
import { PublicRequestComponent } from './public/public-request/public-request.component'
import { PublicWelcomeComponent } from './public/welcome/public-welcome.component'
import { PublicTocComponent } from './public/public-toc/public-toc.component'

import { MobileAppHomeComponent } from './public/mobile-app/components/mobile-app-home.component'

// Resolvers
import { PageResolve } from '@sunbird-cb/utils-v2'
import { AppTocResolverService } from '@sunbird-cb/toc'
import { WelcomeUserResolverService } from '../services/welcome-user-resolver.service'
import { AppPublicGroupResolverService } from './public/public-signup/group-resolver.service'

const routes: Routes = [
  {
    path: 'about',
    component: PublicAboutComponent,
    data: {
      pageType: 'feature',
      pageKey: 'about',
      module: 'support',
      pageId: 'public/about',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'contact',
    component: PublicContacthomeComponent,
    data: {
      pageType: 'feature',
      pageKey: 'public-contact',
      module: 'support',
      pageId: 'public/contact',
    },
  },
  {
    path: 'faq',
    component: PublicContactComponent,
    data: {
      pageType: 'feature',
      pageKey: 'public-faq',
      module: 'support',
      pageId: 'public/faq',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'logout',
    component: PublicLogoutComponent,
  },
  {
    path: 'toc/:id/overview',
    component: PublicTocComponent,
    data: {
      pageType: 'feature',
      pageKey: 'toc',
      pageId: 'public/toc/:id',
      module: 'Learn',
    },
    resolve: {
      pageData: PageResolve,
      content: AppTocResolverService,
    },
  },
  {
    path: 'sso',
    component: PublicLoginWComponent,
    data: {
      module: 'sso',
      pageId: 'public/sso',
    },
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
    data: {
      module: 'privacy-policy',
      pageId: 'public/privacy-policy',
    },
  },
  {
    path: 'google/sso',
    component: PublicLoginWGComponent,
    data: {
      module: 'Google SSO',
      pageId: 'public/google/sso',
    },
  },
  {
    path: 'welcome',
    component: PublicWelcomeComponent,
    data: {
      module: 'Welcome',
      pageId: 'public/welcome',
    },
    resolve: {
      userData: WelcomeUserResolverService,
      group: AppPublicGroupResolverService,
    },
  },
  {
    path: 'request',
    component: PublicRequestComponent,
    data: {
      module: 'Login',
      pageId: 'public/request',
    },
  },
  {
    path: 'mobile-app',
    component: MobileAppHomeComponent,
    data: {
      pageType: 'feature',
      pageKey: 'mobile-app',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
]

@NgModule({
  declarations: [
    PublicContacthomeComponent,
    PublicLoginWComponent,
    PublicLoginWGComponent,
    PrivacyPolicyComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatCardModule,
    BtnPageBackModule,
    PublicAboutModule,
    PublicContactModule,
    PublicLogoutModule,
    PublicRequestModule,
    PublicWelcomeModule,
    PublicTocModule,
    MobileAppModule,
    RouterModule.forChild(routes),
  ],
})
export class RoutePublicModule { }
