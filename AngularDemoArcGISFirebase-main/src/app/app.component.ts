import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Event, Router } from '@angular/router';
import { FirebaseService } from './services/database/firebase';

interface ITab {
  name: string;
  link: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {

  tabs: ITab[] = [{
    name: 'Home',
    link: '/home'
  }, {
    name: 'Map',
    link: '/map'
  },
  {
    name: 'Log in',
    link: '/login'
  }];

  activeTab = this.tabs[0].link;

  constructor(private router: Router, public firebaseService: FirebaseService) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.activeTab = event.url;
        console.log(event);
      }
    });
  }

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }

}

