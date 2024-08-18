import { Component } from '@angular/core';
import { NavBarComponent } from '../../nav-bar/nav-bar.component';
import { FooterComponent } from '../../footer/footer.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DarkLightModeService } from '../../app-service/dark-light-mode.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {

  constructor( public DarkLightModeService: DarkLightModeService){}

}
