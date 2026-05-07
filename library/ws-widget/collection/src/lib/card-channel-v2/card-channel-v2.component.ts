import { Component, OnInit, OnChanges, Input } from '@angular/core'
import { NsWidgetResolver, WidgetBaseComponent } from '@sunbird-cb/resolver'
import { NsContent } from '../_services/widget-content.model'

@Component({
    selector: 'ws-widget-card-channel-v2',
    templateUrl: './card-channel-v2.component.html',
    styleUrls: ['./card-channel-v2.component.scss'],
    standalone: false
})
export class CardChannelV2Component
  extends WidgetBaseComponent
  implements OnInit, OnChanges, NsWidgetResolver.IWidgetData<NsContent.IContent> {

  @Input() widgetData!: NsContent.IContent

  constructor() {
    super()
  }

  ngOnInit() {
  }

  ngOnChanges() {
  }
}
