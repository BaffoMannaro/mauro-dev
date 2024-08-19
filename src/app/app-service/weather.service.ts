import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  APIkey: string = "f5743e0b9ef8bdb08200a1d96540bf54";

  constructor(private httpClient: HttpClient) {}

  getWeather(lat: number, lon: number, APIkey:string){

    APIkey = this.APIkey;
    

  }


}
