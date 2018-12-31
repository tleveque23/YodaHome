import { Component, OnInit } from '@angular/core';
import { NetatmoService } from './services/netatmo.service';
import { Observable, Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  public weatherIndoorTemp: string;
  public weatherOutdoorTemp: string;
  public weatherTempTrend: string;
  public weatherOutsideHumidity: string;
  private weatherTimerSubscription: Subscription;

  constructor(private netatmoService: NetatmoService) {}

  public ngOnInit(): void {

    this.refreshWeatherData();

    // repeat every minutes
    this.weatherTimerSubscription = timer(5000, 5000).subscribe(() => this.refreshWeatherData());
  }

  private refreshWeatherData() {
    this.netatmoService.getWeatherData().subscribe( (response) => {
      console.log(response);

      this.weatherIndoorTemp = response.body.devices[0].dashboard_data.Temperature;
      this.weatherOutdoorTemp = response.body.devices[0].modules[0].dashboard_data.Temperature;
      this.weatherTempTrend = response.body.devices[0].modules[0].dashboard_data.temp_trend;
      this.weatherOutsideHumidity = response.body.devices[0].modules[0].dashboard_data.Humidity;
    });
  }

  public stopWeatherRefresh() {
    this.weatherTimerSubscription.unsubscribe();
    console.debug(`Weather refresh stopped`);
  }
}
