import { Component, OnInit, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {

  constructor( 
    private renderer: Renderer2,
    public DarkLightModeService: DarkLightModeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ){}

  ngOnInit(): void {
    const script = this.renderer.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    if (isPlatformBrowser(this.platformId)){
      this.renderer.appendChild(document.body, script)
    }
  }

}
