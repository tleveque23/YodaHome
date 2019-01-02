import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { promise } from 'selenium-webdriver';

@Injectable({
  providedIn: 'root'
})
export class OpenWeatherMapService {

  // Forecast
  // http://api.openweathermap.org/data/2.5/forecast?id=6138501&appid=5d484165420d15f2510af0084aaa556c&units=metric&lang=fr
  // Current condition
  // http://api.openweathermap.org/data/2.5/weather?id=6138501&appid=5d484165420d15f2510af0084aaa556c&units=metric&lang=fr

  private apiKey = '5d484165420d15f2510af0084aaa556c';
  // private cityId = '6138501'; // St-Jerome
  // private cityId = '6077445'; // Tremblant
  private cityId = '6137745'; // Ste-Anne-des-lacs
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
      if (new Date().getTime() - this.currentConditionTs < 10 * 60 * 1000) {
        console.debug(`Return condition from local storage`);
        return new Promise<any>((resolve, reject) => {
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

    return new Promise<any>((resolve, reject) => {
      resolve(data);
    });
  }



  private async getCurrentForecastFromServer(): Promise<any> {
    console.debug(`Return forecast from server`);
    this.currentConditionTs = new Date().getTime();
    let data = await this.http.get<any>(`http://api.openweathermap.org/data/2.5/forecast?id=${this.cityId}&appid=${this.apiKey}&units=metric&lang=fr`).toPromise();

    window.localStorage.setItem('currentForecast', JSON.stringify(data));
    window.localStorage.setItem('currentForecastTs', String(this.currentConditionTs));

    return new Promise<any>((resolve, reject) => {
      resolve(data)
    });
  }

  public getForecast(): Promise<any> {
    if (this.currentForecastTs === null ) {
      return this.getCurrentForecastFromServer();
    }
    else {
      // If last request is less than 10 minutes ago, use the saved data
      if (new Date().getTime() - this.currentForecastTs < 10 * 60 * 1000) {
        console.debug(`Return forecast from local storage`);
        return new Promise<any>((resolve, reject) => {
          resolve(JSON.parse(window.localStorage.getItem('currentForecast')))
        });
      }
      else {
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

  public static getForecastForTheNextDays(fullFcList: any): any[] {
    let fcList: any[] = [];

    let nextDay = new Date();
    nextDay.setDate(new Date().getDate()+1); // yes it works of month and year...

    for (let fc of fullFcList) {
      if (new Date(+fc.dt * 1000).getDate() !== nextDay.getDate()) {
        // do nothing
      }
      else {

      }
    }

    return fcList;
  }
}

