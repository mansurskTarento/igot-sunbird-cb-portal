export type RoleTab = 'learner' | 'mdo-leader' | 'content-building'
export type ContentTab = 'all' | 'videos' | 'guides' | 'faqs'

export interface VideoTutorial {
  id: string
  title: string
  date: string
  thumbnail: string
  youtubeUrl: string
  category: string
}

export interface HowToGuide {
  id: string
  title: string
  titleHindi?: string
  description: string
  thumbnail: string
  category: string
  pdfUrl: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string
  tag: string
  isOpen?: boolean
}

export interface Category {
  id: string
  label: string
  icon: string
  count: number
}

export const VIDEO_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 8 },
  { id: 'profie_account', label: 'Profie & Account', icon: 'person', count: 3 },
  { id: 'registration_login', label: 'Registration & Login', icon: 'login', count: 2 },
  { id: 'certificates', label: 'Certificates & DigiLocker', icon: 'workspace_premium', count: 1 },
  { id: 'mobile_app', label: 'Mobile App (Android & iOS)', icon: 'smartphone', count: 3 },
  { id: 'discussion_community', label: 'Dicussion & Community', icon: 'forum', count: 1 },
]

export const VIDEO_MDO_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 8 },
  { id: 'my_igot_apar', label: 'My iGOT & APAR', icon: 'person', count: 3 },
  { id: 'dashboard_analytics', label: 'Dashboard & Analytics', icon: 'login', count: 2 },
  { id: 'user_management', label: 'User Management', icon: 'workspace_premium', count: 1 },
  { id: 'sparrow_integration', label: 'SPARROW Integration', icon: 'smartphone', count: 3 },
  // { id: 'events_programs', label: 'Events & Programs', icon: 'forum', count: 1 },
]

export const VIDEO_CBP_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 8 },
  { id: 'walkthrough_video', label: 'Walkthrough Video', icon: 'person', count: 3 },
]

export const GUIDE_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 7 },
  { id: 'login_guide', label: 'Registation & Login', icon: 'login', count: 1 },
  { id: 'profile_setup', label: 'Profile Button Guide', icon: 'manage_accounts', count: 2 },
  { id: 'learning', label: 'Course & Certificates', icon: 'school', count: 3 },
  { id: 'community_ai', label: 'Community & AI ', icon: 'school', count: 3 },
  { id: 'discuss_hub', label: 'Discuss Hub Manual ', icon: 'school', count: 3 },
  { id: 'reset_password', label: 'Reset Password', icon: 'school', count: 3 }
]

export const GUIDE_MDO_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 7 },
  { id: 'user_onboarding', label: 'User Onboarding', icon: 'login', count: 1 },
  { id: 'user_management', label: 'User Management', icon: 'manage_accounts', count: 2 },
  { id: 'event', label: 'Event', icon: 'manage_accounts', count: 2 },
  { id: 'comprehensive_assessment', label: 'Comprehensive Assessment', icon: 'manage_accounts', count: 2 }
]

export const GUIDE_CBP_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 7 },
  { id: 'dashboard', label: 'Dashboard Guide', icon: 'login', count: 1 },
]

export const FAQ_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 5 },
  { id: 'getting_access', label: 'Getting Access', icon: 'public', count: 3 },
  { id: 'logging_in', label: 'Logging In', icon: 'login', count: 6 },
  { id: 'profile_setup', label: 'Profile Setup', icon: 'manage_accounts', count: 4 },
  { id: 'learning', label: 'Learning', icon: 'workspace_premium', count: 5 },
  { id: 'certificates', label: 'Certificates', icon: 'workspace_premium', count: 5 },
  { id: 'mobile_app', label: 'Mobile App', icon: 'workspace_premium', count: 5 },
]

export const FAQ_MDP_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Categories', icon: 'grid', count: 5 },
  { id: 'user_onboarding', label: 'User Onboarding', icon: 'public', count: 3 },
  { id: 'assessment_apar', label: 'Assessment & APAR', icon: 'login', count: 6 }
]



