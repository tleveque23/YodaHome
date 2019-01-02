import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { NetatmoService } from './services/netatmo.service';
import { HttpClientModule } from '@angular/common/http';
import { OpenWeatherMapService } from './services/open-weather-map.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  providers: [
    NetatmoService,
    OpenWeatherMapService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
