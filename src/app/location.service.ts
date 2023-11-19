import { Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { rxState } from "@rx-angular/state";
import { Subject } from "rxjs";
import { filter, shareReplay, tap } from "rxjs/operators";

export const LOCATIONS: string = "locations";

@Injectable()
export class LocationService {
  addLocation$$ = new Subject<string>();
  removeLocation$$ = new Subject<string>();

  locationAdded$ = this.addLocation$$.pipe(
    filter((location) => {
      const locations = this.state.get("locations");
      return !locations.includes(location);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  locationRemoved$ = this.removeLocation$$.pipe(
    filter((location) => {
      const locations = this.state.get("locations");
      return locations.includes(location);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private state = rxState<{ locations: string[] }>(({ set, connect }) => {
    // set initial state with cached data
    set({
      locations: (() => {
        let locString = localStorage.getItem(LOCATIONS);
        const locArr: string[] = JSON.parse(locString || "[]");

        return locArr;
      })(),
    });

    connect("locations", this.locationAdded$, ({ locations }, location) => {
      return locations.concat(location);
    });

    connect("locations", this.locationRemoved$, ({ locations }, location) => {
      return locations.filter((loc) => loc !== location);
    });
  });

  locations$ = this.state.select("locations");

  constructor() {
    this.locations$
      .pipe(
        tap((locations) => {
          localStorage.setItem(LOCATIONS, JSON.stringify(locations));
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  addLocation(zipcode: string) {
    this.addLocation$$.next(zipcode);
  }

  removeLocation(zipcode: string) {
    this.removeLocation$$.next(zipcode);
  }
}
