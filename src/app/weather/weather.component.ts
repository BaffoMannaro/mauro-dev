import { Component } from '@angular/core';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.scss'
})
export class WeatherComponent {

  constructor( public DarkLightModeService: DarkLightModeService){}

}
