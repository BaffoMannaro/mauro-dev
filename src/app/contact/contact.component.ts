import { Component, OnInit, Renderer2 } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {

  constructor( private renderer: Renderer2, public DarkLightModeService: DarkLightModeService) {}

  ngOnInit(): void {
    const script = this.renderer.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    this.renderer.appendChild(document.body, script);
  }

}
