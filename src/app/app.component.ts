import { Component, OnInit } from '@angular/core';
import { NetatmoService } from './services/netatmo.service';
import { Subscription, timer } from 'rxjs';
import { OpenWeatherMapService } from './services/open-weather-map.service';
import { ForecastResume } from './services/forecast-resume';
import { MatDialog } from '@angular/material/dialog';
import { SunDialogComponent } from './sun-dialog/sun-dialog.component';
import { DatePipe } from '@angular/common';
import { EcobeService } from './services/ecobe.service';
import { Utils } from './utils';

const FAN_INTERVAL = 10;
const FAN_INTERVAL_LONG = 25;

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
  public weatherTimerSubscription: Subscription;
  public weatherForecastTimerSubscription: Subscription;
  public weatherWindSpeed: number;
  public weatherWindDirection: number;
  public weatherOutdoorHumidity: number;
  public weatherOutdoorHumidex: number;
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
  public tempIsNotUpToDate: boolean = false;
  public tempColor: string = 'rgb(255,255,255)';
  public diffInMinutes: number;
  public fanOn: boolean;

  public fanInterval = FAN_INTERVAL;
  public fanIntervalLong = FAN_INTERVAL_LONG;

  private ecobeServiceReady: boolean = false;

  constructor(private netatmoService: NetatmoService,
              private openWeatherMapService: OpenWeatherMapService,
              public dialog: MatDialog,
              private datePipe: DatePipe,
              private ecobeService: EcobeService
  ) {}

  public ngOnInit(): void {

    this.refreshWeatherData();
    this.refreshWeatherForecast();
    this.initEcobeAuthorization();

    // repeat every x minutes
    this.weatherTimerSubscription = timer(5000, Utils.getMillisForMinutes(1)).subscribe(() => this.refreshWeatherData());
    this.weatherForecastTimerSubscription = timer(5000, Utils.getMillisForMinutes(1)).subscribe(() => this.refreshWeatherForecast());
  }

  private refreshWeatherData() {
    this.netatmoService.getWeatherData().then( (response) => {
      console.log(response);

      this.weatherIndoorTemp = response.body.devices[0].dashboard_data.Temperature;
      this.weatherOutdoorTemp = response.body.devices[0].modules[0].dashboard_data.Temperature;
      this.weatherOutdoorHumidity = response.body.devices[0].modules[0].dashboard_data.Humidity;
      this.weatherTempTrend = response.body.devices[0].modules[0].dashboard_data.temp_trend;
      this.weatherTs = new Date( +response.body.devices[0].dashboard_data.time_utc * 1000 );
      this.weatherWindSpeed = response.body.devices[0].modules[2].dashboard_data.WindStrength;
      this.weatherWindDirection = response.body.devices[0].modules[2].dashboard_data.WindAngle;
      this.weatherOutdoorHumidex = this.calculHumidex();

      const now = new Date();
      console.log('Now:')
      console.log(now);
      console.log('TS');
      console.log(this.weatherTs);
      console.log(now.getTime());
      console.log(this.weatherTs.getTime());
      console.log(now.getTime() - this.weatherTs.getTime());
      const diff = now.getTime() - this.weatherTs.getTime();
      this.tempIsNotUpToDate = diff > 600000;
      if (this.tempIsNotUpToDate) {
        this.diffInMinutes = diff / 1000 / 60
      }
      else {
        this.diffInMinutes = undefined;
      }

      if (this.ecobeServiceReady) {
        if (this.weatherIndoorTemp >= this.weatherOutdoorTemp && +this.weatherOutdoorTemp > 15) {
          console.log(`Temp intérieur (${this.weatherIndoorTemp}) >= temp ext (${this.weatherOutdoorTemp} && > 15. On met la fan à ${+this.weatherIndoorTemp < 24 ? this.fanInterval : this.fanIntervalLong} minutes`)
          this.ecobeService.setFanInterval( +this.weatherIndoorTemp < 24 ? this.fanInterval : this.fanIntervalLong);
          this.fanOn = true;
          this.tempColor = 'rgb(255,255,255)'
        }
        else {
          console.log('On ferme la fan')
          this.ecobeService.setFanInterval(0);
          this.tempColor = 'rgb(255,255,255)'
          this.fanOn = false;
        }
      }
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

  public getWindDirection(deg: number): string {
    if ( (+deg >= 0 && +deg) < 45 || +deg >=315) {
      return 'N';
    }
    else if ( +deg >= 45 && +deg < 135) {
      return `E`;
    }
    else if ( +deg >= 135 && +deg < 225) {
      return `S`;
    }
    else {
      return `O`;
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

  private initEcobeAuthorization() {
    this.ecobeService.readyEmitter.subscribe(() => {
      console.log('Ready to request data from Ecobe API');
      this.ecobeServiceReady = true;
    });

    this.ecobeService.initAuthorization();
  }

  public getWindIconRotation() {
    return 'rotate(' + this.weatherWindDirection +'deg)'
  }

  /**
   * Calcul Humidex: https://fr.wikipedia.org/wiki/Indice_humidex
   * Calcul Point de rosée: https://fr.wikipedia.org/wiki/Point_de_ros%C3%A9e
   */
  private calculHumidex(): number {
    const H = 67;// this.weatherOutdoorHumidity;
    const T = 23.2; // this.weatherOutdoorTemp
    console.log('******************');
    const pointDeRosee = Math.pow((H/100), 1/8) * (112 + (0.9 * T)) + (0.1 * T) - 112;

    const humidex = T + 0.5555 * ( 6.11 * Math.pow( 2.71828, 5417.7530 * ( 1/273.16 - 1/(273.15 + pointDeRosee)) ) - 10 );

    console.log(pointDeRosee);
    console.log(humidex);
    return humidex;
  }
}
