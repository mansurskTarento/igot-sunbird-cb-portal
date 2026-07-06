export const BHARAT_KALP_FALLBACK_FORM = {
  result: {
    form: {
      type: 'bharat-kalp',
      subtype: 'microsite',
      action: 'page-configuration',
      component: 'portal',
      data: {
        sectionList: [
          {
            enabled: true,
            key: 'sectionTopBanner',
            wrapperClass: '',
            column: [
              {
                enabled: true,
                key: 'topBannerSection',
                colspan: 12,
                data: {
                  programTag: 'CIVIL SERVICES LEADERSHIP PROGRAM',
                  title: 'Bharat KALP',
                  subtitle: 'Knowledge, Action & Leadership Program',
                  description:
                    'A flagship initiative to build exceptional governance capabilities for IAS Officers across India.',
                  features: [
                    'Curated by domain experts & senior IAS mentors',
                    'Structured 6-week learning journey',
                    'Blended learning: modules, live sessions & assessments',
                  ],
                  ctaButton: { text: 'Start Learning', link: '' },
                },
              },
            ],
          },
          {
            enabled: false,
            key: 'sectionTopCarousel',
            wrapperClass: '',
            column: [
              {
                enabled: true,
                key: 'topCarouselSection',
                colspan: 12,
                data: {
                  display: true,
                  size: 'md',           // xs | sm | md | lg | xl | xxl  (200px → 50vh)
                  slides: [
                    {
                      imageUrl: 'https://www.shutterstock.com/image-vector/social-media-banner-frame-carousel-260nw-2644039599.jpg',
                      redirectionUrl: '',
                    },

                  ],
                },
              },
            ],
          },
          {
            enabled: true,
            key: 'sectionKeyHighlights',
            wrapperClass: '',
            column: [
              {
                enabled: true,
                key: 'keyHighlightsSection',
                colspan: 12,
                data: {
                  backgroundColor: '#EAF1F8',
                  titleMaxLength: 200,
                  containerClass: 'container',
                  content: [
                    { title: '100 Certificates acquired by learners in the last 24 hr. getting a special certificate' },
                    { title: 'Structured 16-week learning journey for IAS Officers' },
                    { title: 'Blended learning with expert mentors from across civil services' },
                  ],
                  sliderData: {
                    styleData: {
                      borderRadius: '0',
                      bannerMeta: 'visible',
                      dots: 'hidden',
                      arrowsPlacement: 'middle-inline',
                      responsive: {
                        bannerMetaAlign: 'left',
                        navigationArrows: 'visible',
                        dots: 'hidden',
                        arrowsPlacement: 'middle-inline',
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            enabled: true,
            key: 'sectionMainContent',
            wrapperClass: '',
            column: [
              {
                enabled: true,
                key: 'mainContentSection',
                colspan: 12,
                data: {
                  containerClass: '',
                  mobileKeys: ['weekProgress', 'recommended', 'mentorship', 'myprogress', 'events'],
                  deskTopKeys: {
                    leftContent: { colspan: 8, data: ['weekProgress', 'recommended', 'mentorship'] },
                    rightContent: { colspan: 4, data: ['myprogress', 'events'] },
                  },
                },
              },
            ],
          },
        ],
        individualSection: {
          weekProgress: {
            enabled: true,
            containerClass: 'mb-6',
            totalWeeks: 16,
            viewAllUrl: '/app/learn/kalp/bharat-kalp/see-all',
            weeks: {
              week_1: {
                title: 'Foundations of Governance',
                doIds: ['do_11434925651100467212810'],
                progress: 0,
              },
              week_2: {
                title: 'Public Policy & Administration',
                doIds: ['do_1143776121456721921551'],
                progress: 100,
              },
              week_3: {
                title: 'Governance & Digital India',
                doIds: ['do_1139966676160757761511', 'do_11395704427130060819'],
                progress: 50,
              },
              week_4: {
                title: 'Economic Planning & Development',
                doIds: ['do_11447060019087769614353'],
                progress: 100,
              },
              week_5: {
                title: 'Social Sector Management',
                doIds: ['do_11431117738852352011247', 'do_114505991944642560176'],
                progress: 0,
              },
              week_6: {
                title: 'Environmental Governance',
                doIds: ['do_114334456439726080195'],
                progress: 0,
              },
              week_7: {
                title: 'Law & Order Administration',
                doIds: ['do_11433306742269542412211', 'do_1143761040272670721391'],
                progress: 0,
              },
              week_8: {
                title: 'Financial Management',
                doIds: ['do_1143403952027729921618'],
                progress: 0,
              },
              week_9: {
                title: 'Human Resource Management',
                doIds: ['do_1145109596437299201470', 'do_114505610287136768115'],
                progress: 0,
              },
              week_10: {
                title: 'Infrastructure & Urban Development',
                doIds: ['do_11452074616911462411951'],
                progress: 0,
              },
              week_11: {
                title: 'Rural Development',
                doIds: ['do_1145285829888000001319', 'do_11452371515147878412754'],
                progress: 0,
              },
              week_12: {
                title: 'International Relations & Trade',
                doIds: ['do_11452016646302924811789'],
                progress: 0,
              },
              week_13: {
                title: 'Crisis Management',
                doIds: ['do_11451875098095616011619', 'do_11451875162314342411630'],
                progress: 0,
              },
              week_14: {
                title: 'Technology in Governance',
                doIds: ['do_11451928648119910411734'],
                progress: 0,
              },
              week_15: {
                title: 'Leadership & Change Management',
                doIds: ['do_11451875173250662411635', 'do_11451804513279180811501'],
                progress: 0,
              },
              week_16: {
                title: 'Capstone & Assessment',
                doIds: ['do_11451875173250662411635'],
                progress: 0,
              },
            },
            contentStrips: [
              {
                active: true,
                weekNumber: 3,
                title: 'New Releases For Week 3',
                titleDescription: 'Below Content is related to Week 3',
                viewMoreUrl: { path: '' },
                tabs: [
                  {
                    label: 'Courses',
                    cards: [
                      { name: 'Introduction To Bharatiya Nyaya Sanhita, 2023', identifier: '', posterImage: '', duration: '52 min', category: 'Course', org: 'By Karmayogi Bharat', orgLogo: '', rating: '4.4' },
                      { name: 'Practice Question: Introduction to Administrative', identifier: '', posterImage: '', duration: '14 hrs', category: 'Course', org: 'By Karmayogi Bharat', orgLogo: '', rating: '4.4' },
                      { name: 'Public Governance Models', identifier: '', posterImage: '', duration: '58 min', category: 'Course', org: 'By Karmayogi Bharat', orgLogo: '', rating: '4.4' },
                      { name: 'Digital India: Foundations of e-Governance', identifier: '', posterImage: '', duration: '1 hr 20 min', category: 'Course', org: 'By Karmayogi Bharat', orgLogo: '', rating: '4.2' },
                    ],
                  },
                  {
                    label: 'Programs',
                    cards: [
                      { name: 'Civil Services Leadership Program', identifier: '', posterImage: '', duration: '16 weeks', category: 'Program', org: 'By Mission Karmayogi', orgLogo: '', rating: '4.5' },
                      { name: 'Bharat Kalp Advanced Governance', identifier: '', posterImage: '', duration: '8 weeks', category: 'Program', org: 'By Mission Karmayogi', orgLogo: '', rating: '4.3' },
                    ],
                  },
                  {
                    label: 'Events',
                    cards: [
                      { name: 'Live Webinar: Digital Governance & Policy', identifier: '', posterImage: '', duration: '2 hrs', category: 'Event', org: 'By Karmayogi Bharat', orgLogo: '', rating: '' },
                      { name: 'Expert Panel: Leadership in Civil Services', identifier: '', posterImage: '', duration: '1 hr 30 min', category: 'Event', org: 'By Karmayogi Bharat', orgLogo: '', rating: '' },
                    ],
                  },
                  {
                    label: 'Assessment',
                    cards: [
                      { name: 'BNS 2023 – Week 3 Assessment', identifier: '', posterImage: '', duration: '30 min', category: 'Assessment', org: 'By Karmayogi Bharat', orgLogo: '', rating: '' },
                    ],
                  },
                ],
              },
            ],
          },
          recommended: {
            enabled: true,
            containerClass: 'mb-6',
            title: 'Recommended',
            showAllUrl: '/app/learn/browse-by/competency',
            apiConfig: {
              url: '/apis/proxies/v8/sunbirdigot/search',
              requestBody: {
                locale: ['en'],
                query: '',
                request: {
                  filters: {
                    status: ['Live'],
                    primaryCategory: ['Course'],
                  },
                  sort_by: { lastUpdatedOn: 'desc' },
                  pageSize: 10,
                },
              },
            },
          },
          mentorship: {
            containerClass: 'mb-6',
            title: 'Mentorship',
            subtitle: 'Connect with fellow IAS officers across all programs',
            viewAllUrl: '/app/discussion-forum-v2',
            showAllButton: false,   /* false → hides "Show all" button */
            communityApiConfig: {
              url: '/apis/proxies/v8/community/v1/user/communities',
              method: 'GET',
            },
          },
          myprogress: {
            containerClass: 'mt-2',
            data: {
              hideEle: ['rank', 'karma-points', 'badges'],
              title: 'Overall Progress',
              description: 'This data is refreshed every 24 hours.',
              descriptionClass: 'text-xs',
              displayInfoIcon: true,
              infoText: 'During Bharat Kalp, stay informed about your learning journey.',
              coursesLabel: 'Courses Completed',
              hoursFormatted: true,
              profleDetails: {},
              insights: { disable: true },
            },
          },
          events: {
            containerClass: 'mt-4',
            active: true,
            enabled: true,
            title: 'Explore Webinars',
            navigation: true,
            key: 'sectionExploreEvents',
            /* Events/Webinars API called by sb-uic-events component to fetch live webinar cards */
            /* startDate range is injected automatically from bkConfig.startDate/endDate */
            eventsApiConfig: {
              url: '/apis/proxies/v8/sunbirdigot/search',
              requestBody: {
                locale: ['en'],
                query: '',
                request: {
                  query: '',
                  filters: {
                    status: ['Live'],
                    contentType: 'Event',
                    category: 'Event',
                    resourceType: ['bharat_kalp_talks'],
                  },
                  facets: ['sourceName', 'resourceType'],
                  sort_by: { startDate: 'desc' },
                  limit: 100,
                  offset: 0,
                },
              },
            },
            column: [
              { active: true, enabled: true, key: 'exploreEventsContent', title: 'Explore Webinars', maxContent: 3, defaultImage: '' },
            ],
          },
        },
        bkConfig: {
          totalWeeks: 16,
          startDate: '20-05-2026',   /* DD-MM-YYYY — drives: week calculation + events dropdown */
          endDate: '30-10-2026',     /* DD-MM-YYYY — drives: week calculation + events dropdown */
        },
      },
    },
  },
}
