import { Component } from '@angular/core';
import { NavBarComponent } from '../../nav-bar/nav-bar.component';
import { FooterComponent } from '../../footer/footer.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-web',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink],
  templateUrl: './web.component.html',
  styleUrl: './web.component.scss'
})
export class WebComponent {

}
