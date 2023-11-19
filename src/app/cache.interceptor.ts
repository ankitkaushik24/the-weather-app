import { HttpResponse, type HttpInterceptorFn } from "@angular/common/http";
import { InjectionToken, inject } from "@angular/core";
import { of } from "rxjs";
import { tap } from "rxjs/operators";

const CACHE_VALIDITY_MS = new InjectionToken<number>("cache.invalidity.ms", {
  providedIn: "root",
  factory() {
    const twoHours = 2 * 60 * 60 * 1000;
    return twoHours;
  },
});

type IPayload = { time: number; data: unknown };

const globalCache = {
  has(key: string) {
    return !!localStorage.getItem(key);
  },
  get(key: string): IPayload {
    return JSON.parse(localStorage.getItem(key));
  },
  set(key: string, payload: IPayload) {
    localStorage.setItem(key, JSON.stringify(payload));
  },
  delete(key: string) {
    localStorage.removeItem(key);
  },
};

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheValidityMs = inject(CACHE_VALIDITY_MS);

  if (req.method !== "GET") {
    return next(req);
  }
  if (globalCache.has(req.urlWithParams)) {
    const { data, time } = globalCache.get(req.urlWithParams);
    const elapsedMs = Date.now() - time;
    if (elapsedMs < cacheValidityMs) {
      return of(new HttpResponse(data));
    } else {
      globalCache.delete(req.urlWithParams);
    }
  }
  return next(req).pipe(
    tap((res) => {
      if (res instanceof HttpResponse) {
        globalCache.set(req.urlWithParams, { data: res, time: Date.now() });
      }
    })
  );
};
