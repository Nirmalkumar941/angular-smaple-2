import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { Events, OverlayEventBusService } from './services/event-bus.service';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit, OnDestroy {

  httpRequestSub: Subscription;
  httpResponseSub: Subscription;
  enabled = false;
  queue = [];
  timerId: number = null;
  timerHideId: number = null;
  messageContent = '';
  delay = 500;
  showCustomizedLoader: boolean;

  constructor(private eventBus: OverlayEventBusService) {
    eventBus.showLoader = this.showLoader.bind(this);
    eventBus.hideCustomLoader = this.hideCustomLoader.bind(this);
    eventBus.hideAllLoaders = this.hideAllLoaders.bind(this);
    eventBus.isLoaderActive = this.isLoaderActive.bind(this);
  }

  showLoader(message: string) {
    this.messageContent = message;
    this.showCustomizedLoader = true;
    // this.enabled = false;
  }
  hideCustomLoader() {
    this.showCustomizedLoader = false;
  }
  hideAllLoaders() {
    this.showCustomizedLoader = false;
    this.enabled = false;
    this.queue = [];
  }

  isLoaderActive() {
    if (this.queue.length) {
      return true;
    } else {
      return false;
    }
  }
  ngOnInit() {
    this.showCustomizedLoader = false;
    // Handle request
    this.httpRequestSub = this.eventBus.on(Events.httpRequest, (() => {
      this.queue.push({});
      if (this.queue.length === 1) {
        // Only show if we have an item in the queue after the delay time
        setTimeout(() => {
          if (this.queue.length) { this.enabled = true; }
        }, this.delay);
      }
    }));

    // Handle response
    this.httpResponseSub = this.eventBus.on(Events.httpResponse, (() => {
      this.queue.pop();
      if (this.queue.length === 0) {
        // Since we don't know if another XHR request will be made, pause before
        // hiding the overlay. If another XHR request comes in then the overlay
        // will stay visible which prevents a flicker
        setTimeout(() => {
          // Make sure queue is still 0 since a new XHR request may have come in
          // while timer was running
          if (this.queue.length === 0) { this.enabled = false; }
        }, this.delay);
      }
    }));
  }

  ngOnDestroy() {
    this.httpRequestSub.unsubscribe();
    this.httpResponseSub.unsubscribe();
  }

}
