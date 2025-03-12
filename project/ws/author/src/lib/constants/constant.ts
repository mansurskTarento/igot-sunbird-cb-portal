export const NOTIFICATION_TIME = 5;
export const AVAILABLE_LOCALES = ['en'];

export const CATEGORY_TYPE = [
  {
    displayName: 'Courses',
    filters: [
      {
        name: 'Moderated Course',
        count: 0,
        ischecked: false,
        displayName: 'Moderated Courses',
      },
      {
        name: 'Invite-Only Course',
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
        name: 'Moderated Program',
        count: 0,
        ischecked: false,
        displayName: 'Moderated Program',
      },
      {
        name: 'Invite-Only Program',
        count: 0,
        ischecked: false,
        displayName: 'Invite Only Program',
      },
      {
        name: 'Blended Program',
        count: 0,
        ischecked: false,
        displayName: 'Blended Program',
      },
      {
        name: 'Curated Program',
        count: 0,
        ischecked: false,
        displayName: 'Curated Program',
      },
    ],
  },
  {
    displayName: 'Assessments',
    filters: [
      {
        name: 'Moderated Assessment',
        count: 0,
        ischecked: false,
        displayName: 'Moderated Assessment',
      },
      {
        name: 'Standalone Assessment',
        count: 0,
        ischecked: false,
        displayName: 'Standalone Assessment',
      },
    ],
  },
];

export const SEARCH_SORT_DROPDOWN = [
  { name: 'Most Relevant', value: 'most_relevant' },
  { name: 'Recently Added (Newest)', value: 'recently_added_newest' },
  { name: 'Highest Rated', value: 'highest_rated' },
  // { name: 'Most Enrolled', value: 'most_enrolled' },
];
