import { Component } from '@angular/core';
import { NavBarComponent } from '../../nav-bar/nav-bar.component';
import { FooterComponent } from '../../footer/footer.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DarkLightModeService } from '../../app-service/dark-light-mode.service';

@Component({
  selector: 'app-web-app',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink, CommonModule],
  templateUrl: './web-app.component.html',
  styleUrl: './web-app.component.scss'
})
export class WebAppComponent {

  constructor( public DarkLightModeService: DarkLightModeService){}

}
