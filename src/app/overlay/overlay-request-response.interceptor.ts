import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import {  delay, catchError, map } from 'rxjs/operators';
import { EmitEvent, Events, OverlayEventBusService } from './services/event-bus.service';
import { skipLoaderForUrls } from 'src/app/configurations/app-settings';


@Injectable()
export class OverlayRequestResponseInterceptor implements HttpInterceptor {

  constructor(private eventBus: OverlayEventBusService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let loadedNeeded = true;
    skipLoaderForUrls.forEach(element => {
      if (req.url.includes(element)) {
        loadedNeeded = false;
      }
    });

    if (loadedNeeded) {
      const randomTime = this.getRandomIntInclusive(0, 1500);
      this.eventBus.emit(new EmitEvent(Events.httpRequest));
      return next
        .handle(req)
        .pipe(
          delay(randomTime),  // Simulate random Http call delays
          map(event => {
            if (event instanceof HttpResponse) {
              this.eventBus.emit(new EmitEvent(Events.httpResponse));
            }
            return event;
          }),
          catchError(error => {
            this.eventBus.emit(new EmitEvent(Events.httpResponse));
            return throwError(error);
          }));
    } else {
      return next
        .handle(req);
    }

  }

  getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
  }

}