export const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: '1',
    title: 'How to update your profile',
    date: 'Sep 4, 2025',
    thumbnail: 'https://img.youtube.com/vi/9advDLMfjZ8/hqdefault.jpg',
    youtubeUrl: 'https://youtu.be/9advDLMfjZ8?si=bAUrPXvI08owkrxB',
    category: 'profie_account',
  },
  {
    id: '2',
    title: 'Walkthrough video of Discuss Hub',
    date: 'Mar 21, 2025',
    thumbnail: 'https://img.youtube.com/vi/vV9Y00fWrdM/hqdefault.jpg',
    youtubeUrl: 'https://youtu.be/vV9Y00fWrdM',
    category: 'discussion_community',
  },
  {
    id: '3',
    title: 'How to Register & Login at the iGOT Karmayogi platform',
    date: 'Feb 22, 2024',
    thumbnail: 'https://img.youtube.com/vi/MH12AkVBs3k/hqdefault.jpg',
    youtubeUrl: 'https://youtu.be/MH12AkVBs3k?si=qBPKwjwIUGO1aUo0',
    category: 'registration_login',
  },
  {
    id: '4',
    title: 'How to download the iGOT Karmayogi App on Android Devices',
    date: 'Apr 30, 2024',
    thumbnail: 'https://img.youtube.com/vi/bJ7JaHjaLKk/hqdefault.jpg',
    youtubeUrl: 'https://youtu.be/bJ7JaHjaLKk?si=z353HCXBlUtSkO4h',
    category: 'mobile_app',
  },
  {
    id: '5',
    title: 'How to download the iGOT Karmayogi App on iOS Devices',
    date: 'Apr 30, 2024',
    thumbnail: 'https://img.youtube.com/vi/9advDLMfjZ8/hqdefault.jpg',
    youtubeUrl: 'https://youtu.be/zHCJ2UlRG5o?si=XoQfvq8sjLOkWDt7',
    category: 'mobile_app',
  },
  {
    id: '6',
    title: 'How to access iGOT certificate on Digilocker',
    date: 'May 8, 2024',
    thumbnail: 'https://img.youtube.com/vi/YpO5V9MVqsE/hqdefault.jpg',
    youtubeUrl: 'https://youtu.be/YpO5V9MVqsE?si=JVFSV4IbI7-cVF5H',
    category: 'certificates',
  },
  {
    id: '7',
    title: 'How to update your profile (Marathi)',
    date: 'Mar 21, 2025',
    thumbnail: 'https://img.youtube.com/vi/rhEIXdD9vD4/hqdefault.jpg',
    youtubeUrl: 'https://youtu.be/rhEIXdD9vD4',
    category: 'profie_account',
  }
]

