import { Component } from '@angular/core'

@Component({
  selector: 'app-badge-details',
  templateUrl: './badge-details.component.html',
  styleUrls: ['./badge-details.component.scss'],
})
export class BadgeDetailsComponent {

  activeTab: 'earned' | 'inprogress' = 'earned'
  selectedBadge: any;
  showTab(tab: 'earned' | 'inprogress') {
    this.activeTab = tab
  }
  showModal = false

  openModal(badge: any) {
    console.log('badge', badge)
    this.selectedBadge = {
      title: 'Beginner',
      image: 'assets/icons/badges/BronzeBadge.svg',
      level: ''
    }
    this.showModal = true
  }

  closeModal() {
    this.showModal = false
  }
  breadcrumbData = {
    url: 'home',
    titles: [
      { title: 'sdadsad', url: '/app/person-profile', icon: 'person', noTranslate: true },
      { title: 'My Badges', url: 'none', icon: '', noTranslate: true }
    ]
  }
  data = {
    stats: [
      {
        label: 'Total Badges Earned',
        icon: 'assets/icons/badges/badge.svg',
        iconClass: 'orange',
        value: 3,
      },
      {
        label: 'Course Completed',
        icon: 'assets/icons/badges/course.svg',
        iconClass: 'blue',
        value: 13,
      },
      {
        label: 'Average Progress',
        icon: 'assets/icons/badges/line_chart.svg',
        iconClass: 'yellow',
        value: '82%',
      },
    ],

    earnedBadges: [
      {
        image: 'assets/icons/badges/Below Badge.svg',
        glow: 'glow-red',
        title: 'Course Champion',
        level: 'Beginner',
      },
      {
        image: 'assets/icons/badges/police badge.svg',
        glow: 'glow-orange',
        title: 'Course Champion',
        level: 'Advanced',
      },
      {
        image: 'assets/icons/badges/Gold cup.svg',
        glow: '',
        title: 'Course Champion',
        level: 'Advanced',
      },
    ],

    inProgress: [
      {
        icon: 'assets/icons/badges/Bronze cup.svg',
        name: 'Advance Leadership Skills',
        progress: '92%',
        continue: true,
      },
      {
        icon: 'assets/icons/badges/Police badge.svg',
        name: 'Digital Transformation Workshop',
        progress: '87%',
        continue: false,
      },
      {
        icon: 'assets/icons/badges/Below Badge.svg',
        name: 'Digital Transformation Workshop',
        progress: '74%',
        continue: false,
      },

    ],
  }
}