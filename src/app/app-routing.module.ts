import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ErrorResolverComponent } from '@sunbird-cb/collection'
import { PageResolve } from '@sunbird-cb/utils-v2'
import { LearningGuard } from '@ws/app'
import { ETopBar } from './constants/topBar.constants'
// import { EmptyRouteGuard } from './guards/empty-route.guard'
import { ExternalUrlResolverService } from './guards/external-url-resolver.service'
import { BharatKalpGuard } from './guards/bharat-kalp.guard'
import { GeneralGuard } from './guards/general.guard'
import { LoginGuard } from './guards/login.guard'
import { RedirectGuard } from './guards/redirect.guard'
import { TncAppResolverService } from './services/tnc-app-resolver.service'
import { TncPublicResolverService } from './services/tnc-public-resolver.service'
import { environment } from 'src/environments/environment'
import { AppHierarchyResolverService } from './services/app-hierarchy-resolver.service'
import { AppEnrollmentResolverService } from './services/app-enrollment-resolver.service'
import { AppContentResolverService } from './services/app-content-read-resolver.service'
import { AppGyaanKarmayogiService } from './services/app-gyaan-karmayogi.service'
import { AppEventPageResolverService } from './services/app-event-page-resolver.service'
import { HomeResolverService } from './home/home/home-resolver.service'
import { FormDataResolverService } from './services/form-data-resolver.service'
import { FormConfigResolverService } from './services/form-config-resolver.service'
import { AppPreAssessmentContentResolverService } from './services/app-pre-assessment-content-read-resolver.service'
// 💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥
// Please declare routes in alphabetical order
// 😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵😵

