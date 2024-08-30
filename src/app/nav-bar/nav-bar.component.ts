import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DarkLightModeService } from '../app-service/dark-light-mode.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnInit {

  public isLargeScreen: boolean = false;
  public isMenuActive: boolean = false;
  public menu_icon: string = "menu";
  public menu_mode: string = '';

  ngOnInit() {
    this.checkScreenSize();
  }

  constructor(public DarkLightModeService: DarkLightModeService){}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isLargeScreen = window.innerWidth < 1100;
    this.isMenuActive = window.innerWidth < 1100;
  }

  openMenu(){
    if(this.isLargeScreen == false){
      this.isLargeScreen = true;
      this.menu_icon = "menu";
    }
    else{
      this.isLargeScreen = false;
      this.menu_icon = "menu-x";
    }

    this.menu_mode = 'Light mode';

  }

  switchMode(){
    if(this.menu_mode === 'Light mode'){
      this.menu_mode = 'Dark mode';
    }
    else if(this.menu_mode === 'Dark mode'){
      this.menu_mode = 'Light mode';
    }
  }


}
