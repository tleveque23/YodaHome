import { Component, OnInit } from '@angular/core';
import { NetatmoService } from './services/netatmo.service';
import { Observable, Subscription, timer } from 'rxjs';
import { OpenWeatherMapService } from './services/open-weather-map.service';

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
  private weatherForecastTimerSubscription: Subscription;
  private currentCondition: string;
  private currentPressure: string;
  private sunset: string;
  private sunrise: string;
  private locality: string;
  private previousPressure: string;
  // private forecastList: any[];
  private forecastForTheRestOfTheDayList: any[];

  constructor(private netatmoService: NetatmoService, private openWeatherMapService: OpenWeatherMapService) {}

  public ngOnInit(): void {

    this.refreshWeatherData();
    this.refreshWeatherForecast();

    // repeat every x minutes
    this.weatherTimerSubscription = timer(5000, this.getMillisForMinutes(1)).subscribe(() => this.refreshWeatherData());
    this.weatherForecastTimerSubscription = timer(5000, this.getMillisForMinutes(60)).subscribe(() => this.refreshWeatherForecast());
  }

  private refreshWeatherData() {
    this.netatmoService.getWeatherData().then( (response) => {
      console.log(response);

      this.weatherIndoorTemp = response.body.devices[0].dashboard_data.Temperature;
      this.weatherOutdoorTemp = response.body.devices[0].modules[0].dashboard_data.Temperature;
      this.weatherTempTrend = response.body.devices[0].modules[0].dashboard_data.temp_trend;
      this.weatherOutsideHumidity = response.body.devices[0].modules[0].dashboard_data.Humidity;
    });
  }

  private refreshWeatherForecast() {
    this.openWeatherMapService.getCurrentCondition().then( (wc) => {
      this.currentCondition = wc.weather[0].description;

      if (this.currentPressure) {
        this.previousPressure = this.currentPressure;
      }
      this.currentPressure = wc.main.pressure;

      this.sunset = wc.sys.sunset;
      this.sunrise = wc.sys.sunrise;
      this.locality = wc.name;
    });

    this.openWeatherMapService.getForecast().then( (fc) => {
      console.debug(`fc`);
      this.forecastForTheRestOfTheDayList = OpenWeatherMapService.getForecastForTheRestOfTheDay(fc.list)
    });
  }

  public stopWeatherRefresh() {
    this.weatherTimerSubscription.unsubscribe();
    console.debug(`Weather refresh stopped`);
    this.stopWeatherForecastRefresh();
  }

  public stopWeatherForecastRefresh() {
    this.weatherForecastTimerSubscription.unsubscribe();
    console.debug(`Weather Forecast refresh stopped`);
  }


  private getMillisForMinutes(minute: number): number {
    return minute * 60 * 1000;
  }

  public getPressureTrend() {
    if (!this.previousPressure || this.currentPressure === this.previousPressure) {
      return '(stable)';
    }
    else if (+this.currentPressure - +this.previousPressure > 0) {
      return '(à la hausse)';
    }
    else {
      return '(à la baisse)';
    }
  }

  public getWindDirection(deg: string): string {
    if ( (+deg >= 0 && +deg) < 45 || +deg >=315) {
      return 'du nord';
    }
    else if ( +deg >= 45 && +deg < 135) {
      return `de l'est`;
    }
    else if ( +deg >= 135 && +deg < 225) {
      return `du sud`;
    }
    else {
      return `de l'ouest`;
    }

  }

  public getSnowPerHourInCm(snow3h: string) {
    return +snow3h / 3 / 10;
  }

  public getRainPerHourInMm(rain3h: string) {
    return +rain3h / 3;
  }

  public getWindInKph(speed: number) {
    return speed * 3.6;
  }
}
