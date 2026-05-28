import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly contactEmail = 'altamura.mauro@gmail.com';
  readonly currentYear = new Date().getFullYear();

  constructor(public DarkLightModeService: DarkLightModeService) {}

  reload(): void {
    window.location.reload();
  }
}
