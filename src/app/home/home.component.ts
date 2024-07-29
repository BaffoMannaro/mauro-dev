import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { CommonModule } from '@angular/common';
import { WeatherComponent } from '../weather/weather.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavBarComponent, CommonModule, WeatherComponent, FooterComponent],
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

  selectedService1: boolean = false;
  selectedService2: boolean = false;
  selectedService3: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  onServiceClick(i:number): void{
    if(i === 1){
      this.selectedService1 = !this.selectedService1;
    }
    else if (i === 2){
      this.selectedService2 = !this.selectedService2;
    }
    else if(i === 3){
      this.selectedService3 = !this.selectedService3;
    }
  }
}
