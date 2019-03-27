import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscription, timer } from 'rxjs';
import { AppComponent } from '../app.component';
import { Utils } from '../utils';

@Injectable({
  providedIn: 'root'
})
export class EcobeService {

  private appKey = 'MyXHwePh1vMYahKKqSM1mxOibWEdcV6p';
  private token: string;
  private refreshToken: string;
  private authorizationToken: string;

  private authorizationTimerSubscription: Subscription;

  constructor(private http: HttpClient) { }

  public getThermostatData() {
    if (!this.token && !this.refreshToken) {
      this.requestAccess().subscribe( (response) => {
        this.authorizationToken = response.code;
        console.info(`Ecobe PIN: ${response.ecobeePin}`)

        this.authorizationTimerSubscription = timer(5000, Utils.getMillisForMinutes(1)).subscribe(() => this.getAuthorization());

      });
    }
  }

  private requestAccess(): Observable<any> {

    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", "application/json;charset=UTF-8");

    return this.http.get<any>(`https://api.ecobee.com/authorize?response_type=ecobeePin&client_id=${this.appKey}&scope=smartWrite`, {headers: headers});
  }

  private getAuthorization() {
    this.http.post<any>(`https://api.ecobee.com/token?grant_type=ecobeePin&code=${this.authorizationToken}&client_id=${this.appKey}`, null).subscribe( (response) => {
      console.info(`Got the token!! ${response.access_token}`);
      this.authorizationTimerSubscription.unsubscribe();
      }, (err) => {
      console.info(`Authorization pending: ${err}`);
    })
  }
}
