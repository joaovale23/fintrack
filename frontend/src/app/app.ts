import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WakeBanner } from './shared/wake-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WakeBanner],
  template: '<app-wake-banner /><router-outlet />',
})
export class App {}
