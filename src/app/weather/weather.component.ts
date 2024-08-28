import { Component, NgModule } from '@angular/core';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../app-service/weather.service';
import { CityListService } from '../app-service/city-list.service';
import { Observable } from 'rxjs';

import { FormsModule } from '@angular/forms';
import { BlobOptions } from 'buffer';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.scss'
})
export class WeatherComponent{
  private weather: any = [];
  private weatherObservable: Observable<any[]>;
  private cityList: any = [];
  public cityList_names: any = [];
  private cityListObservable: Observable<any>;

  // gestione info sul meteo
  public weather_city: string = '';
  public temperature: number = 0;
  public weather_description: string = '';
  public feels_like: number = 0;
  public wind_speed: string = '';
  public humidity: string = '';
  public weather_icon: string = '';

  // gestione della data di oggi
  public today : number = Date.now();

  // gestione lista città nell'input
  public selectedCity: string = 'Monopoli';

  // costruttore
  constructor(
    public DarkLightModeService: DarkLightModeService,
    public weatherService: WeatherService,
    public cityListService: CityListService 
  ){
    
    // METEO
    this.weatherObservable = this.weatherService.get_weather(this.selectedCity);

    this.weatherService.get_weather(this.selectedCity).subscribe((res:any[]) => {
      this.weather = res;
      this.formatWeather(this.weather);
    })

    // CITTA'
    this.cityListObservable = this.cityListService.get_city_list(this.selectedCity);
    cityListService.get_city_list(this.selectedCity).subscribe((res:any[]) => {
      this.cityList = res;
      this.cityList_names = this.cityList.postalCodes.map((postalCode: { placeName: any; }) => postalCode.placeName);
    });

  }
  //fine costruttore

  formatWeather(weather: any){
    this.weather_city = weather.name.replace('Comune di ', '');
    this.temperature = parseInt(weather.main.temp);
    this.weather_description = weather.weather[0].description;
    this.feels_like = parseInt(weather.main.feels_like);
    this.wind_speed = weather.wind.speed;
    this.humidity = weather.main.humidity;
    this.weather_icon = weather.weather[0].icon;
  }

  inputCity(): void {
    this.weatherService.get_weather(this.selectedCity).subscribe((res:any[]) => {
      this.weather = res;
      this.formatWeather(this.weather);
    })

  }

}