export const HOW_TO_GUIDES: HowToGuide[] = [
  {
    id: '1',
    title: 'How to Register and Login to iGOT',
    titleHindi: 'iGOT पर पंजीकरण और लॉगिन कैसे करें',
    description: 'Step-by-step guide to register on the iGOT Karmayogi platform and login to your account.',
    thumbnail: '',
    category: 'login_guide',
    pdfUrl: 'assets/help-pdf/Learner/How to Register and Login to iGOT.pdf',
  },
  {
    id: '1',
    title: 'iGOT PROFILE UPDATE MANUAL AUGUST 2025.pdf',
    titleHindi: 'iGOT पर पंजीकरण और लॉगिन कैसे करें',
    description: 'Step-by-step guide to profile update on the iGOT Karmayogi platform.',
    thumbnail: '',
    category: 'profile_setup',
    pdfUrl: 'assets/help-pdf/Learner/iGOT PROFILE UPDATE MANUAL AUGUST 2025.pdf',
  },
  {
    id: '1',
    title: 'PROFILE BUTTON iGOT MANUAL',
    titleHindi: 'iGOT पर पंजीकरण और लॉगिन कैसे करें',
    description: 'Step-by-step guide to profile button on the iGOT Karmayogi platform.',
    thumbnail: '',
    category: 'profile_setup',
    pdfUrl: 'assets/help-pdf/Learner/PROFILE BUTTON iGOT MANUAL.pdf',
  },
  {
    id: '1',
    title: 'COURSE ENROLLMENT AND CERTIFICATE DOWNLOAD.pdf',
    titleHindi: 'iGOT पर पंजीकरण और लॉगिन कैसे करें',
    description: 'Step-by-step guide to course enrollment and certificate download on the iGOT Karmayogi platform.',
    thumbnail: '',
    category: 'learning',
    pdfUrl: 'assets/help-pdf/Learner/COURSE ENROLLMENT AND CERTIFICATE DOWNLOAD.pdf',
  },
  {
    id: '1',
    title: 'LEARNER MANUAL AI CHATBOT AND AI TUTOR',
    titleHindi: 'iGOT पर पंजीकरण और लॉगिन कैसे करें',
    description: 'Step-by-step guide to use AI chatbot and AI tutor on the iGOT Karmayogi platform.',
    thumbnail: '',
    category: 'community_ai',
    pdfUrl: 'assets/help-pdf/Learner/LEARNER MANUAL AI CHATBOT AND AI TUTOR.pdf',
  },
  {
    id: '1',
    title: 'LEARNER MANUAL DISCUSS HUB',
    titleHindi: 'iGOT पर पंजीकरण और लॉगिन कैसे करें',
    description: 'Step-by-step guide to discuss hub on the iGOT Karmayogi platform.',
    thumbnail: '',
    category: 'discuss_hub',
    pdfUrl: 'assets/help-pdf/Learner/LEARNER MANUAL DISCUSS HUB.pdf',
  },
  {
    id: '1',
    title: 'Reset Password Guide',
    titleHindi: 'iGOT पर पंजीकरण और लॉगिन कैसे करें',
    description: 'Step-by-step guide to reset password on the iGOT Karmayogi platform.',
    thumbnail: '',
    category: 'reset_password',
    pdfUrl: 'assets/help-pdf/Learner/RESET YOUR PASSWORD iGOT.pdf',
  },
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    question: 'Can I register without a government email ID?',
    answer: 'No, iGOT requires a valid government email ID (e.g. name@gov.in, name@nic.in, name@[state].gov.in) to register. If you do not have one:<br>1. Contact your department\'s MDO Admin or nodal officer to request a government email.<br>2. Ask your MDO Admin to register you directly using the bulk upload or custom link method.<br>3. Once registered, you can log in using mobile OTP instead of email.',
    category: 'getting_access',
    tag: 'learning-certificates',
  },
  {
    id: '2',
    question: 'My email is showing \'Invalid\' when I try to register, what should I do?',
    answer: 'This happens when a personal email (Gmail, Yahoo) or an unrecognised domain is entered. Steps:<br>1. Check that you are using your official government email(e.g.name@gov.in, not Gmail).<br>2. If the error persists, email support.karmayogi@gov.in with your email ID and other details.',
    category: 'getting_access',
    tag: 'learning-certificates',
  },
  {
    id: '3',
    question: 'I am not receiving the OTP, what should I do?',
    answer: 'Try these steps in order:<br>1. Check your spam / junk folder, government IT systems often filter external emails.<br>2. Switch to mobile OTP: on the login page, choose \'Login with OTP\' and enter your mobile number instead.<br>3. If your department blocks external email delivery, ask your IT team to whitelist noreply@igotkarmayogi.gov.in.<br>4. Still not receiving ? email support.karmayogi@gov.in with your email ID and other details.',
    category: 'getting_access',
    tag: 'learning-certificates',
  },
  {
    id: '4',
    question: 'My organisation / department is not showing in the dropdown during registration',
    answer: 'Your MDO may not yet be set up on the platform. Steps:<br>1. Search using alternate spellings or short forms of your department name.<br>2. If not found, contact your MDO Leader/ Admin and ask them to add your organisation.<br>3. Alternatively, e email support.karmayogi@gov.in with your email ID and other details.',
    category: 'getting_access',
    tag: 'learning-certificates',
  },
  {
    id: '5',
    question: 'I forgot my password, how do I reset it?',
    answer: 'Steps to reset your password:<br>1. Go to igotkarmayogi.gov.in and click \'Login\'.<br>2. Choose \'Login with password\' and click \'Forgot Password\'.<br>3. Enter your registered email ID and click Reset.<br>4. Enter the OTP sent to your email and set a new password.<br>Note: If you are not receiving the OTP, switch to \'Login with OTP\' using your mobile number instead.',
    category: 'logging_in',
    tag: 'logging_in',
  },
  {
    id: '6',
    question: 'My account is locked / I am seeing \'Access Denied\' when I try to login',
    answer: 'Access Denied usually means your account transfer is pending or your orgainization has marked you as "not my user" . Steps:<br>1. If you recently requested a department transfer, the transfer must be approved by the MDO leader before you can log in.<br>2. Contact your MDO Admin to check your account status.<br>3. If the issue persists, Alternatively, email support.karmayogi@gov.in with your email ID and other details.',
    category: 'logging_in',
    tag: 'logging_in',
  },
  {
    id: '7',
    question: 'What is Parichay login and when should I use it?',
    answer: 'Parichay is the Government of India\'s single sign- on system for civil servants.Use Parichay login if you have an official government email ID ending in gov.in or nic.in, it lets you log in without a separate iGOT password.If you don\'t have a Parichay account, use the \'Login with OTP\' option on your mobile number.',
    category: 'logging_in',
    tag: 'logging_in',
  },
  {
    id: '8',
    question: 'My name or designation is wrong on my profile, how do I fix it?',
    answer: 'Steps:<br>1. Log in and click on your profile icon(top right).<br>2. Go to \'Edit Profile\' and update your name or designation.<br>3. Save changes, your profile will be updated within a few minutes.<br>Note: If your name is wrong on a certificate you already downloaded, re- download the certificate after updating your profile.',
    category: 'profile_setup',
    tag: 'profile_setup',
  },
  {
    id: '9',
    question: 'My course is stuck at 90–99% and won\'t show as complete, why?',
    answer: 'The course only marks as 100% complete after you pass the final assessment. Steps:<br>1. Scroll to the end of the course content and look for the \'Assessment\' or \'Quiz\' section.<br>2. Attempt and pass the assessment(note the minimum passing score shown).<br>3. Once passed, the course will update to \'Completed\' within a few minutes.<br>If you have already passed and it still shows in-progress after 1 hour, raise a support ticket.',
    category: 'learning',
    tag: 'learning',
  },
  {
    id: '10',
    question: 'I passed the assessment but the course still shows \'In Progress\'',
    answer: 'This is usually a sync delay. Steps:<br>1. Log out and log back in, this refreshes your completion status.<br>2. If it still shows In Progress after 2 hours, go to \'My Courses\' and check if the certificate is available(the course may be complete even if the status hasn\'t updated).<br>3. If neither works after 2 hours, email support.karmayogi@gov.in with your email ID and other details.',
    category: 'learning',
    tag: 'learning',
  },
  {
    id: '11',
    question: 'The assessment answers are not being accepted / the quiz keeps refreshing',
    answer: 'Steps to try:<br>1. Use Google Chrome on a desktop/ laptop, the platform works best on Chrome.<br>2. Clear your browser cache(Ctrl + Shift + Delete) and reload the page.<br>3. Disable any browser extensions(especially ad blockers).<br>4. If the question content itself appears wrong(wrong answers, incorrect options), contact your MDO Admin, this is a content issue that needs to be fixed by the course provider.',
    category: 'learning',
    tag: 'learning',
  },
  {
    id: '12',
    question: 'My certificate has not been generated, what should I do?',
    answer: 'Certificate generation requires passing the final assessment. Check:<br>1. Confirm the course shows \'100% Completed\' in My Courses.<br>2. Go to My Courses → select the course → click \'Certificate\'.<br>3. If not available after 30 minutes of completion, log out and log in again.<br>4. If still not available after 2 hours, email support.karmayogi@gov.in with your email ID and other details.',
    category: 'certificates',
    tag: 'certificates',
  },
  {
    id: '13',
    question: 'My name or designation is wrong on the certificate',
    answer: 'Certificates reflect your profile data at the time of completion. Steps:<br>1. Update your name/ designation in your profile(Edit Profile).<br>2. Re - download the certificate, it should now show the correct details.<br>3. For certificates already shared or submitted officially, raise a support ticket to get a corrected copy issued.',
    category: 'certificates',
    tag: 'certificates',
  },
  {
    id: '14',
    question: 'The iGOT app is crashing or not opening on my phone',
    answer: 'Steps:<br>1. Force - close the app and reopen it.<br>2. Check if an update is available on the Play Store(Android) or App Store(iOS) and install it.<br>3. Clear the app\'s cache: Settings → Apps → iGOT Karmayogi → Clear Cache.<br>4. If still not working, email support.karmayogi@gov.in with your email ID and other details.<br>',
    category: 'mobile_app',
    tag: 'mobile_app',
  },
]

