import { Component } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterLink,CommonModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent {

  selectedService1: boolean = false;
  selectedService2: boolean = false;
  selectedService3: boolean = false;

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
