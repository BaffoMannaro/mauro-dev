import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CityListService {

  private API_URL = 'https://andruxnet-world-cities-v1.p.rapidapi.com/?query=';
  private API_KEY = '09e2da49a6msh43602a86a717849p17ac83jsn04123964bab8';

  constructor(private httpClient: HttpClient) {}

  get_city_list(cityName: string): Observable<any>{
    const headers = new HttpHeaders({
      'x-rapidapi-key': this.API_KEY,
      'x-rapidapi-host': 'andruxnet-world-cities-v1.p.rapidapi.com'
    });

    return this.httpClient.get<any>
    (`${this.API_URL}${cityName}&searchby=city`);
  }
}
