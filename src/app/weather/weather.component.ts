import { booleanAttribute, Component, NgModule } from '@angular/core';
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
  private city_check: any = [];
  public city_flag: boolean = false;

  public city_country: string = '';
  public cityList_Italia:any = [];
  public city_selected_checked: string = '';


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

    this.cityListService.get_city_list(this.selectedCity).subscribe((city:any) => {

      for( let i = 0; city.length > i; i++ ){
        if(city[i].country === 'Italy'){
          this.cityList_Italia.push(city[i].city);

          if(city[i].city.toLowerCase() !== this.selectedCity.toLowerCase()){
            this.city_flag = true;
          }
          else{
            this.city_selected_checked = city[i].city;
          }
        }
        else {
          this.city_flag = true;
          return
        }
      }

      console.log('cityList_Italia = ' + this.cityList_Italia);

      this.weatherService.get_weather(this.city_selected_checked).subscribe((data:any[]) => {
        this.weather = data;
        this.formatWeather(this.weather);
        this.city_flag = false;
      });
      
      /* if (this.city_check.toLowerCase() != this.selectedCity.toLowerCase()){
        this.city_flag = true;
        return
      }

      this.weatherService.get_weather(this.city_check).subscribe((data:any[]) => {
        this.weather = data;
        this.formatWeather(this.weather);
        this.city_flag = false;
      }); */

    });


  }

  onKeyup(event: KeyboardEvent): void{

    if (event.key === 'Backspace') {
      this.city_flag = false;
    }

  }

}
