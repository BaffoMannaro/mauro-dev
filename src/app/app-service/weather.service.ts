import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class WeatherService {
  API_KEY: string = "f5743e0b9ef8bdb08200a1d96540bf54";
  API_URL: string = "https://api.openweathermap.org/data/2.5/weather?";
  cityName: string = "Monopoli";

  constructor(private httpClient: HttpClient) {}

  get_weather(): Observable<any> {
    return this.httpClient.get(`${this.API_URL}q=${this.cityName}&units=metric&lang=it&appid=${this.API_KEY}`);
  }

}
