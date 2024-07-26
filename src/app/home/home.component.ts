import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { CommonModule } from '@angular/common';
import { WeatherComponent } from '../weather/weather.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, CommonModule, WeatherComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{

  words: string[] = [
    'Branding',
    'User Interface',
    'Web-App',
    'E-Commerce',
    'Blog',
    'Wire Framing',
    'User Experience',
    'SEO'
  ];

  constructor() {}

  ngOnInit(): void {}

}
