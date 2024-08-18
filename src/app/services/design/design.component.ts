import { Component } from '@angular/core';
import { NavBarComponent } from '../../nav-bar/nav-bar.component';
import { FooterComponent } from '../../footer/footer.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DarkLightModeService } from '../../app-service/dark-light-mode.service';

@Component({
  selector: 'app-design',
  standalone: true,
  imports: [NavBarComponent, FooterComponent,RouterLink, CommonModule],
  templateUrl: './design.component.html',
  styleUrl: './design.component.scss'
})
export class DesignComponent {

  selectedSlide:string = 'analisi';

  constructor( public DarkLightModeService: DarkLightModeService){}
  
  selectSlide(n:string): string{
    return this.selectedSlide = n;
  }

}