export const HOW_TO_GUIDES_MAP: Record<RoleTab, HowToGuide[]> = {
  learner: HOW_TO_GUIDES,

  'mdo-leader': [
    {
      id: '1',
      title: 'User Onboarding Manual for MDOs',
      titleHindi: 'पदनाम मास्टर गाइड',
      description: 'Step by Step Guide for User Onboarding Manual for MDOs ',
      thumbnail: '',
      category: 'user_onboarding',
      pdfUrl: 'assets/help-pdf/MDO/USER ONBOARDING MANUAL NOV 2025 (3).pdf',
    },
    {
      id: '2',
      title: 'How to create / update Designation Master',
      titleHindi: 'क्षमता भूमिका मैपिंग गाइड',
      description: 'Step by Step Guide to How to create / update Designation Master',
      thumbnail: '',
      category: 'user_onboarding',
      pdfUrl: 'assets/help-pdf/MDO/How to create or, update Designation Master for MDO_v082025.pdf',
    },
    {
      id: '3',
      title: 'How to mark Not My User in MDO',
      titleHindi: 'क्षमता भूमिका मैपिंग गाइड',
      description: 'Step by Step Guide to How to mark Not My User in MDO',
      thumbnail: '',
      category: 'user_onboarding',
      pdfUrl: 'assets/help-pdf/MDO/How to mark not my users.pdf',
    },
    {
      id: '4',
      title: 'How to map roles & competencies to designations',
      titleHindi: 'क्षमता भूमिका मैपिंग गाइड',
      description: 'Step by Step Guide to How to map roles & competencies to designations',
      thumbnail: '',
      category: 'user_management',
      pdfUrl: 'assets/help-pdf/MDO/How to map role & competency in MDO.pdf',
    },
    {
      id: '5',
      title: 'How to transfer Users',
      titleHindi: 'क्षमता भूमिका मैपिंग गाइड',
      description: 'Step by Step Guide to How to transfer Users',
      thumbnail: '',
      category: 'user_management',
      pdfUrl: 'assets/help-pdf/MDO/How to transfer Users.pdf',
    },
    {
      id: '6',
      title: 'How can MDO\'s can create Event on iGOT',
      titleHindi: 'क्षमता भूमिका मैपिंग गाइड',
      description: 'Step by Step Guide to How can MDO\'s can create Event on iGOT',
      thumbnail: '',
      category: 'event',
      pdfUrl: 'assets/help-pdf/MDO/HOW CAN MDOs CREATE AN EVENT ON iGOT.pdf',
    },
    {
      id: '7',
      title: 'Comprehensive Assessment Manual',
      titleHindi: 'क्षमता भूमिका मैपिंग गाइड',
      description: 'Comprehensive Assessment Manual',
      thumbnail: '',
      category: 'comprehensive_assessment',
      pdfUrl: 'assets/help-pdf/MDO/COMPREHENSIVE ASSESSMENT MANUAL - Jan 26.pdf',
    }
    // 👇 add remaining 6 guides like your screenshot
  ],

  'content-building': [
    {
      id: '1',
      title: 'CBP Content Dashboard Guide',
      description: 'Navigate the CBP Dashboard to view KPIs.',
      thumbnail: '',
      category: 'dashboard',
      pdfUrl: 'assets/help-pdf/Content/How to use CBP dashboard.pdf',
    },
  ],
}