const routes: Routes = [
  {
    path: '',
    canActivate: [RedirectGuard],
    component: RedirectGuard,
    data: {
      dynamicRedirect: true,
      fallbackPath: 'page/home',
      pageType: 'feature',
      pageKey: 'home',
      pageId: 'page/home',
      module: 'home',
    },
  },
  // {
  //   path: 'practice/behavioral',
  //   pathMatch: 'full',
  //   redirectTo: 'page/embed-behavioural-skills',
  //   canActivate: [GeneralGuard],
  //   data: {
  //   },
  // },
  {
    path: 'static-home',
    canActivate: [RedirectGuard],
    component: RedirectGuard,
    data: {
      externalUrl: environment.staticHomePageUrl,
    },
  },
  {
    path: 'app/activities',
    loadChildren: () => import('./routes/route-activities.module').then(u => u.RouteActivitiesModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/activities',
      module: 'Profile',
    },
  },
  {
    path: 'app/peer-validation',
    loadChildren: () => import('./routes/route-peer-validation.module').then(u => u.RoutePeerValidationModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/peer-validation',
      module: 'Peer Validation',
    },
  },
  {
    path: 'app/frac',
    loadChildren: () => import('./routes/route-frac.module').then(u => u.RouteFracModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/frac',
      module: 'Frac',
    },
  },
  // {
  //   path: 'admin',
  //   data: {
  //     requiredRoles: ['register-admin', 'admin', 'content-assignment-admin'],
  //   },
  //   loadChildren: () => import('./routes/route-admin.module').then(u => u.RouteAdminModule),
  //   canActivate: [GeneralGuard],
  // },
  // {
  //   path: 'app/careers',
  //   loadChildren: () =>
  //     import('./routes/route-careers.module').then(u => u.RouteCareerHubModule),
  //   canActivate: [GeneralGuard],
  //   data: {
  //     pageType: 'feature',
  //     pageKey: 'career',
  //     pageId: 'app/careers',
  //     module: 'Careers',
  //   },
  //   resolve: {
  //     pageData: PageResolve,
  //   },
  // },
  // {
  //   path: 'app/channels',
  //   loadChildren: () => import('./routes/route-channels.module').then(u => u.RouteChannelsModule),
  //   canActivate: [GeneralGuard],
  // },
  // {
  //   path: 'app/competencies',
  //   loadChildren: () =>
  //     import('./routes/route-competencie.module').then(u => u.RouteCompetenciesModule),
  //   canActivate: [GeneralGuard],
  //   data: {
  //     pageType: 'feature',
  //     pageKey: 'competencie',
  //     pageId: 'app/competencies',
  //     module: 'Competency',
  //   },
  //   resolve: {
  //     pageData: PageResolve,
  //   },
  // },
  {
    path: 'app/content-assignment',
    loadChildren: () =>
      import('./routes/route-content-assignment.module').then(u => u.RouteContentAssignmentModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/content-assignment',
      module: 'Learn',
    },
  },
  // {
  //   path: 'app',
  //   loadChildren: () =>
  //     import('./routes/route-discuss.module').then(u => u.RouteDiscussModule),
  //   canActivate: [GeneralGuard],
  //   data: {
  //     pageType: 'feature',
  //     pageKey: 'discuss',
  //     pageId: 'app',
  //     module: 'Discuss',
  //   },
  //   resolve: {
  //     pageData: PageResolve,
  //   },
  // },
  {
    path: 'app/knowledge-resource',
    loadChildren: () =>
      import('./routes/route-knowledge-resource.module').then(u => u.RouteKnowledgeResourceModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'knowledge-resource',
      pageId: 'app/knowledge-resource',
      module: 'Knowledge Resources',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/amrit-gyaan-kosh',
    loadChildren: () =>
      import('./routes/route-gyaan-karmayogi.module').then(u => u.RouteGyaanKarmayogiModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'amrit-gyaan-kosh',
      pageId: 'app/amrit-gyaan-kosh',
    },
    resolve: {
      pageData: FormDataResolverService,
      gyaanData: AppGyaanKarmayogiService,
    },
  },
  {
    path: 'app/jan-karmayogi',
    loadChildren: () =>
      import('./routes/route-jan-karmayogi.module').then(u => u.RouteJanKarmayogiModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'jan-karmayogi',
      pageId: 'app/jan-karmayogi',
      module: 'Knowledge Resources',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/organisation',
    loadChildren: () =>
      import('./routes/route-organization.module').then(u => u.RouteOrganizationModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'organization',
      module: 'Organization',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/taxonomy',
    loadChildren: () =>
      import('./routes/route-taxonomy.module').then(u => u.RouteTaxonomyModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'taxonomy',
      pageId: 'app/taxonomy',
      module: 'explore',
    },
    resolve: {
      pageData: PageResolve,
    },
    // path: 'certs',
    // loadChildren: () => import('./routes/route-cert.module').then(u => u.RouteCertificateModule),
  },
  {
    path: 'app/curatedCollections',
    loadChildren: () =>
      import('./routes/route-curated-course.module').then(u => u.RouteCuratedCourseModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/curatedCollections',
      module: 'Learn',
    },
    resolve: {
      // pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/browse-by/competency-o',
    loadChildren: () =>
      import('./routes/route-browse-competency.module').then(u => u.RouteBrowseCompetencyModule),
    canActivate: [GeneralGuard],
    data: {
      // pageType: 'feature',
      // pageKey: 'browse by competency',
      pageId: 'app/learn/browse-by/competency',
      module: 'Competency',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/browse-by/competency',
    loadChildren: () =>
      import('./routes/route-browse-competency-v2.module').then(u => u.RouteBrowseCompetencyModuleV2),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/learn/browse-by/competency',
      module: 'Competency',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/browse-by/provider',
    loadChildren: () =>
      import('./routes/route-browse-provider.module').then(u => u.RouteBrowseProviderModule),
    canActivate: [GeneralGuard],
    data: {
      // pageType: 'feature',
      // pageKey: 'browse by competency',
      pageId: 'app/learn/browse-by/provider',
      module: 'explore',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/nlw',
    loadChildren: () =>
      import('./routes/route-national-learning-week.module').then(u => u.RouteNationalLearningWeekModule),
    canActivate: [GeneralGuard],
    data: {
      module: 'National Learning Week',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/bharat-kalp',
    loadChildren: () =>
      import('./routes/route-kalp.module').then(u => u.RouteKalpModule),
    canActivate: [GeneralGuard, BharatKalpGuard],
    data: {
      module: 'Bharat Kalp',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/mdo-channels',
    loadChildren: () =>
      import('./routes/route-mdo-channels.module').then(u => u.RouteMdoChannelsModule),
    canActivate: [GeneralGuard],
    data: {
      // pageType: 'feature',
      // pageKey: 'browse by competency',
      pageId: 'app/learn/mdo-channels',
      module: 'explore',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/karma-programs',
    loadChildren: () =>
      import('./routes/route-karma-programs.module').then(u => u.RouteKarmaProgramsModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/learn/karma-programs',
      module: 'explore',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/learn/mandatory-course',
    loadChildren: () =>
      import('./routes/route-mandatory-course.module').then(u => u.RouteMandatoryCourseModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'mandatory-course',
      pageId: 'app/learn/mandatory-course',
      module: 'learn',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  // {
  //   path: 'app/discussion-forum',
  //   pathMatch: 'full',
  //   redirectTo: 'app/discussion',
  //   data: {
  //     pageId: '',
  //     module: 'Discuss',
  //   },

  // },
  {
    path: 'app/discussion-forum-v2',
    loadChildren: () => import('./routes/route-app-discussion-v2.module').then(u => u.RouteAppDiscussionV2Module),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'pp/discussion-forum-v2',
      module: 'Discuss',
      pageKey: 'discussion-v2',
      pageType: 'feature',
    },
    resolve: {
      pageData: FormDataResolverService,
    },
  },
  {
    path: 'certs',
    data: {
      pageId: 'certs',
      module: 'Profile',
    },
    loadChildren: () => import('./routes/route-cert.module').then(u => u.RouteCertificateModule),
  },
  {
    path: 'achievements',
    data: {
      pageId: 'certs',
      module: 'Profile',
    },
    loadChildren: () => import('./routes/route-cert.module').then(u => u.RouteCertificateModule),
  },
  {
    path: 'achievements/v2',
    data: {
      pageId: 'certs',
      module: 'Profile',
    },
    loadChildren: () => import('./routes/route-cert-v2.module').then(u => u.RouteCertificateV2Module),
  },
  {
    path: 'public/certs',
    redirectTo: 'certs',
    // pathMatch: 'full',
  },
  {
    path: 'certs/v2',
    data: {
      pageId: 'certs',
      module: 'Profile',
    },
    loadChildren: () => import('./routes/route-cert-v2.module').then(u => u.RouteCertificateV2Module),
  },

  // {
  //   path: 'app/gamification',
  //   loadChildren: () =>
  //     import('./routes/route-gamification.module').then(u => u.RouteGamificationModule),
  //   canActivate: [GeneralGuard],
  //   data: {
  //   },
  // },
  // {
  //   path: 'app/setup',
  //   loadChildren: () => import('./routes/route-app-setup.module').then(u => u.RouteAppSetupModule),
  //   data: {
  //   },
  // },
  {
    path: 'app/setup',
    loadChildren: () =>
      import('./routes/route-profile-v3.module').then(u => u.RouteProfileV3Module),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'profile-v3',
      pageId: 'app/profile-v3',
      module: 'Profile',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'app/feedback',
    loadChildren: () =>
      import('./routes/route-feedback-v2.module').then(u => u.RouteFeedbackV2Module),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/feedback',
      module: 'Settings',
    },
  },
  {
    path: 'app/features',
    loadChildren: () => import('./routes/features/features.module').then(m => m.FeaturesModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/features',
      module: 'Settings',
    },
  },
  {
    path: 'app/microsites',
    loadChildren: () => import('./routes/microsites/microsites.module').then(m => m.MicrositesModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/features',
      module: 'Settings',
    },
  },

  {
    path: 'app/goals',
    loadChildren: () => import('./routes/route-goals-app.module').then(u => u.RouteGoalsAppModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/Goals',
      module: 'Profile',
    },
  },
  {
    path: 'app/info',
    loadChildren: () => import('./routes/route-info-app.module').then(u => u.RouteInfoAppModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/info',
      module: 'Settings',
    },
  },
  {
    path: 'app/invalid-user',
    loadChildren: () => import('./routes/route-invalid-user.module').then(m => m.RouteInvalidUserModule),
    data: {
      pageType: 'feature',
      pageKey: 'invalid-user',
      pageId: 'app/invalid-user',
      module: 'Error',
    },
  },
  {
    path: 'page',
    loadChildren: () => import('./routes/route-page.module').then(m => m.RoutePageModule),
  },
  {
    path: 'app/my-learning',
    loadChildren: () =>
      import('./routes/route-my-learning.module').then(u => u.RouteMyLearningModule),
    canActivate: [GeneralGuard, LearningGuard],
    data: {
      pageId: 'app/my-learning',
      module: 'Profile',
    },
  },
  {
    path: 'app/my-dashboard',
    loadChildren: () =>
      import('./routes/route-my-dashboard.module').then(u => u.RouteMyDashboardModule),
    canActivate: [GeneralGuard, LearningGuard],
    data: {
      pageId: '',
      module: 'Dashboard',
    },
  },
  {
    path: 'app/my-rewards',
    loadChildren: () =>
      import('./routes/route-my-rewards.module').then(u => u.RouteMyRewarddModule),
    canActivate: [GeneralGuard, LearningGuard],
    data: {
      pageId: 'app/my-rewards',
      module: 'Profile',
    },
  },
  {
    path: 'app/network-v2',
    loadChildren: () =>
      import('./routes/route-network-v3.module').then(u => u.RouteNetworkV3Module),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'network-v2',
      pageId: 'app/network-v2',
      module: 'Newtwork',
    },
    // resolve: {
    //   pageData: PageResolve,
    // },
  },
  {
    path: 'app/notifications',
    loadChildren: () =>
      import('./routes/route-notification-app.module').then(u => u.RouteNotificationAppModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/notifications',
      module: 'Settings',
    },
  },
  {
    path: 'app/playlist',
    loadChildren: () =>
      import('./routes/route-playlist-app.module').then(u => u.RoutePlaylistAppModule),
    canActivate: [GeneralGuard],
    data: {
    },
  },
  {
    path: 'app/profile',
    loadChildren: () =>
      import('./routes/route-profile-app.module').then(u => u.RouteProfileAppModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'profile',
      pageId: '',
      module: 'Profile',
    },
  },
  {
    path: 'app/person-profile',
    loadChildren: () =>
      import('./routes/route-profile-v2.module').then(u => u.RouteProfileV2Module),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'profile-v2',
      pageId: 'app/person-profile',
      module: 'Profile',
      pageSubtype: 'profile'
    },
    resolve: {
      pageData: FormConfigResolverService,
    },
  },
  {
    path: 'app/event-hub',
    loadChildren: () => import('./routes/route-events.module').then(u => u.RouteEventsModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'event',
      pageId: 'app/event-hub',
      module: 'Events',
    },
    resolve: {
      pageData: AppEventPageResolverService,
    },
  },
  {
    path: 'app/search',
    loadChildren: () =>
      import('./routes/route-search-app.module').then(u => u.RouteSearchAppModule),
    data: {
      pageType: 'feature',
      pageKey: 'search',
      pageId: 'app/search',
      module: 'search',
    },
    resolve: {
      searchPageData: PageResolve,
    },
    canActivate: [GeneralGuard],
  },
  {
    path: 'app/globalsearch',
    loadChildren: () =>
      // import('./routes/route-searchv2-app.module').then(u => u.RouteSearchV2AppModule),
      import('./routes/route-searchv3-app.module').then(u => u.RouteSearchV3AppModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'globalsearch',
      pageId: 'app/globalsearch',
      module: 'Home',
    },
  },
  {
    path: 'app/seeAll',
    loadChildren: () =>
      import('./routes/route-see-all-app.module').then(u => u.RouteSeeAllAppModule),
    canActivate: [GeneralGuard],
    data: {
      pageType: 'feature',
      pageKey: 'seeAll',
      pageId: 'app/seeAll',
      module: 'Home',
    },
    resolve: { home: HomeResolverService },
  },
  {
    path: 'app/signup',
    data: {
      pageId: 'app/signup',
      module: 'signup',
    },
    loadChildren: () =>
      import('./routes/signup/signup.module').then(u => u.SignupModule),
  },
  {
    path: 'app/auto-signup/:id',
    loadChildren: () =>
      import('./routes/signup-auto/signup-auto.module').then(u => u.SignupAutoModule),
    data: {
    },
  },
  {
    path: 'app/toc',
    loadChildren: () => import('./routes/route-app-toc.module').then(u => u.RouteAppTocModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'app/toc',
      module: 'Learn',
    },
  },
  {
    path: 'author/toc',
    loadChildren: () => import('./routes/route-app-toc.module').then(u => u.RouteAppTocModule),
    canActivate: [GeneralGuard],
    data: {
    },
  },
  {
    path: 'app/tnc',
    loadChildren: () => import('./routes/route-tnc.module').then(m => m.RouteTncModule),
    resolve: { tnc: TncAppResolverService },
    data: { pageId: 'app/tnc', module: 'tnc' },
  },
  {
    path: 'app/user-profile',
    data: {
      pageId: 'app/user-profile',
      module: 'Profile',
    },
    loadChildren: () =>
      import('./routes/route-user-profile-app.module').then(u => u.RouteUserProfileAppModule),
  },
  // {
  //   path: 'author',
  //   data: {
  //     requiredRoles: [
  //       // 'content-creator',
  //       // 'ka-creator',
  //       // 'kb-creator',
  //       // 'channel-creator',
  //       // 'reviewer',
  //       // 'publisher',
  //       // 'editor',
  //       // 'admin',
  //     ],
  //   },
  //   canActivate: [GeneralGuard],
  //   loadChildren: () =>
  //     import('./routes/route-authoring-app.module').then(u => u.AuthoringAppModule),
  // },
  {
    path: 'crp/:qrCodeId/:orgId',
    loadChildren: () => import('./routes/route-public-crp.module').then(m => m.RoutePublicCrpModule),
    data: { module: 'Self Registration', pageId: 'crp' },
  },
  {
    path: 'error-access-forbidden',
    component: ErrorResolverComponent,
    data: {
      errorType: 'accessForbidden',
      pageId: 'error-access-forbidden',
      module: 'Error',
    },
  },
  {
    path: 'error-content-unavailable',
    component: ErrorResolverComponent,
    data: {
      errorType: 'contentUnavailable',
      pageId: 'error-content-unavailable',
      module: 'Error',
    },
  },
  {
    path: 'error-feature-disabled',
    component: ErrorResolverComponent,
    data: {
      errorType: 'featureDisabled',
      pageId: 'error-feature-disabled',
      module: 'Error',
    },
  },
  {
    path: 'error-feature-unavailable',
    component: ErrorResolverComponent,
    data: {
      errorType: 'featureUnavailable',
      pageId: 'error-feature-unavailable',
      module: 'Error',
    },
  },
  {
    path: 'error-internal-server',
    component: ErrorResolverComponent,
    data: {
      errorType: 'internalServer',
      pageId: 'error-internal-server',
      module: 'Error',
    },
  },
  {
    path: 'error-service-unavailable',
    component: ErrorResolverComponent,
    data: {
      errorType: 'serviceUnavailable',
      pageId: 'error-service-unavailable',
      module: 'Error',
    },
  },
  {
    path: 'error-somethings-wrong',
    component: ErrorResolverComponent,
    data: {
      errorType: 'somethingsWrong',
      pageId: 'error-somethings-wrong',
      module: 'Error',
    },
  },
  {
    path: 'externalRedirect',
    canActivate: [ExternalUrlResolverService],
    component: ErrorResolverComponent,
  },
  { path: 'home', redirectTo: 'page/home', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [LoginGuard],
    loadChildren: () => import('./routes/route-login.module').then(m => m.RouteLoginModule),
    data: { pageType: 'feature', pageKey: 'login', pageId: 'login', module: 'Login' },
  },
  { path: 'network', redirectTo: 'page/network', pathMatch: 'full' },
  {
    path: 'learner-advisory',
    loadChildren: () => import('./routes/route-learner-advisory.module').then(m => m.RouteLearnerAdvisoryModule),
    canActivate: [GeneralGuard],
    resolve: { home: HomeResolverService },
  },
  {
    path: 'page-leaders',
    loadChildren: () =>
      import('./routes/page-leader-renderer/page-leader-renderer.module').then(
        u => u.PageLeaderRendererModule,
      ),
    canActivate: [GeneralGuard],
  },
  {
    path: 'public/home',
    pathMatch: 'full',
    redirectTo: 'static-home',
  },
  {
    path: 'public/signup',
    loadChildren: () => import('./routes/route-public-signup.module').then(m => m.RoutePublicSignupModule),
    data: { module: 'Login', pageId: 'public/signup', pageType: 'feature', pageKey: 'signup' },
  },
  {
    path: 'public/tnc',
    loadChildren: () => import('./routes/route-tnc.module').then(m => m.RouteTncModule),
    data: { isPublic: true, module: 'support', pageId: 'public/tnc' },
    resolve: { tnc: TncPublicResolverService },
  },
  {
    path: 'public/toc/ext/:partner/:id',
    loadChildren: () => import('./routes/route-public-ext-toc.module').then(m => m.RoutePublicExtTocModule),
  },
  {
    path: 'public',
    loadChildren: () => import('./routes/route-public.module').then(m => m.RoutePublicModule),
  },
  {
    path: 'viewer',
    data: {
      topBar: ETopBar.NONE,
      module: 'Learn',
      pageId: 'viewer',
    },
    resolve: {
      hierarchyData: AppHierarchyResolverService,
      enrollmentData: AppEnrollmentResolverService,
      contentRead: AppContentResolverService,
      preAssessmentRead: AppPreAssessmentContentResolverService,
    },
    loadChildren: () => import('./routes/route-viewer.module').then(u => u.RouteViewerModule),
    canActivate: [GeneralGuard],
  },
  {
    path: 'author/viewer',
    loadChildren: () => import('./routes/route-viewer.module').then(u => u.RouteViewerModule),
    canActivate: [GeneralGuard],
  },
  {
    path: 'embed',
    data: {
      topBar: ETopBar.NONE,
    },
    loadChildren: () => import('./routes/route-viewer.module').then(u => u.RouteViewerModule),
    canActivate: [GeneralGuard],
  },
  {
    path: 'app/tour',
    loadChildren: () => import('./routes/route-app-tour.module').then(m => m.RouteAppTourModule),
    data: { pageId: 'app-tour' },
  },
  {
    path: 'surveyml/:id',
    loadChildren: () => import('./routes/route-survey-shiksha.module').then(m => m.RouteSurveyShikshaModule),
  },
  {
    path: 'badges',
    loadChildren: () =>
      import('./badges/badges.module').then(m => m.BadgesModule),
    canActivate: [GeneralGuard],
    data: {
      pageId: 'badges',
      module: 'Badges',
    },
  },
  {
    path: 'helpcenter',
    loadChildren: () => import('./help-center/help-center.module').then(m => m.HelpCenterModule),
  },
  {
    path: 'igot/help-centre',
    loadChildren: () => import('./help-center/help-center.module').then(m => m.HelpCenterModule),
  },
  {
    path: '**',
    component: ErrorResolverComponent,
    data: {
      errorType: 'notFound',
    },
  },

]
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'top',
      urlUpdateStrategy: 'eager',
      onSameUrlNavigation: 'reload',
      scrollOffset: [0, 80],
      // enableTracing: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
