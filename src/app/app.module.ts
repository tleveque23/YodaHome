import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule, MatDialogModule } from '@angular/material';
import { NetatmoService } from './services/netatmo.service';
import { HttpClientModule } from '@angular/common/http';
import { OpenWeatherMapService } from './services/open-weather-map.service';
import { registerLocaleData } from '@angular/common';
import localeFrCa from '@angular/common/locales/fr-CA';
import localeFrCaExtra from '@angular/common/locales/extra/fr-CA';
import { SunDialogComponent } from './sun-dialog/sun-dialog.component';

registerLocaleData(localeFrCa, localeFrCaExtra);

@NgModule({
  declarations: [
    AppComponent,
    SunDialogComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule
  ],
  providers: [
    NetatmoService,
    OpenWeatherMapService
  ],
  entryComponents: [
    SunDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