export const VIDEO_TUTORIALS_MAP: Record<RoleTab, VideoTutorial[]> = {
  learner: VIDEO_TUTORIALS,
  'mdo-leader': [
    {
      id: '1',
      title: 'How to create My iGOT',
      date: 'Aug 29, 2025',
      thumbnail: 'https://img.youtube.com/vi/C-cODooEZXQ/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/C-cODooEZXQ',
      category: 'user_management',
    },
    {
      id: '2',
      title: 'Looker walkthrough video',
      date: 'Aug 26, 2025',
      thumbnail: 'https://img.youtube.com/vi/tTjAAG-tuFM/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/tTjAAG-tuFM',
      category: 'dashboard_analytics',
    },
    {
      id: '3',
      title: 'APAR Comprehensive Assessment',
      date: 'Jan 20, 2026',
      thumbnail: 'https://img.youtube.com/vi/CLtEUI2-1u0/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/CLtEUI2-1u0?si=Ibdm7MWUEIbMSoHd',
      category: 'my_igot_apar',
    },
    {
      id: '4',
      title: 'User Management',
      date: 'Feb 6, 2025',
      thumbnail: 'https://img.youtube.com/vi/7hkP_aBVLsE/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/7hkP_aBVLsE?si=b-avK2Dyd9i9dM4Z',
      category: 'user_management',
    },
    {
      id: '5',
      title: 'SPARROW - APAR integration',
      date: 'Mar 18, 2026',
      thumbnail: 'https://img.youtube.com/vi/gSMSuFib2n8/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/gSMSuFib2n8?si=r2l0_tJG0Sjr1A_M',
      category: 'sparrow_integration',
    },
    {
      id: '6',
      title: 'Access MDO Dashboard (Looker)',
      date: 'Aug 28, 2025',
      thumbnail: 'https://img.youtube.com/vi/tTjAAG-tuFM/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/tTjAAG-tuFM?si=Bzunoa-BoAmL9-Nk',
      category: 'dashboard_analytics',
    },
    {
      id: '7',
      title: 'How to Create My iGOT with APAR',
      date: 'Aug 29, 2025',
      thumbnail: 'https://img.youtube.com/vi/C-cODooEZXQ/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/C-cODooEZXQ?si=EznuDWSV5yxG6tSW',
      category: 'my_igot_apar',
    },

  ], // add later
  'content-building': [
    {
      id: '1',
      title: 'Walkthrough Video',
      date: 'May 2, 2025',
      thumbnail: 'https://img.youtube.com/vi/dnWNo8OMwuQ/hqdefault.jpg',
      youtubeUrl: 'https://youtu.be/dnWNo8OMwuQ?si=AZmlrWgBFvyiBBj0',
      category: 'walkthrough_video',
    },
  ], // add later
}

