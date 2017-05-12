import { Component } from '@angular/core';

import { Wakanda } from './wakanda.service';

@Component({
  selector: 'app-root',
  providers: [Wakanda],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';
  public wakandaClientVersion: string;

  constructor(public wakanda: Wakanda) {
    this.wakandaClientVersion = this.wakanda.wakandaClientVersion;
    // Do something with api
  }
}
