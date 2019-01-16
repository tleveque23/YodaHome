import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ForecastResume } from './forecast-resume';

@Injectable({
  providedIn: 'root'
})
export class OpenWeatherMapService {

  // Forecast
  // http://api.openweathermap.org/data/2.5/forecast?id=6138501&appid=5d484165420d15f2510af0084aaa556c&units=metric&lang=fr
  // Current condition
  // http://api.openweathermap.org/data/2.5/weather?id=6138501&appid=5d484165420d15f2510af0084aaa556c&units=metric&lang=fr

  private apiKey = '5d484165420d15f2510af0084aaa556c';
  private cityId = '6138501'; // St-Jerome
  // private cityId = '6077445'; // Tremblant
  // private cityId = '6137745'; // Ste-Anne-des-lacs
  private currentConditionTs: number;
  private currentForecastTs: number;

  constructor(private http: HttpClient) {
    if ( window.localStorage.getItem('currentConditionTs') != null ) {
      this.currentConditionTs = +window.localStorage.getItem('currentConditionTs')
    }
    if ( window.localStorage.getItem('currentForecastTs') != null ) {
      this.currentForecastTs = +window.localStorage.getItem('currentForecastTs')
    }
  }

  public getCurrentCondition(): Promise<any> {
    if (this.currentConditionTs === null ) {
      return this.getCurrentConditionFromServer();
    }
    else {
      // If last request is less than 10 minutes ago, use the saved data
      const nowInMinute = Math.round(new Date().getTime()/1000/60);
      const lastTsInMinute = Math.round(this.currentConditionTs/1000/60);
      console.debug(`nowInMinute: ${nowInMinute}, lastTsInMinute: ${lastTsInMinute}. Diff = ${nowInMinute - lastTsInMinute}`);
      if ( nowInMinute - lastTsInMinute < 10 ) {
        console.debug(`Return condition from local storage`);
        return new Promise<any>((resolve) => {
          resolve(JSON.parse(window.localStorage.getItem('currentCondition')))
        });
      }
      else {
        return this.getCurrentConditionFromServer();
      }
    }
  }

  private async getCurrentConditionFromServer(): Promise<any> {
    console.debug(`Return condition from server`);
    this.currentConditionTs = new Date().getTime();
    let data = await this.http.get<any>(`http://api.openweathermap.org/data/2.5/weather?id=${this.cityId}&appid=${this.apiKey}&units=metric&lang=fr`).toPromise();
    window.localStorage.setItem('currentCondition', JSON.stringify(data));
    window.localStorage.setItem('currentConditionTs', String(this.currentConditionTs));

    return new Promise<any>((resolve) => {
      resolve(data);
    });
  }



  private async getCurrentForecastFromServer(): Promise<any> {
    console.debug(`Return forecast from server`);
    this.currentForecastTs = new Date().getTime();
    let data = await this.http.get<any>(`http://api.openweathermap.org/data/2.5/forecast?id=${this.cityId}&appid=${this.apiKey}&units=metric&lang=fr`).toPromise();

    window.localStorage.setItem('currentForecast', JSON.stringify(data));
    window.localStorage.setItem('currentForecastTs', String(this.currentForecastTs));

    return new Promise<any>((resolve) => {
      resolve(data)
    });
  }

  public getForecast(): Promise<any> {
    if (this.currentForecastTs === null ) {
      return this.getCurrentForecastFromServer();
    }
    else {
      // If last request is less than 10 minutes ago, use the saved data
      console.debug(`Check time. Now: ${new Date().getTime()}, currentForecastTs: ${this.currentForecastTs}`);
      if (new Date().getTime() - this.currentForecastTs < 10 * 60 * 1000) {
        console.debug(`Return forecast from local storage`);
        return new Promise<any>((resolve) => {
          resolve(JSON.parse(window.localStorage.getItem('currentForecast')))
        });
      }
      else {
        console.debug(`Return forecast from server because more than 10 minutes`);
        return this.getCurrentForecastFromServer();
      }
    }
  }


  public static getForecastForTheRestOfTheDay(fullFcList: any): any[] {
    let fcList: any[] = [];

    const todaysDay = new Date().getDate();

    for (let fc of fullFcList) {
      if (new Date(+fc.dt * 1000).getDate() !== todaysDay) {
        break;
      }
      else {
        fcList.push(fc);
      }
    }

    return fcList;
  }

  public static getForecastForNextHours(fullFcList: any[]): any[] {
    let fcList: any[] = [];

    for (let i = 0; i <= 5; i++) {
      fcList.push(fullFcList[i]);
    }

    return fcList;
  }

  public static getForecastForTheNextDays(fullFcList: any[]): ForecastResume[] {
    let fcList: ForecastResume[] = [];

    let today = new Date();
    let nextDay = new Date();
    nextDay.setDate(new Date().getDate()+1); // yes it works of month and year...

    let currentDay = 0;

    for ( let i = 0; i < fullFcList.length; i++) {
      let fc = fullFcList[i];

      const fcDate = new Date(+fc.dt * 1000);
      if (fcDate.getDate() === today.getDate()) {
        // do nothing
      }
      else {
        let nextFcList: any[] = [];
        currentDay = fcDate.getDate();
        let j = i;
        for ( ; j < fullFcList.length; j++) {
          let nextFc = fullFcList[j];
          const nextFcDate = new Date(+nextFc.dt * 1000);
          if (nextFcDate.getDate() === currentDay) {
            nextFcList.push(nextFc);
          }
          else {
            break;
          }
        }

        if (nextFcList.length > 0) {
          fcList.push(this.CompileForADay(nextFcList));
        }

        i = j;
      }
    }

    return fcList;
  }

  private static CompileForADay(nextFcList: any[]): ForecastResume {
    let forecastResume: ForecastResume = {};

    forecastResume.date = new Date( +nextFcList[0].dt * 1000 );

    // Find max and min temp
    let maxTemp = -273;
    let minTemp = 100;
    for (let fc of nextFcList) {
      if (+fc.main.temp > maxTemp) {
        maxTemp = +fc.main.temp;
      }
      if (+fc.main.temp < minTemp) {
        minTemp = +fc.main.temp;
      }
    }

    // Find condition for mid-day
    const midDayIndex = Math.round(nextFcList.length / 2);
    forecastResume.midDayCondition = nextFcList[midDayIndex].weather[0].description;
    forecastResume.midDayIcon = nextFcList[midDayIndex].weather[0].icon;
    forecastResume.windSpeedAverage = Math.round(nextFcList[midDayIndex].wind.speed);
    forecastResume.windDirectionAverage = nextFcList[midDayIndex].wind.deg;

    forecastResume.maxTemp = Math.round(maxTemp);
    forecastResume.minTemp = Math.round(minTemp);

    return forecastResume;
  }
}

