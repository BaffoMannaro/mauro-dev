import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ServicesComponent } from './services/services.component';
import { SeoComponent } from './services/seo/seo.component';
import { WebComponent } from './services/web/web.component';
import { LandingComponent } from './services/landing/landing.component';
import { BlogComponent } from './services/blog/blog.component';
import { ECommerceComponent } from './services/e-commerce/e-commerce.component';
import { DesignComponent } from './services/design/design.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { WebAppComponent } from './services/web-app/web-app.component';

export const routes: Routes = [

  {'path' : '', component: HomeComponent},
  {'path' : 'home', component:HomeComponent},

  {'path' : 'services', component:ServicesComponent},
  {'path' : 'services/seo', component:SeoComponent},
  {'path' : 'services/web', component:WebComponent},
  {'path' : 'services/landing-page', component:LandingComponent},
  {'path' : 'services/blog', component:BlogComponent},
  {'path' : 'services/e-commerce', component:ECommerceComponent},
  {'path' : 'services/web-app', component:WebAppComponent},
  {'path' : 'services/design', component:DesignComponent},

  {'path' : 'about', component:AboutComponent},

  {'path' : 'contacts', component:ContactComponent}

];
