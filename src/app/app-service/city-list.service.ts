import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CityListService {

  private API_URL_START: string = 'http://api.geonames.org/postalCodeSearchJSON?placename=';
  private API_URL_END: string = '&maxRows=2&username=BaffoMannaro';

  constructor(private httpClient: HttpClient) {}

  get_city_list(cityName: string): Observable<any>{
    return this.httpClient.get(`${this.API_URL_START}${cityName}${this.API_URL_END}`);
  }
}
