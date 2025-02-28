export const NOTIFICATION_TIME = 5;
export const AVAILABLE_LOCALES = ['en'];

export const CATEGORY_TYPE = [
  {
    displayName: 'Courses',
    filters: [
      {
        name: 'moderated_course',
        count: 0,
        ischecked: false,
        displayName: 'Moderated Courses',
      },
      {
        name: 'invite_only_course',
        count: 0,
        ischecked: false,
        displayName: 'Invite Only Course',
      },
    ],
  },
  {
    displayName: 'Program',
    filters: [
      {
        name: 'moderated_program',
        count: 0,
        ischecked: false,
        displayName: 'Moderated Program',
      },
      {
        name: 'invite_only_program',
        count: 0,
        ischecked: false,
        displayName: 'Invite Only Program',
      },
    ],
  },
  {
    displayName: 'Events',
    filters: [
      {
        name: 'moderated_program',
        count: 0,
        ischecked: false,
        displayName: 'Event 1',
      },
      {
        name: 'invite_only_program',
        count: 0,
        ischecked: false,
        displayName: 'Event 2',
      },
    ],
  },
  {
    displayName: 'People',
    filters: [
      {
        name: 'moderated_program',
        count: 0,
        ischecked: false,
        displayName: 'People 1',
      },
      {
        name: 'invite_only_program',
        count: 0,
        ischecked: false,
        displayName: 'people 2',
      },
    ],
  },
  {
    displayName: 'People 2',
    filters: [
      {
        name: 'moderated_program',
        count: 0,
        ischecked: false,
        displayName: 'People 1',
      },
      {
        name: 'invite_only_program',
        count: 0,
        ischecked: false,
        displayName: 'people 2',
      },
    ],
  },
];

export const FILTER_RATING = [
  { rating: '4.5', count: 999, ischecked: false },
  { rating: '4.0', count: 999, ischecked: false },
  { rating: '3.5', count: 999, ischecked: false },
  { rating: '3.0', count: 999, ischecked: false },
];

export const FILTER_LANGUAGE = [
  { lang: 'Hindi', count: 999, ischecked: false },
  { lang: 'English', count: 999, ischecked: false },
  { lang: 'Tamil', count: 999, ischecked: false },
  { lang: 'Telugu', count: 999, ischecked: false },
  { lang: 'Odia', count: 999, ischecked: false },
];

export const FILTER_CONTENT_PROVIDER = [
  { provider: 'Karmayogi Bharat', count: 999, ischecked: false },
  { provider: 'ISTM', count: 999, ischecked: false },
  { provider: 'NADT', count: 999, ischecked: false },
  { provider: 'SVPNPA', count: 999, ischecked: false },
  { provider: 'Karmayogi Bharat', count: 999, ischecked: false },
];

export const FILTER_DURATION = [
  { duration: '90 mins', count: 999, ischecked: false },
  { duration: '60 - 90 mins', count: 999, ischecked: false },
  { duration: '30 - 60 mins', count: 999, ischecked: false },
  { duration: '0 - 30 mins', count: 999, ischecked: false },
];

export const FILTER_COMPETENCY_AREA = [
  { comp: 'Behavioural', count: 999, ischecked: false },
  { comp: 'Domain', count: 999, ischecked: false },
  { comp: 'Functional', count: 999, ischecked: false },
];
