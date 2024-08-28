import { Component } from '@angular/core';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../app-service/weather.service';
import { CityListService } from '../app-service/city-list.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
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
  public cities: any[] = [];
  public filteredCities: any[] = [];
  public selectedCity: string = '';

  // costruttore
  constructor(
    public DarkLightModeService: DarkLightModeService,
    public weatherService: WeatherService,
    public cityListService: CityListService 
  ){
    
    // METEO
    this.weatherObservable = this.weatherService.get_weather();

    this.weatherService.get_weather().subscribe((res:any[]) => {
      this.weather = res;

      this.weather_city = this.weather.name.replace('Comune di ', '');
      this.temperature = parseInt(this.weather.main.temp);
      this.weather_description = this.weather.weather[0].description;
      this.feels_like = parseInt(this.weather.main.feels_like);
      this.wind_speed = this.weather.wind.speed;
      this.humidity = this.weather.main.humidity;
      this.weather_icon = this.weather.weather[0].icon;

    })

    // CITTA'
    this.cityListObservable = this.cityListService.get_city_list();
    cityListService.get_city_list().subscribe((res:any[]) => {
      this.cityList = res;

/*       for(let i = 0; i < 4; i++){
        this.cityList_names = this.cityList.postalCodes[i].placeName;
      }
 */

      this.cityList_names = this.cityList.postalCodes.map((postalCode: { placeName: any; }) => postalCode.placeName);

      console.log(this.cityList_names);

    });

  }

}
