import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FilterSearchPipe } from './filter-search.pipe'
import { CustomFilterPipe } from './customFilter/custom-filter.pipe'

@NgModule({
  declarations: [FilterSearchPipe, CustomFilterPipe],
  imports: [
    CommonModule,
  ],
  exports: [FilterSearchPipe, CustomFilterPipe],
})
export class FilterSearchPipeModule { }
