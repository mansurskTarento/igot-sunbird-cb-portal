export const NOTIFICATION_TIME = 5;
export const AVAILABLE_LOCALES = ['en'];

export const CATEGORY_TYPE = [
  {
    displayName: 'Contents',
    name: 'Course',
    count: 0,
    isChecked: false,
    filters: [
      {
        name: 'Moderated Course',
        count: 0,
        isChecked: false,
        displayName: 'Moderated Courses',
      },
      {
        name: 'Invite-Only Course',
        count: 0,
        isChecked: false,
        displayName: 'Invite Only Course',
      },
      {
        name: 'Moderated Program',
        count: 0,
        isChecked: false,
        displayName: 'Moderated Program',
      },
      {
        name: 'Invite-Only Program',
        count: 0,
        isChecked: false,
        displayName: 'Invite Only Program',
      },
      {
        name: 'Blended Program',
        count: 0,
        isChecked: false,
        displayName: 'Blended Program',
      },
      {
        name: 'Curated Program',
        count: 0,
        isChecked: false,
        displayName: 'Curated Program',
      },
      {
        name: 'Moderated Assessment',
        count: 0,
        isChecked: false,
        displayName: 'Moderated Assessment',
      },
      {
        name: 'Standalone Assessment',
        count: 0,
        isChecked: false,
        displayName: 'Standalone Assessment',
      },
    ],
  },
  {
    displayName: 'Events',
    name: 'Events',
    count: 0,
    isChecked: false,
    filters: [],
  },
  {
    name: 'Peoples',
    count: 0,
    isChecked: false,
    displayName: 'Peoples',
    filters: [],
  },
  {
    name: 'Case Study',
    count: 0,
    isChecked: false,
    displayName: 'Case Study',
    filters: [],
  },
  {
    name: 'Communities',
    count: 0,
    isChecked: false,
    displayName: 'Communities',
    filters: [],
  },
];

export const SEARCH_SORT_DROPDOWN = [
  { name: 'Most Relevant', value: 'most_relevant' },
  { name: 'Recently Added (Newest)', value: 'recently_added_newest' },
  { name: 'Highest Rated', value: 'highest_rated' },
  // { name: 'Most Enrolled', value: 'most_enrolled' },
];
