import { Component } from '@angular/core';
import { FooterComponent } from '../../footer/footer.component';
import { NavBarComponent } from '../../nav-bar/nav-bar.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-seo',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink],
  templateUrl: './seo.component.html',
  styleUrl: './seo.component.scss'
})
export class SeoComponent {

}
