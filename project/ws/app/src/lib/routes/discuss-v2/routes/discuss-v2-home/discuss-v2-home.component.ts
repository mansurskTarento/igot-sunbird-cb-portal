import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ws-app-discuss-v2-home',
  templateUrl: './discuss-v2-home.component.html',
  styleUrls: ['./discuss-v2-home.component.scss']
})
export class DiscussV2HomeComponent {
  shortCutData: any[]= [
    {
      name:"Saved Posts",
      icon:"bookmark_border",
      link:"/page/learn"
    },
    {
      name:"Posts By You",
      icon:"list_alt",
      link:""
    },
    {
      name:"Pending Request",
      icon:"update",
      link:""
    }
  ]




  constructor(private router: Router) { }
  searchTextMethod(searchTxt: any) {
    
    console.log(event, 'searchTextMethod')
    this.router.navigate(['/app/discussion-forum-v2/search'], {
      queryParams: { c: searchTxt.trim() }
    })
  }
  showAllCommunityByTopic(topic: string) {
    this.router.navigate([`/app/discussion-forum-v2/communities/${topic}`])
  }
  showAllCommunityByTopicCard(topic: any) {
    this.router.navigate([`/app/discussion-forum-v2/communities/${topic.value}`])
  }
  communityCardClick(cardData: any) {
    
    this.router.navigate(['/app/discussion-forum-v2/community', cardData.communityId])
  }

  showAllTopics(_eventData: any){
    this.router.navigate(['/app/discussion-forum-v2/topics/all'])

  }
}
