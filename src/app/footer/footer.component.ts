import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

 constructor( public DarkLightModeService: DarkLightModeService){}

}
