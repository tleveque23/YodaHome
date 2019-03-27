import { Component, OnInit } from '@angular/core';
import { NetatmoService } from './services/netatmo.service';
import { Subscription, timer } from 'rxjs';
import { OpenWeatherMapService } from './services/open-weather-map.service';
import { ForecastResume } from './services/forecast-resume';
import { MatDialog } from '@angular/material';
import { SunDialogComponent } from './sun-dialog/sun-dialog.component';
import { DatePipe } from '@angular/common';
import { EcobeService } from './services/ecobe.service';
import { Utils } from './utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  providers: [DatePipe]
})
export class AppComponent implements OnInit {

  public weatherTs: Date;
  public weatherIndoorTemp: string;
  public weatherOutdoorTemp: string;
  public weatherTempTrend: string;
  public weatherOutsideHumidity: string;
  public weatherTimerSubscription: Subscription;
  public weatherForecastTimerSubscription: Subscription;
  public currentCondition: string;
  public currentConditionIcon: string;
  public currentPressure: string;
  public sunset: number;
  public sunrise: number;
  public locality: string;
  public previousPressure: string;
  public forecastForTheRestOfTheDayList: any[];
  public forecastForTheNextDays: ForecastResume[];
  public currentConditionTs : Date;
  public currentForecastTs: Date;

  constructor(private netatmoService: NetatmoService,
              private openWeatherMapService: OpenWeatherMapService,
              public dialog: MatDialog,
              private datePipe: DatePipe,
              private ecobeService: EcobeService
  ) {}

  public ngOnInit(): void {

    this.refreshWeatherData();
    this.refreshWeatherForecast();
    this.refreshEcobeData();

    // repeat every x minutes
    this.weatherTimerSubscription = timer(5000, Utils.getMillisForMinutes(1)).subscribe(() => this.refreshWeatherData());
    this.weatherForecastTimerSubscription = timer(5000, Utils.getMillisForMinutes(1)).subscribe(() => this.refreshWeatherForecast());
  }

  private refreshWeatherData() {
    this.netatmoService.getWeatherData().then( (response) => {
      console.log(response);

      this.weatherIndoorTemp = response.body.devices[0].dashboard_data.Temperature;
      this.weatherOutdoorTemp = response.body.devices[0].modules[0].dashboard_data.Temperature;
      this.weatherTempTrend = response.body.devices[0].modules[0].dashboard_data.temp_trend;
      this.weatherOutsideHumidity = response.body.devices[0].modules[0].dashboard_data.Humidity;
      this.weatherTs = new Date( +response.body.devices[0].dashboard_data.time_utc * 1000 );
    });
  }

  private refreshWeatherForecast() {
    this.openWeatherMapService.getCurrentCondition().then( (wc) => {
      this.currentCondition = wc.weather[0].description;
      this.currentConditionIcon = wc.weather[0].icon;

      if (this.currentPressure) {
        this.previousPressure = this.currentPressure;
      }
      this.currentPressure = wc.main.pressure;

      this.sunset = +wc.sys.sunset;
      this.sunrise = +wc.sys.sunrise;
      this.locality = wc.name;

      this.currentConditionTs = new Date(+window.localStorage.getItem('currentConditionTs'));
    });

    this.openWeatherMapService.getForecast().then( (fc) => {
      console.debug(`fc`);
      // this.forecastForTheRestOfTheDayList = OpenWeatherMapService.getForecastForTheRestOfTheDay(fc.list);
      this.forecastForTheRestOfTheDayList = OpenWeatherMapService.getForecastForNextHours(fc.list);

      this.forecastForTheNextDays = OpenWeatherMapService.getForecastForTheNextDays(fc.list);

      this.currentForecastTs = new Date(+window.localStorage.getItem('currentForecastTs'));
    });
  }

  // noinspection JSUnusedGlobalSymbols
  public stopWeatherRefresh() {
    this.weatherTimerSubscription.unsubscribe();
    console.debug(`Weather refresh stopped`);
    this.stopWeatherForecastRefresh();
  }

  public stopWeatherForecastRefresh() {
    this.weatherForecastTimerSubscription.unsubscribe();
    console.debug(`Weather Forecast refresh stopped`);
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

  public getIconUrlForIcon(icon: string): string {
    return `http://openweathermap.org/img/w/${icon}.png`
  }

  public getRoundedTemp(temp: number): number {
    return Math.round(temp);
  }

  public getResolution() {
    const h = window.screen.availHeight;
    const w = window.screen.availWidth;

    return `Resolution is ${w} x ${h}`;
  }


  openSunDialog(): void {
    const dialogRef = this.dialog.open(SunDialogComponent, {
      width: '350px',
      data: {sunrise: this.datePipe.transform(this.sunrise*1000, 'HH:mm'), sunset: this.datePipe.transform(this.sunset*1000, 'HH:mm')}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  private refreshEcobeData() {
    this.ecobeService.getThermostatData()
  }
}
