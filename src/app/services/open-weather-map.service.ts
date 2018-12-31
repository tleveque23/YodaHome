import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OpenWeatherMapService {

  // Forecast
  // http://api.openweathermap.org/data/2.5/forecast?id=6138501&appid=5d484165420d15f2510af0084aaa556c&units=metric&lang=fr
  // Current condition
  // http://api.openweathermap.org/data/2.5/weather?id=6138501&appid=5d484165420d15f2510af0084aaa556c&units=metric&lang=fr

  private apiKey = '5d484165420d15f2510af0084aaa556c';

  constructor(private http: HttpClient) { }
}
