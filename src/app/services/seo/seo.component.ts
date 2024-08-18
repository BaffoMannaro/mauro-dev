import { Component } from '@angular/core';
import { FooterComponent } from '../../footer/footer.component';
import { NavBarComponent } from '../../nav-bar/nav-bar.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DarkLightModeService } from '../../app-service/dark-light-mode.service';

@Component({
  selector: 'app-seo',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink, CommonModule],
  templateUrl: './seo.component.html',
  styleUrl: './seo.component.scss'
})
export class SeoComponent {

  constructor( public DarkLightModeService: DarkLightModeService){}

}