export const FAQ_ITEMS_MAP: Record<RoleTab, FaqItem[]> = {
  learner: FAQ_ITEMS,
  'mdo-leader': [
    {
      id: '1',
      question: 'A user says they cannot see themselves in my MDO, how do I find or fix this?',
      answer: 'Steps:<br>1. Log into the MDO portal and go to Users → All Users.<br>2. Search by the user\'s email ID or name.<br>3. If found but marked \'Not My User\': click Edit and change their status.<br>4. If not found at all: the user may have registered under a different organisation.Ask them to raise a transfer request from their profile.<br>5. If the user hasn\'t registered yet, share the department registration link/QR code with them.',
      category: 'user_onboarding',
      tag: 'learning-certificates',
    },
    {
      id: '2',
      question: 'How does the SPARROW APAR integration work on iGOT?',
      answer: 'iGOT is integrated with SPARROW for APAR (Annual Performance Appraisal Report) tracking. Course completions on iGOT are automatically synced to the officer\'s APAR record in SPARROW.Key points:<br>1. The sync happens daily, completions show in SPARROW within 24 hours.<br>2. Only courses tagged as \'APAR-linked\' in My iGOT contribute to APAR.<br>3. MDO Leaders need to set up the My iGOT plan and link it to APAR for this to work.<br>Watch the SPARROW APAR integration video for the setup walkthrough.',
      category: 'assessment_apar',
      tag: 'learning-certificates',
    },
  ],
  'content-building': [],
}


