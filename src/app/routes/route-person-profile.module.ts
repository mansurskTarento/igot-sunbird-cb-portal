import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PersonProfileModule } from '@ws/app'

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        PersonProfileModule,
    ],
    exports: [
        PersonProfileModule,
    ]
})
export class RoutePersonProfileModule { }
