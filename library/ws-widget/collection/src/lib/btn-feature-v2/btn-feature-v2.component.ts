import { Component, computed, HostBinding, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';

import { WidgetBaseComponent } from '@sunbird-cb/resolver';
import { ConfigurationsService, EventService, NsPage, WsEvents } from '@sunbird-cb/utils-v2';
import { filter, Subscription, take } from 'rxjs';
import { MobileAppsService } from '../_services/mobile-apps.service';
import { CustomTourService } from '../_common/tour-guide/tour-guide.service';
import { BtnFeatureService } from '../btn-feature/btn-feature.service';
import { WidgetUrlResolverV2Directive } from './widget-url-resolver-v2.directive';

export const typeMap = {
  cardFull: 'card-full',
  cardMini: 'card-mini',
  cardSmall: 'card-small',
  matButton: 'mat-button',
  matFabButton: 'mat-fab',
  matFlatButton: 'mat-flat-button',
  matIconButton: 'mat-icon-button',
  matMiniFabButton: 'mat-mini-fab',
  matRaisedButton: 'mat-raised-button',
  matStrokedButton: 'mat-stroked-button',
  menuItem: 'mat-menu-item',
  featureItem: 'feature-item',
  externalLinkButton: 'external-link-button',
} as const;

@Component({
  selector: 'ws-widget-btn-feature-v2',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatRippleModule,
    MatBadgeModule,
    MatMenuModule,
    WidgetUrlResolverV2Directive,
  ],
  templateUrl: './btn-feature-v2.component.html',
  styleUrl: './btn-feature-v2.component.scss',
})
export class BtnFeatureV2Component extends WidgetBaseComponent
  implements OnInit, OnDestroy {
  
  // Inputs using Angular 20 signals
  widgetData = input.required<NsPage.INavLink>();
  showFixedLength = input(false);
  
  @HostBinding('id')
  public id = signal('');

  // State signals
  badgeCount = signal('');
  isPinned = signal(false);
  instanceVal = signal('');
  isPinFeatureAvailable = signal(true);

  // Constants
  readonly displayType = typeMap;
  readonly defaultIconSize = 24;

  // Computed signals replacing getters
  featureStatusColor = computed(() => {
    const actionBtn = this.widgetData()?.actionBtn;
    if (actionBtn) {
      switch (actionBtn.status) {
        case 'earlyAccess':
          return 'primary';
        case 'beta':
          return 'accent';
        case 'alpha':
          return 'warn';
        default:
          return null;
      }
    }
    return null;
  });

  desktopVisible = computed(() => {
    const actionBtn = this.widgetData()?.actionBtn;
    if (actionBtn && actionBtn.mobileAppFunction) {
      return this.mobileSvc.isMobile;
    }
    return true;
  });

  private pinnedAppsChangeSubs?: Subscription;
  private navigationSubs?: Subscription;

  // Dependency injection using inject()
  private events = inject(EventService);
  private configurationsSvc = inject(ConfigurationsService);
  private btnFeatureSvc = inject(BtnFeatureService);
  private router = inject(Router);
  private mobileSvc = inject(MobileAppsService);
  private configSvc = inject(ConfigurationsService);
  private tour = inject(CustomTourService);

  constructor() {
    super();
  }

  ngOnInit() {
    this.instanceVal.set(this.configSvc.rootOrg || '');
    
    if (this.configSvc.restrictedFeatures) {
      this.isPinFeatureAvailable.set(!this.configSvc.restrictedFeatures.has('pinFeatures'));
    }

    const widgetDataValue = this.widgetData();
    
    if (
      !widgetDataValue.actionBtn &&
      widgetDataValue.actionBtnId &&
      this.configurationsSvc.appsConfig
    ) {
      widgetDataValue.actionBtn = this.configurationsSvc.appsConfig.features[widgetDataValue.actionBtnId];
      
      if (widgetDataValue.actionBtn && widgetDataValue.actionBtn.badgeEndpoint) {
        this.navigationSubs = this.router.events.pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd)
        ).subscribe(() => {
          this.updateBadge();
        });
      }
    }

    this.pinnedAppsChangeSubs = this.configurationsSvc.pinnedApps.subscribe(pinnedApps => {
      const actionBtn = this.widgetData()?.actionBtn;
      this.isPinned.set(Boolean(actionBtn && pinnedApps.has(actionBtn.id)));
    });

    if (!this.id() && widgetDataValue.actionBtnId) {
      this.id.set(widgetDataValue.actionBtnId);
    }
  }

  ngOnDestroy() {
    if (this.pinnedAppsChangeSubs) {
      this.pinnedAppsChangeSubs.unsubscribe();
    }
    if (this.navigationSubs) {
      this.navigationSubs.unsubscribe();
    }
  }

  updateBadge() {
    const actionBtn = this.widgetData()?.actionBtn;
    if (actionBtn && actionBtn.badgeEndpoint) {
      this.btnFeatureSvc
        .getBadgeCount(actionBtn.badgeEndpoint)
        .then((count: any) => {
          if (count > 99) {
            this.badgeCount.set('99+');
          } else if (count > 0) {
            this.badgeCount.set(count.toString());
          } else {
            this.badgeCount.set('');
          }
        })
        .catch(_err => {
          // Error handling
        });
    }
  }

  togglePin(featureId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    this.events.raiseInteractTelemetry(
      {
        type: 'pin',
        subType: 'feature',
        id: featureId,
      },
      {
        id: featureId,
      },
      {
        pageIdExt: 'btn-feature',
        module: WsEvents.EnumTelemetrymodules.CONTENT,
      }
    );

    this.configurationsSvc.pinnedApps.pipe(take(1)).subscribe(pinnedApps => {
      const newPinnedApps = new Set(pinnedApps);
      if (newPinnedApps.has(featureId)) {
        newPinnedApps.delete(featureId);
      } else {
        newPinnedApps.add(featureId);
      }
      this.isPinned.set(newPinnedApps.has(featureId));
      this.configurationsSvc.prefChangeNotifier.next({
        pinnedApps: Array.from(newPinnedApps).join(','),
      });
      this.configurationsSvc.pinnedApps.next(newPinnedApps);
    });
  }

  startTour() {
    this.tour.startTour();
  }
}
