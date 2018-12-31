import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { concat, Observable } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetatmoService {

  private clientId = '5c267f626c3203be7b90df55';
  private clientSecret = 'kMwxe4gn0hp86Fxfvll4zsqcpKMD';

  private token: string;
  private refreshToken: string;
  private expiredTimestamp: number;

  constructor(private http: HttpClient) { }


  private connect(): Observable<any> {

    let httpParams = new HttpParams()
      .append("grant_type", "password")
      .append("client_id", this.clientId)
      .append("client_secret", this.clientSecret)
      .append("username", "tleveque@gmail.com")
      .append("password", "Jqw-4oG-qqS-Up2")
      .append("scope", "read_station");

    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", "application/x-www-form-urlencoded");

    return this.http.post<any>('https://api.netatmo.com/oauth2/token', httpParams.toString(), {headers: headers})
      ;
  }

  public getWeatherData(): Observable<any> {
    if (!this.token) {
      return this.connect().pipe(
        concatMap( (tokenResponse) => {
          this.token = tokenResponse.access_token;
          this.refreshToken = tokenResponse.refresh_token;
          this.expiredTimestamp = new Date().getTime() + (tokenResponse.expires_in * 1000);

          return this.getData();
        })
      );
    }
    else {
      return this.getData();
    }
  }

  private getData(): Observable<any> {
    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", "application/x-www-form-urlencoded");

    let httpParams = new HttpParams()
      .append("access_token", this.token);

    return this.http.post('https://api.netatmo.net/api/getstationsdata', httpParams.toString(), {headers: headers});
  }
}
