import { Component, ViewEncapsulation } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

const ICON_BASE = '/assets/icons/karmawallet-v2'

interface IKarmaFlowStep {
  icon: string
  value: string
  caption: string
}

@Component({
  selector: 'ws-app-karma-coins-info-dialog',
  templateUrl: './karma-coins-info-dialog.component.html',
  styleUrls: ['./karma-coins-info-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class KarmaCoinsInfoDialogComponent {

  /* Every icon this dialog renders, so re-pointing the asset folder is a one-place change */
  readonly icons = {
    badgeKarmaPoints: `${ICON_BASE}/badgekarmapoints.svg`,
    badgeKarmaCoin: `${ICON_BASE}/badgekarmacoin.svg`,
    badgeRedeem: `${ICON_BASE}/badgeredeem.svg`,
    badgeKarmaWallet: `${ICON_BASE}/badgekarmawallet.svg`,
    karmaCoin: `${ICON_BASE}/karmacoin.svg`,
    bell: `${ICON_BASE}/bell.svg`,
    karmaPoints: '/assets/icons/home-v2/karma-badge.svg',
  }

  readonly flowSteps: IKarmaFlowStep[] = [
    {
      icon: this.icons.badgeKarmaPoints,
      value: '100',
      caption: 'Karma Points earned',
    },
    {
      icon: this.icons.badgeKarmaCoin,
      value: '+100',
      caption: 'Karma Coins received',
    },
    {
      icon: this.icons.badgeRedeem,
      value: '−20',
      caption: 'Redeemed for a course',
    },
    {
      icon: this.icons.badgeKarmaWallet,
      value: '80',
      caption: 'Coins left 100 points stay',
    },
  ]

  constructor(private dialogRef: MatDialogRef<KarmaCoinsInfoDialogComponent>) { }

  close(via: 'close-icon' | 'i-understand' | 'walkthrough' = 'close-icon') {
    this.dialogRef.close(via)
  }
}
