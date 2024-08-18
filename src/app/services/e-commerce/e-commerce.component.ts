import { Component } from '@angular/core';
import { NavBarComponent } from '../../nav-bar/nav-bar.component';
import { FooterComponent } from '../../footer/footer.component';
import { RouterLink } from '@angular/router';
import { DarkLightModeService } from '../../app-service/dark-light-mode.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-e-commerce',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink, CommonModule],
  templateUrl: './e-commerce.component.html',
  styleUrl: './e-commerce.component.scss'
})
export class ECommerceComponent {

  constructor( public DarkLightModeService: DarkLightModeService){}

}
