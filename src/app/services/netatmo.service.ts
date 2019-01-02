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


  private getToken(): Observable<any> {

    let httpParams = new HttpParams()
      .append("grant_type", "password")
      .append("client_id", this.clientId)
      .append("client_secret", this.clientSecret)
      .append("username", "tleveque@gmail.com")
      .append("password", "Jqw-4oG-qqS-Up2")
      .append("scope", "read_station");

    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", "application/x-www-form-urlencoded");

    return this.http.post<any>('https://api.netatmo.com/oauth2/token', httpParams.toString(), {headers: headers});
  }

  /**
   * Here we use the async await pattern instead of using complex pipe / mergeMap.
   * We don't really need any kind of subscription. We only need to get the data from the server.
   * If there is no token, we do the call for the token and we wait for the response.
   * Once we have the response, we set some properties and then we call the server again to get the data using the token.
   */
  public async getWeatherData(): Promise<any> {
    if (!this.token) {

      // Get  the token and wait for the response
      let data = await this.getToken().toPromise();

      this.token = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiredTimestamp = new Date().getTime() + (data.expires_in * 1000);

      return this.getData().toPromise();
    }
    else if (!this.isTokenExpired()) {
      return this.getData().toPromise();
    }
    else {
      // Token expired. Use the refresh token to get a new token
      let data = await this.getRefreshToken().toPromise();

      this.token = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiredTimestamp = new Date().getTime() + (data.expires_in * 1000);

      return this.getData().toPromise();
    }
  }

  private getData(): Observable<any> {
    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", "application/x-www-form-urlencoded");

    let httpParams = new HttpParams()
      .append("access_token", this.token);

    return this.http.post('https://api.netatmo.net/api/getstationsdata', httpParams.toString(), {headers: headers});
  }

  private isTokenExpired(): boolean {
    console.debug(`Current ts: ${new Date().getTime()}, expiredTimestamp: ${this.expiredTimestamp}`);
    return new Date().getTime() > this.expiredTimestamp;
  }

  private getRefreshToken() {
    let httpParams = new HttpParams()
      .append("grant_type", "refresh_token")
      .append("client_id", this.clientId)
      .append("client_secret", this.clientSecret)
      .append("refresh_token", this.refreshToken);

    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", "application/x-www-form-urlencoded");

    return this.http.post<any>('https://api.netatmo.com/oauth2/token', httpParams.toString(), {headers: headers});
  }
}
