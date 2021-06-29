import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscription, timer } from 'rxjs';
import { AppComponent } from '../app.component';
import { Utils } from '../utils';

@Injectable({
  providedIn: 'root'
})
export class EcobeService {

  public readyEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  private appKey = 'MyXHwePh1vMYahKKqSM1mxOibWEdcV6p';
  private token: string;
  private refreshToken: string;
  private authorizationToken: string;

  private authorizationTimerSubscription: Subscription;

  constructor(private http: HttpClient) {
    if (window.localStorage.getItem('netatmo_token')) {
      this.token = window.localStorage.getItem('netatmo_token');
      this.refreshToken = window.localStorage.getItem('netatmo_refresh_token')
    }
  }

  public initAuthorization() {
    if (!this.token && !this.refreshToken) {
      this.requestAccess().subscribe( (response) => {
        console.log('Request access response:')
        console.log(response);
        this.authorizationToken = response.code;
        console.info(`Ecobe PIN: ${response.ecobeePin}`);
        console.log('Now go to https://www.ecobee.com/consumerportal, log-in and go to My Apps and Add Application and enter this token');

        this.authorizationTimerSubscription = timer(5000, Utils.getMillisForMinutes(1)).subscribe(() => this.getAuthorization());
      });
    }
    else {
      console.debug(`We already have acces with token ${this.token} and refresh toke ${this.refreshToken}`);
      this.readyEmitter.emit(true);
    }
  }

  private requestAccess(): Observable<any> {

    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", "application/json;charset=UTF-8");

    return this.http.get<any>(`https://api.ecobee.com/authorize?response_type=ecobeePin&client_id=${this.appKey}&scope=smartWrite`, {headers: headers});
  }

  private getAuthorization() {
    this.http.post<any>(`https://api.ecobee.com/token?grant_type=ecobeePin&code=${this.authorizationToken}&client_id=${this.appKey}`, null).subscribe((response) => {
      console.info(`Got the token!! ${response.access_token}`);
      this.authorizationTimerSubscription.unsubscribe();
      this.token = response.access_token;
      this.refreshToken = response.refresh_token;
      window.localStorage.setItem('netatmo_token', this.token);
      window.localStorage.setItem('netatmo_refresh_token', this.refreshToken);
      this.readyEmitter.emit(true);
    }, (err) => {
      console.info(`Authorization pending: ${err}`);
    })
  }

  public setFanInterval(interval: number) {

    console.debug(`Call set interval ${interval}`);

    const body = {
      "selection": {
        "selectionType": "registered",
        "selectionMatch": ""
      },
      "thermostat": {
        "settings": {
          "fanMinOnTime": "" + interval
        }
      }
    };

    let headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json;charset=UTF-8');
    headers = headers.append('Authorization', 'Bearer ' + this.token);

    this.http.post('https://api.ecobee.com/1/thermostat?format=json', body, {headers: headers})
      .subscribe( response => {
        console.log('Success!');
        console.log(response);
      }, () => {
        console.log('Error, try refreshing the token');
        this.refreshTheToken( () => {
          this.setFanInterval(interval);
        });
      })
  }

  private refreshTheToken(onCompleteCallback?: () => void) {

    this.http.post(`https://api.ecobee.com/token?grant_type=refresh_token&refresh_token=${this.refreshToken}&client_id=${this.appKey}`, null)
      .subscribe( (response: any) => {

        console.info(`Got the token!! ${response.access_token}`);
        this.token = response.access_token;
        this.refreshToken = response.refresh_token;
        window.localStorage.setItem('netatmo_token', this.token);
        window.localStorage.setItem('netatmo_refresh_token', this.refreshToken);

        if (onCompleteCallback) {
          onCompleteCallback();
        }
      })

  }
}
