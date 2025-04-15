import { AfterViewChecked, Component,ElementRef,Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ConfigurationsService, EventService, WsEvents } from '@sunbird-cb/utils-v2';
import { RootService } from 'src/app/component/root/root.service';
import { environment } from 'src/environments/environment';
import { WebSocketService } from './socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'viewer-ai-tutor',
  templateUrl: './ai-tutor.component.html',
  styleUrls: ['./ai-tutor.component.scss']
})
export class AiTutorComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() from = ''
  @Input() content:any
  @Input() userJourney = []
  showIcon = true
  categories: any[] = []
  language: any[] = []
  currentFilter = 'information'
  selectedLaguage = 'en'

  responseData: any
  userInfo: any
  recomendedQns: any = {}
  questionsAndAns: any = {}
  userIcon = ''
  more = false
  chatInformation: any = []
  chatIssues: any = []
  displayLoader = false
  expanded = false
  callText = ''
  emailText = ''
  searchQueryAItutor: any = ''
  initials:any
  copiedIndex = -1
  public circleColor!: string
  random = Math.random().toString(36).slice(2)
  

  // tslint:disable
  localization: any = {
    'en' : {
      'Hi' : 'Namaste',
      'information': 'Information',
      'issue': 'Issues',
      'categories': 'Show All Categories',
      'showmore': 'Show More'
    },
    'hi' : {
      'Hi' : 'नमस्ते',
      'information': 'जानकारी',
      'issue': 'समस्या',
      'categories': 'सभी कैटगोरी दिखायें',
      'showmore': 'और दिखाओ'

    }
  }

  private colors = [
    '#EB7181', // red
    '#306933', // green
    '#000000', // black
    '#3670B2', // blue
    '#4E9E87',
    '#7E4C8D',
  ]

  private randomcolors = [
    '#EB7181', // red
    '#006400', // green
    '#000000', // black
    '#3670B2', // blue
    '#4E9E87',
    '#7E4C8D',
  ]

  aiTutorResult:any

  private messageSubscription: Subscription | undefined;
  public messages: string[] = [];
  public inputMessage: string = '';

  aiTutorResultArr:any = []
  // tslint: enable
  @ViewChild('scrollMe') private myScrollContainer: ElementRef | undefined
  isHubEnable!: boolean
  learningStyle = [
    { title: 'None', subtitle: 'You can also choose a learning style that suits you best from here.' },
    { title: 'Socratic Style', subtitle: 'Explore ideas through thoughtful questions.' },
    { title: 'Storytelling', subtitle: 'Learn through relatable narratives and real-life examples.' },
  ]
  selectedLearningStyle :any
  constructor(
    private configSvc: ConfigurationsService,
    private eventSvc: EventService,
    private renderer: Renderer2,
    private chatbotService: RootService,
    private websocketService: WebSocketService,
    private router: Router) { 
      this.selectedLearningStyle = this.learningStyle[0]
    }

  ngOnInit() {
    console.log('content', this.content)
    this.websocketService.connect('ws://learning-ai.karmayogibharat.net:3001/ws');
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        //certificate link check
        this.isHubEnable = (event.url.includes('/certs') || event.url.includes('/public/certs')) ? false : true;
      }
    })
    this.userInfo = this.configSvc && this.configSvc.userProfile
    // this.aiGlobalSearch()
    this.checkForApiCalls()
    this.enableScroll()
    // tslint:disable-next-line: max-line-length
    this.userIcon = this.userInfo && this.userInfo.profileImage ? this.userInfo.profileImage : ''
    if(!this.userInfo.profileImage && this.userInfo && this.userInfo.firstName) {
      this.createInititals(this.userInfo.firstName)
    }
    const email = environment.supportEmail || 'mission.karmayogi@gov.in'
    this.callText = `<a class='hint-text' target='_blank' href='https://bit.ly/44MJlo4'>Teams Call</a>&nbsp;`
    this.emailText = `<a class='hint-text' target='_blank' href='mailto:${email}'>${email}.</a>`
  }

  greetings() {
    return this.localization[this.selectedLaguage]['Hi'] || 'Hi'
  }

  getInfoText(label: string) {
    return this.localization[this.selectedLaguage][label] || label
  }

  showMore() {
    return this.localization[this.selectedLaguage]['showmore'] || 'Show More'
  }

  getData() {
    const lang: any = {
      information: 'IN',
      issue: 'IS'
    }
    const tabType: any = {
      lang: this.selectedLaguage,
      config_type: lang[this.currentFilter]
    }
    this.displayLoader = true
    this.chatbotService.getChatData(tabType).subscribe((res: any) => {
      if (res && res.payload && res.payload.config) {
        this.setDataToLocalStorage(res.payload.config)
        this.checkForApiCalls()
        // this.initData(res.payload.config)
        this.displayLoader = false
      }
    })
  }
  setDataToLocalStorage(data: any) {
    let localObject: any = {}
    localObject = JSON.parse(localStorage.getItem('faq')|| '{}')
    localObject[this.selectedLaguage] = {...localObject[this.selectedLaguage], [this.currentFilter] : data}
    localStorage.setItem('faq', JSON.stringify(localObject))
    this.toggleFilter(this.currentFilter === 'information' ? 'information': this.currentFilter)
  }

  initData(getData: any) {
    // tslint:disable-next-line
    console.log(getData)
    this.userJourney = []
    let userDetails: any = {
      type: 'incoming',
      message: '', //` Hi ${this.userInfo && this.userInfo.firstName || ''}, I'm KarmaSahayogi - Digital Assistant, I'm here to help you.`,
      recommendedQues: this.getPriorityQuestion(1),
      selectedValue: '',
      title: '',//'Here are the most frequently asked questions users have looked for',
      tab: 'information',
    }

    this.pushData(userDetails)
    // this.pushData(userDetailsForIssues)
    this.getQns()
  }
  getQns() {
    this.responseData.quesMap.map((q: any) => {
      this.questionsAndAns[q.quesId] = q
    })
  }

  selectLaguage(event: any) {
    this.selectedLaguage = event.target.value
    localStorage.setItem('selectedLanguage', event.target.value)
    this.chatInformation=[]
    this.chatIssues = []
    this.checkForApiCalls()
  }

  readFromLocalStorage() {
    let localStg: any = localStorage.getItem('result')
    if (localStg) {
      if (this.currentFilter === 'information') {
        this.responseData = JSON.parse(localStg)[this.selectedLaguage].information
      } else {
        this.responseData = JSON.parse(localStg)[this.selectedLaguage].issue
      }
    }
  }

  goToBottom() {
    window.scrollTo(0, document.body.scrollHeight)
  }

  iconClick(type: string) {
    this.showIcon = !this.showIcon
    this.currentFilter = 'information'
    this.expanded = false
    if (type === 'start') {
      this.disableScroll()
      this.raiseChatStartTelemetry()
      // this.toggleFilter(this.currentFilter)
    } else {
      this.raiseChatEndTelemetry()
      this.userJourney = []
      this.chatInformation = []
      this.chatIssues = []
      this.selectedLaguage = 'en'
      this.currentFilter = 'information'
      this.checkForApiCalls()
      this.more = false
      this.enableScroll()
    }
  }

  toggleFilter(tab: string) {
    this.currentFilter = tab
    this.checkForApiCalls()
    this.more = false
  }

  selectedQuestion(question: any, data: any) {
    data.selectedValue = question.quesID
    const sendMsg = {
      type: 'sendMsg',
      question: this.questionsAndAns[question.quesID].quesValue,
      tab: this.currentFilter,
    }

    const incomingMsg = {
      type: 'incoming',
      // tslint:disable-next-line:max-line-length
      message: this.questionsAndAns[question.quesID].ansVal.replace('<teams_call_link>', this.callText).replace('<email_configuration>', this.emailText),
      recommendedQues: question.recommendedQues || [],
      title: '', // 'Questions related to',
      relatedQes: 'above Question',
      tab: this.currentFilter,
    }
    this.pushData(sendMsg)
    this.pushData(incomingMsg)
    this.raiseTemeletyInterat(question.quesID)
  }

  pushData(msg: any) {
    this.userJourney = []
    if (this.currentFilter === 'information') {
      this.chatInformation.push(msg)
      this.userJourney = this.chatInformation
    } else {
      this.chatIssues.push(msg)
      this.userJourney = this.chatIssues
    }
  }

  getuserjourney(tab: string) {
    return this.userJourney.filter((j: any) => j.tab === tab)
  }

  getPriorityQuestion(priority: any) {
    const recommendedQues: any[] = []
    const isLogedIn: string = this.userInfo ? 'Logged-In' : 'Not Logged-In'
    this.responseData.recommendationMap.map((question: any) => {
      question.recommendedQues.map((ques: any)=> {
        if (ques.priority === priority && (question.categoryType === isLogedIn || question.categoryType === 'Both')) {
          recommendedQues.push(ques)
        }
      })
    })
    return recommendedQues
  }

  showMoreQuestion() {
    const showMoreQes: any = {
      type: 'incoming',
      message: '',
      recommendedQues: this.getPriorityQuestion(1),
      selectedValue: '',
      title: '', //'Showing more questions',
    }
    this.pushData(showMoreQes)
  }

  showCategory(catItem: any) {
    let incomingMsg = {
      type: 'category',
      message: '',
      recommendedQues: [],
      title: '', //' What do you want to know under',
      relatedQes: `${catItem.catName}?`,
      tab: this.currentFilter,
    }
    this.more= false
    if (catItem.catId === 'all') {
      incomingMsg.title = '', // 'Here is the list of all the topics'
      incomingMsg.relatedQes = ''
      incomingMsg.recommendedQues = this.sortCategory()
    } else {
      this.responseData.recommendationMap.forEach((element: any) => {
        if (catItem.catId === element.catId) {
          incomingMsg.type = 'incoming',
          incomingMsg.recommendedQues = element.recommendedQues
        }
      })
      this.raiseCategotyTelemetry(catItem.catId)
    }
    const sendMsg = {
      type: 'sendMsg',
      question: catItem.catName,
    }
    this.pushData(sendMsg)
    this.pushData(incomingMsg)
  }

  raiseCategotyTelemetry(catItem: string) {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: 'click', id: catItem },
        object: { id: catItem, type: 'Category' },
        state: WsEvents.EnumTelemetrySubType.Interact,
        eventSubType: WsEvents.EnumTelemetrySubType.Chatbot,
        mode: 'view',
      },
      pageContext: {pageId: '/chatbot', module: 'Assistant'},
      from: '',
      to: 'Telemetry',
    }
    this.eventSvc.dispatchChatbotEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseChatStartTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: '' },
        object: { type: 'zse', id: 'asd'},
        state: WsEvents.EnumTelemetrySubType.Loaded,
        eventSubType: WsEvents.EnumTelemetrySubType.Chatbot,
        type: 'session',
        mode: 'view',
      },
      pageContext: { pageId: '/chatbot', module: 'Assistant' },
      from: '',
      to: 'Telemetry',
    }
    this.eventSvc.dispatchChatbotEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseChatEndTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: '' },
        object: {},
        state: WsEvents.EnumTelemetrySubType.Unloaded,
        eventSubType: WsEvents.EnumTelemetrySubType.Chatbot,
        type: 'session',
        mode: 'view',
      },
      pageContext: { pageId: '/chatbot', module: 'Assistant' },
      from: '',
      to: 'Telemetry',
    }
    this.eventSvc.dispatchChatbotEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseTemeletyInterat(idn: string) {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: 'click', id: idn },
        object: {id: idn, type: this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1)},
        state: WsEvents.EnumTelemetrySubType.Interact,
        eventSubType: WsEvents.EnumTelemetrySubType.Chatbot,
        mode: 'view'
      },
      pageContext: { pageId: '/chatbot', module: 'Assistant' },
      from: '',
      to: 'Telemetry',
    }
    this.eventSvc.dispatchChatbotEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  checkForAIQuestionResponse() {

  }

  checkForApiCalls() {
    this.selectedLaguage = localStorage.getItem('selectedLanguage') || 'en'
    let localStg: any = JSON.parse(localStorage.getItem('faq') || '{}')
    let languageStg: any = JSON.parse(localStorage.getItem('faq-languages') || '{}')
    if (languageStg.length > 0) {
      this.language = languageStg
    } else {
      this.getLanguages()
    }

    if (localStg && languageStg) {
      if (localStg[this.selectedLaguage] && localStg[this.selectedLaguage][this.currentFilter]) {
        const localStorageData = localStg[this.selectedLaguage][this.currentFilter]
        this.userJourney = []
        if (this.currentFilter === 'information') {
          if (this.chatInformation.length === 0) {
            this.responseData = localStorageData
            this.initData(localStorageData)
          } else {
            this.responseData = localStorageData
            this.userJourney = this.chatInformation
          }
        } else {
          if (this.chatIssues.length === 0) {
            this.responseData = localStorageData
            this.initData(localStorageData)
          } else {
            this.responseData = localStorageData
            this.userJourney = this.chatIssues
          }
        }
        this.getQns()
        this.getCategories()
      } else {
        this.getLanguages()
        // this.getData()
      }
    }
  }
  getCategories() {
    this.categories = [{ catId: 'all', catName: this.localization[this.selectedLaguage]['categories'], priority: 0 }]
    const categories: any = []
    const isLogedIn: string = this.userInfo ? 'Logged-In' : 'Not Logged-In'
    this.responseData.recommendationMap.map((catandques: any) => {
      this.responseData.categoryMap.map((cat: any) => {
        if (catandques.catId === cat.catId && (catandques.categoryType === isLogedIn || catandques.categoryType === 'Both')) {
          const category = {
            catId: cat.catId,
            catName: cat.catName,
            priority: catandques.priority,
            categoryType: catandques.categoryType,
          }
          categories.push(category)
        }
      })
    })
    if (categories.length < 6) {
      this.categories = categories
    } else {
      this.categories = [...this.categories, ...categories]
    }
  }
  sortCategory(): any {
    // tslint:disable-next-line: max-line-length
    return this.categories.sort((a: any, b: any) => a['priority'] > b['priority'] ? 1 : a['priority'] === b['priority'] ? 0 : -1)
  }

  getLanguages() {
    this.displayLoader = true
    this.chatbotService.getLangugages().subscribe((resp: any) => {
      if (resp && resp.status && resp.status.code === 200) {
        this.language = resp.payload.languages
        localStorage.setItem('faq-languages', JSON.stringify(resp.payload.languages))
        localStorage.setItem('selectedLanguage', this.selectedLaguage)
        this.getData()
        this.displayLoader = false
      }
    })
  }

  ngAfterViewChecked() {
  //  this.scrollToBottom()
  }
  scrollToBottom(): void {
    if(this.aiTutorResultArr.length > 2) {
      try {
        if (this.myScrollContainer) {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight + 150
        }
      } catch(err) { }
    } 
   
  }
  clickOutside() {
    this.iconClick('end')
  }
  private disableScroll() {
    this.renderer.addClass(document.body, 'disable-scroll')
  }

  private enableScroll() {
    this.renderer.removeClass(document.body, 'disable-scroll')
  }

  submitSearchQuery() {
   console.log(this.searchQueryAItutor)
  // this.searchQuery = 'Soil Erosion and Conservation'
   let sendMsgObj = {
     type: 'sendMsg',
     tab: 'sarthi',
     question: this.searchQueryAItutor
   }
   this.aiTutorResultArr.push(sendMsgObj)
   this.aiTutorResultArr.push({type: 'incoming',  tab: 'sarthi', answer: ''})
  //  this.searchQuery = ''
  //  this.aiGlobalSearch()
  //  this.getAiTutorMessage()
    this.scrollToBottom()
   this.sendAITutorMessage()
   
  }


  sendAITutorMessage() {
    console.log('content', this.content)
    if (this.searchQueryAItutor) {
      let message = {
        message: this.searchQueryAItutor, 
        query: this.searchQueryAItutor,
        folder_name: 'do_1141489083557396481526' //this.content
      }
      this.websocketService.sendMessage(message);
      
      
      setTimeout(()=>{
        this.getAiTutorMessage()
      }, 1000)
      
    }
  }
  

  getAiTutorMessage() {
    this.messageSubscription = this.websocketService
      .getMessages()
      .subscribe((message: string) => {
        console.log(message);
       // this.messages.push(message);
       this.aiTutorResult = message
       this.aiTutorResultMessage()
       this.searchQueryAItutor = '';
      });
  }

  aiTutorResultMessage() {
    let requestBody:any = {
      "query":"Basics of National Income Accounting"
   }
    // this.chatbotService.aiGlobalSearch(requestBody).subscribe((data)=>{
    //   console.log('data--', data)
    // })
    console.log('this.userJourney', this.userJourney)
    console.log('requestBody', requestBody)
    console.log('aiSearchResult', this.aiTutorResult)
    console.log('this.aiSearchResultArr', this.aiTutorResultArr)
    let arr:any = []
    this.aiTutorResult.retrievedChunks && this.aiTutorResult.retrievedChunks.map((item:any)=>{
      let resultObj = {        
        message: item.Name,
        recommendedQues: '',
        selectedValue: '',       
        title: item.Name,
        content: item,
        mimeType: item.mimeType,
        contentType: item.ContentType,
        artifactUrl: item.ArtifactURL,
        description: item.Description,
        identifier: item.Identifier,   
        contentStart: item?.contentStart/60,
        contentEnd: item?.contentEnd/60,     
        resourceLink : item.mimeType === 'application/pdf'? `https://portal.igotkarmayogi.gov.in/app/amrit-gyaan-kosh/player/pdf/${item.Identifier}?primaryCategory=Learning Resource&from=globalSearch`: `https://portal.igotkarmayogi.gov.in/app/amrit-gyaan-kosh/player/video/${item.Identifier}?primaryCategory=Learning Resource&from=globalSearch`
      }

      arr.push(resultObj)
      
    })
    let answer = this.aiTutorResult.answer ? this.aiTutorResult.answer.trim().replace(/\n/g, '<br>') : "Apologies! I wasn't able to find a relevant solution for your current query. However, I specialize in resolving queries and creating personalized learning guidance tailored to your needs. Kindly rephrase or clarify your query so I can assist you more effectively."
 
    let shortAnswer =  this.splitParagraphByWords(answer)
    console.log('shortAnswer', shortAnswer)
    this.aiTutorResultArr.push({ wordsCount: answer.trim().split(/\s+/).length, showLess: answer.trim().split(/\s+/).length > 30 ? true : false ,answer: answer, shortAnswer: shortAnswer ,result: arr, type: 'incoming',  tab: 'sarthi'})
    this.aiTutorResultArr.map((item:any, index:any)=>{
      if(item && item.answer === '') {
        // delete this.aiSearchResultArr[index]
        this.aiTutorResultArr.splice(index,1)
      }
     })
    console.log('this.aiTutorResultArr', this.aiTutorResultArr)
  }

  copyPath(item:any, cindex:any) {
    
    console.log('chat',item)
    const selBox = document.createElement('textarea')
    selBox.style.position = 'fixed'
    selBox.style.left = '0'
    selBox.style.top = '0'
    selBox.style.opacity = '0'
    selBox.value = item.mimeType === 'application/pdf'? `https://portal.igotkarmayogi.gov.in/app/amrit-gyaan-kosh/player/pdf/${item.identifier}?primaryCategory=Learning Resource&from=globalSearch`: `https://portal.igotkarmayogi.gov.in/app/toc/${item?.identifier}/overview`
    document.body.appendChild(selBox)
    selBox.focus()
    selBox.select()
    document.execCommand('copy')
    document.body.removeChild(selBox)
    this.copiedIndex = cindex
    setTimeout(()=>{
      this.copiedIndex = -1
    },1000)
    
  }

  redirectToToc(chat:any) {
    let path = `https://portal.igotkarmayogi.gov.in/app/toc/${chat?.identifier}/overview`
    window.open(path, '_blank')
  }

  splitParagraphByWords(paragraph:any, wordsPerChunk = 30) {
    const words = paragraph.trim().split(/\s+/);
    const chunks = [];
  
    for (let i = 0; i < wordsPerChunk; i++) {
      chunks.push(words[i])
    }
    
    return chunks.join(' ');
  }

  toggleShow(index:any, showType:any) {
    if(showType === 'less') {
      this.aiTutorResultArr[index]['showLess'] = true
    } else {
      this.aiTutorResultArr[index]['showLess'] = false
    }
    
  }

  get userInitials() {
    return this.initials
  }
  private createInititals(name:any): void {
    const randomIndex = Math.floor(Math.random() * Math.floor(this.colors.length))
    this.circleColor = this.colors[randomIndex]
    if (this.randomcolors) {
      const randomIndex1 = Math.floor(Math.random() * Math.floor(this.randomcolors.length))
      this.circleColor = this.randomcolors[randomIndex1]
    }
    let initials = ''
    const array = `${name} `.toString().split(' ')
    if (array[0] !== 'undefined' && typeof array[1] !== 'undefined') {
      initials += array[0].charAt(0)
      initials += array[1].charAt(0)
    } else {
      for (let i = 0; i < name.length; i += 1) {
        if (name.charAt(i) === ' ') {
          continue
        }

        if (name.charAt(i) === name.charAt(i)) {
          initials += name.charAt(i)

          if (initials.length === 2) {
            break
          }
        }
      }
    }
    this.initials = initials.toUpperCase()
    console.log('this.initials', this.initials)
  }

  getLearningStyle() {
    if(this.selectedLearningStyle && this.selectedLearningStyle.title === 'Socratic Style') {
      this.websocketService.closeConnection()
      this.websocketService.connect('ws://learning-ai.karmayogibharat.net:3000/ws');
    } else if (this.selectedLearningStyle && this.selectedLearningStyle.title === 'None') {
      this.websocketService.closeConnection()
      this.websocketService.connect('ws://learning-ai.karmayogibharat.net:3001/ws');
    }  else if (this.selectedLearningStyle && this.selectedLearningStyle.title === 'Storytelling') {
      this.websocketService.closeConnection()
      this.websocketService.connect('ws://learning-ai.karmayogibharat.net:3000/ws');
    }
    console.log('selectedLearningStyle--', this.selectedLearningStyle)
  }

  ngOnDestroy(): void {
    // Clean up the subscription and WebSocket connection
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    // this.websocketService.closeConnection();
  }
}