export const stateContacts = {
  'Andhra Pradesh': { region: 'south', admins: [{ name: 'Ravi Kumar Reddy', designation: 'State Nodal Officer', email: 'rk.reddy@ap.gov.in', mobile: '+91 94401 23456' }, { name: 'Sunitha Rao', designation: 'Deputy Director IT', email: 'sunitha.rao@ap.gov.in', mobile: '+91 94402 34567' }] },
  'Arunachal Pradesh': { region: 'northeast', admins: [{ name: 'Tage Ado', designation: 'State Nodal Officer', email: 'tage.ado@arunachal.gov.in', mobile: '+91 94403 45678' }] },
  'Assam': { region: 'northeast', admins: [{ name: 'Bhaskar Jyoti Das', designation: 'State IT Coordinator', email: 'bj.das@assam.gov.in', mobile: '+91 94404 56789' }, { name: 'Priyanka Kalita', designation: 'Admin Officer', email: 'p.kalita@assam.gov.in', mobile: '+91 94405 67890' }] },
  'Bihar': { region: 'east', admins: [{ name: 'Amit Kumar Singh', designation: 'State Nodal Officer', email: 'ak.singh@bihar.gov.in', mobile: '+91 94406 78901' }, { name: 'Rekha Devi', designation: 'IT Manager', email: 'rekha.devi@bihar.gov.in', mobile: '+91 94407 89012' }] },
  'Chhattisgarh': { region: 'central', admins: [{ name: 'Deepak Yadav', designation: 'State Coordinator', email: 'deepak.yadav@cg.gov.in', mobile: '+91 94408 90123' }] },
  'Goa': { region: 'west', admins: [{ name: 'Suresh Naik', designation: 'State Nodal Officer', email: 's.naik@goa.gov.in', mobile: '+91 94412 34567' }] },
  'Gujarat': { region: 'west', admins: [{ name: 'Nilesh Patel', designation: 'State Nodal Officer', email: 'nilesh.patel@gujarat.gov.in', mobile: '+91 94413 45678' }, { name: 'Hiral Shah', designation: 'IT Coordinator', email: 'hiral.shah@gujarat.gov.in', mobile: '+91 94414 56789' }] },
  'Haryana': { region: 'north', admins: [{ name: 'Rajesh Hooda', designation: 'State Nodal Officer', email: 'r.hooda@haryana.gov.in', mobile: '+91 94415 67890' }, { name: 'Poonam Yadav', designation: 'Deputy Director', email: 'poonam.yadav@haryana.gov.in', mobile: '+91 94416 78901' }] },
  'Himachal Pradesh': { region: 'north', admins: [{ name: 'Vikas Thakur', designation: 'State IT Officer', email: 'vikas.thakur@hp.gov.in', mobile: '+91 94417 89012' }] },
  'Jharkhand': { region: 'east', admins: [{ name: 'Sanjay Mahto', designation: 'State Coordinator', email: 's.mahto@jharkhand.gov.in', mobile: '+91 94418 90123' }, { name: 'Anita Kumari', designation: 'IT Officer', email: 'anita.kumari@jharkhand.gov.in', mobile: '+91 94419 01234' }] },
  'Karnataka': { region: 'south', admins: [{ name: 'Chandrashekar M', designation: 'State Nodal Officer', email: 'cshekhar@karnataka.gov.in', mobile: '+91 94420 12345' }, { name: 'Nandini R', designation: 'Programme Manager', email: 'nandini.r@karnataka.gov.in', mobile: '+91 94421 23456' }] },
  'Kerala': { region: 'south', admins: [{ name: 'Sreekumar P', designation: 'State Nodal Officer', email: 'sreekumar.p@kerala.gov.in', mobile: '+91 94422 34567' }, { name: 'Bindhu T', designation: 'IT Coordinator', email: 'bindhu.t@kerala.gov.in', mobile: '+91 94423 45678' }] },
  'Madhya Pradesh': { region: 'central', admins: [{ name: 'Ramesh Tiwari', designation: 'State Nodal Officer', email: 'r.tiwari@mp.gov.in', mobile: '+91 94424 56789' }, { name: 'Kavita Joshi', designation: 'Admin Officer', email: 'kavita.joshi@mp.gov.in', mobile: '+91 94425 67890' }] },
  'Maharashtra': { region: 'west', admins: [{ name: 'Sunil Patil', designation: 'State IT Head', email: 's.patil@maharashtra.gov.in', mobile: '+91 94426 78901' }, { name: 'Madhuri Kulkarni', designation: 'Programme Officer', email: 'm.kulkarni@maharashtra.gov.in', mobile: '+91 94427 89012' }, { name: 'Vivek Desai', designation: 'Technical Officer', email: 'v.desai@maharashtra.gov.in', mobile: '+91 94428 90123' }] },
  'Manipur': { region: 'northeast', admins: [{ name: 'Kh. Rajkumar', designation: 'State Nodal Officer', email: 'kh.rajkumar@manipur.gov.in', mobile: '+91 94429 01234' }] },
  'Meghalaya': { region: 'northeast', admins: [{ name: 'Banshanbor Lyngdoh', designation: 'State Coordinator', email: 'b.lyngdoh@meghalaya.gov.in', mobile: '+91 94430 12345' }] },
  'Mizoram': { region: 'northeast', admins: [{ name: 'Lalramliana', designation: 'State IT Officer', email: 'lalramliana@mizoram.gov.in', mobile: '+91 94431 23456' }] },
  'Nagaland': { region: 'northeast', admins: [{ name: 'Zhoto Mere', designation: 'State Nodal Officer', email: 'z.mere@nagaland.gov.in', mobile: '+91 94432 34567' }] },
  'Odisha': { region: 'east', admins: [{ name: 'Biswaranjan Sahoo', designation: 'State Nodal Officer', email: 'b.sahoo@odisha.gov.in', mobile: '+91 94433 45678' }, { name: 'Saumya Dash', designation: 'IT Coordinator', email: 's.dash@odisha.gov.in', mobile: '+91 94434 56789' }] },
  'Punjab': { region: 'north', admins: [{ name: 'Jaspreet Singh', designation: 'State IT Officer', email: 'j.singh@punjab.gov.in', mobile: '+91 94435 67890' }, { name: 'Harpreet Kaur', designation: 'Admin Officer', email: 'h.kaur@punjab.gov.in', mobile: '+91 94436 78901' }] },
  'Rajasthan': { region: 'north', admins: [{ name: 'Mahesh Sharma', designation: 'State Nodal Officer', email: 'm.sharma@rajasthan.gov.in', mobile: '+91 94437 89012' }, { name: 'Sunita Meena', designation: 'IT Coordinator', email: 's.meena@rajasthan.gov.in', mobile: '+91 94438 90123' }] },
  'Sikkim': { region: 'northeast', admins: [{ name: 'Pema Wangchuk', designation: 'State Coordinator', email: 'p.wangchuk@sikkim.gov.in', mobile: '+91 94439 01234' }] },
  'Tamil Nadu': { region: 'south', admins: [{ name: 'Senthil Kumar R', designation: 'State Nodal Officer', email: 'senthil.r@tn.gov.in', mobile: '+91 94440 12345' }, { name: 'Kavitha S', designation: 'Programme Manager', email: 'kavitha.s@tn.gov.in', mobile: '+91 94441 23456' }, { name: 'Muthukumar P', designation: 'Technical Officer', email: 'muthukumar.p@tn.gov.in', mobile: '+91 94442 34567' }] },
  'Telangana': { region: 'south', admins: [{ name: 'Shiva Reddy', designation: 'State Nodal Officer', email: 'shiva.reddy@telangana.gov.in', mobile: '+91 94443 45678' }, { name: 'Anuradha K', designation: 'IT Coordinator', email: 'anuradha.k@telangana.gov.in', mobile: '+91 94444 56789' }] },
  'Tripura': { region: 'northeast', admins: [{ name: 'Subrata Deb', designation: 'State IT Officer', email: 's.deb@tripura.gov.in', mobile: '+91 94445 67890' }] },
  'Uttar Pradesh': { region: 'north', admins: [{ name: 'Alok Pandey', designation: 'State Nodal Officer', email: 'a.pandey@up.gov.in', mobile: '+91 94446 78901' }, { name: 'Neha Srivastava', designation: 'Programme Officer', email: 'n.srivastava@up.gov.in', mobile: '+91 94447 89012' }, { name: 'Rakesh Mishra', designation: 'IT Manager', email: 'r.mishra@up.gov.in', mobile: '+91 94448 90123' }] },
  'Uttarakhand': { region: 'north', admins: [{ name: 'Dinesh Bhatt', designation: 'State Coordinator', email: 'd.bhatt@uk.gov.in', mobile: '+91 94449 01234' }, { name: 'Mamta Rawat', designation: 'IT Officer', email: 'm.rawat@uk.gov.in', mobile: '+91 94450 12345' }] },
  'West Bengal': { region: 'east', admins: [{ name: 'Arnab Banerjee', designation: 'State Nodal Officer', email: 'a.banerjee@wb.gov.in', mobile: '+91 94451 23456' }, { name: 'Parna Ghosh', designation: 'IT Coordinator', email: 'p.ghosh@wb.gov.in', mobile: '+91 94452 34567' }] },
  // Union Territories
  'Andaman & Nicobar': { region: 'ut', admins: [{ name: 'Rajiv Sharma', designation: 'UT Nodal Officer', email: 'r.sharma@andaman.gov.in', mobile: '+91 94453 12345' }] },
  'Chandigarh': { region: 'ut', admins: [{ name: 'Simranjit Kaur', designation: 'UT IT Officer', email: 's.kaur@chandigarh.gov.in', mobile: '+91 94454 23456' }] },
  'D&N Haveli & Daman': { region: 'ut', admins: [{ name: 'Praful Patel', designation: 'UT Coordinator', email: 'p.patel@dnh.gov.in', mobile: '+91 94455 34567' }] },
  'Delhi (NCT)': { region: 'ut', admins: [{ name: 'Anjali Sharma', designation: 'Senior IT Officer', email: 'anjali.sharma@delhi.gov.in', mobile: '+91 94409 01234' }, { name: 'Mohit Gupta', designation: 'Technical Lead', email: 'mohit.gupta@delhi.gov.in', mobile: '+91 94410 12345' }] },
  'Jammu & Kashmir': { region: 'ut', admins: [{ name: 'Farooq Ahmad', designation: 'UT Nodal Officer', email: 'farooq.a@jk.gov.in', mobile: '+91 94456 45678' }, { name: 'Sunita Devi', designation: 'IT Coordinator', email: 'sunita.d@jk.gov.in', mobile: '+91 94457 56789' }] },
  'Ladakh': { region: 'ut', admins: [{ name: 'Stanzin Norbu', designation: 'UT IT Officer', email: 's.norbu@ladakh.gov.in', mobile: '+91 94458 67890' }] },
  'Lakshadweep': { region: 'ut', admins: [{ name: 'P.K. Pasha', designation: 'UT Coordinator', email: 'pk.pasha@lakshadweep.gov.in', mobile: '+91 94459 78901' }] },
  'Puducherry': { region: 'ut', admins: [{ name: 'Anand Rajan', designation: 'UT Nodal Officer', email: 'a.rajan@puducherry.gov.in', mobile: '+91 94460 89012' }] },
}

export const utStates = new Set(['Andaman & Nicobar', 'Chandigarh', 'D&N Haveli & Daman', 'Delhi (NCT)', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'])


export const VIDEO_CATEGORIES_MAP: Record<RoleTab, Category[]> = {
  learner: VIDEO_CATEGORIES,
  'mdo-leader': VIDEO_MDO_CATEGORIES,
  'content-building': VIDEO_CBP_CATEGORIES,
}

export const GUIDE_CATEGORIES_MAP: Record<RoleTab, Category[]> = {
  learner: GUIDE_CATEGORIES,
  'mdo-leader': GUIDE_MDO_CATEGORIES,
  'content-building': GUIDE_CBP_CATEGORIES,
}

export const FAQ_CATEGORIES_MAP: Record<RoleTab, Category[]> = {
  learner: FAQ_CATEGORIES,
  'mdo-leader': FAQ_MDP_CATEGORIES, // add later
  'content-building': [], // add later
}