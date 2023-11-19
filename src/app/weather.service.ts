import { Injectable, Signal } from "@angular/core";
import { Observable, forkJoin, of } from "rxjs";

import { HttpClient } from "@angular/common/http";
import { rxState } from "@rx-angular/state";
import {
  catchError,
  filter,
  first,
  map,
  mergeMap,
  switchMap,
} from "rxjs/operators";
import { ConditionsAndZip } from "./conditions-and-zip.type";
import { CurrentConditions } from "./current-conditions/current-conditions.type";
import { Forecast } from "./forecasts-list/forecast.type";
import { LocationService } from "./location.service";

@Injectable()
export class WeatherService {
  static URL = "https://api.openweathermap.org/data/2.5";
  static APPID = "5a4b2d457ecbef9eb2a71e480b947604";
  static ICON_URL =
    "https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/";

  initialLocations$ = this.locationService.locations$.pipe(first());

  initialConditionsAndZip$ = this.initialLocations$.pipe(
    switchMap((locations) => {
      const toConditionsAndZip = (zip) => (conditions) => ({
        zip,
        data: conditions,
      });

      const conditionsAndZipObservables$ = locations.map((zipcode) =>
        this.retrieveConditions(zipcode).pipe(map(toConditionsAndZip(zipcode)))
      );

      return forkJoin(conditionsAndZipObservables$).pipe(
        map((responses) => responses.filter(({ data }) => !!data))
      );
    })
  );

  addedConditionsAndZip$ = this.locationService.locationAdded$.pipe(
    mergeMap((zip) =>
      this.retrieveConditions(zip).pipe(
        filter((response) => !!response),
        map((conditions) => ({ zip, data: conditions }))
      )
    )
  );

  private state = rxState<{ conditionsAndZipList: ConditionsAndZip[] }>(
    ({ set, connect }) => {
      set({ conditionsAndZipList: [] });

      connect(
        "conditionsAndZipList",
        this.initialConditionsAndZip$,
        ({ conditionsAndZipList }, initialConditionsAndZip) => {
          return (conditionsAndZipList || []).concat(initialConditionsAndZip);
        }
      );

      connect(
        "conditionsAndZipList",
        this.addedConditionsAndZip$,
        ({ conditionsAndZipList }, currentConditionsAndZip) => {
          return (conditionsAndZipList || []).concat(currentConditionsAndZip);
        }
      );

      connect(
        "conditionsAndZipList",
        this.locationService.locationRemoved$,
        ({ conditionsAndZipList }, removedLocation) => {
          return (conditionsAndZipList || []).filter(
            (conditionsAndZip) => conditionsAndZip.zip !== removedLocation
          );
        }
      );
    }
  );

  private currentConditions = this.state.signal("conditionsAndZipList");

  constructor(
    private http: HttpClient,
    private locationService: LocationService
  ) {}

  retrieveConditions(zipcode: string) {
    return this.addCurrentConditions(zipcode).pipe(
      catchError((err) => {
        return of(null);
      })
    );
  }

  addCurrentConditions(zipcode: string) {
    // Here we make a request to get the current conditions data from the API. Note the use of backticks and an expression to insert the zipcode
    return this.http.get<CurrentConditions>(
      `${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`
    );
  }

  getCurrentConditions(): Signal<ConditionsAndZip[]> {
    return this.currentConditions;
  }

  getForecast(zipcode: string): Observable<Forecast> {
    // Here we make a request to get the forecast data from the API. Note the use of backticks and an expression to insert the zipcode
    return this.http.get<Forecast>(
      `${WeatherService.URL}/forecast/daily?zip=${zipcode},us&units=imperial&cnt=5&APPID=${WeatherService.APPID}`
    );
  }

  getWeatherIcon(id): string {
    if (id >= 200 && id <= 232)
      return WeatherService.ICON_URL + "art_storm.png";
    else if (id >= 501 && id <= 511)
      return WeatherService.ICON_URL + "art_rain.png";
    else if (id === 500 || (id >= 520 && id <= 531))
      return WeatherService.ICON_URL + "art_light_rain.png";
    else if (id >= 600 && id <= 622)
      return WeatherService.ICON_URL + "art_snow.png";
    else if (id >= 801 && id <= 804)
      return WeatherService.ICON_URL + "art_clouds.png";
    else if (id === 741 || id === 761)
      return WeatherService.ICON_URL + "art_fog.png";
    else return WeatherService.ICON_URL + "art_clear.png";
  }
}
