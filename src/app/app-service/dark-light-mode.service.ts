import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DarkLightModeService {

  mode: boolean = false;

  constructor() {}

  toggleMode() :void{
      this.mode = !this.mode;
  }


}
