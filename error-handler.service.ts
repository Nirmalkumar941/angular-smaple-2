import { Injectable, ErrorHandler, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { GrowlerService, GrowlerMessageType } from '../Toaster/growler.service';
import { DataTransferService } from './data-transfer.service';
import { OverlayEventBusService } from '../overlay/services/event-bus.service';
import { throwError } from 'rxjs';

@Injectable()
export class ErrorHandlerService extends ErrorHandler {
  public errorMessage = '';
  public isTokenRenewalRequired = false;
  // private dataService: DataShareService;
  constructor(
    private ngZone: NgZone,
    private growler: GrowlerService,
    private dataTransferService: DataTransferService,
    private overlayEventBusService: OverlayEventBusService
  ) {
    super();
  }

  // auto error handler for the client side events for errors.
  public handleError(error: any): void {
    this.ngZone.run(() => {
      // super.handleError(error);
      console.log(error);
      if (error instanceof HttpErrorResponse) {
        // http error are handled by separate method so, nothing required to do here -- Note: do not remove this IF condition
      } else if (error instanceof ErrorEvent) {
        //  this.ng6NotificationMgr.errorToastr(error.message, 'Client Error!', toastrSettingsWithUserAction);
        this.growler.growl(
          error.message,
          'Client error!',
          GrowlerMessageType.Danger
        );
      } else {
        // this.ng6NotificationMgr.errorToastr(error.message, 'Unknown Error!', toastrSettingsWithUserAction);
        this.growler.growl(
          error.message,
          'Unknown error!',
          GrowlerMessageType.Danger
        );
      }
    });
  }

  // this is required for handling the HTTP errors by calling it manually through interceptor

  public handleHttpError(error: any): any {
    if (error instanceof HttpErrorResponse) {
      this.overlayEventBusService.hideAllLoaders();
      if (error.status == 0) {
        this.growler.growl('Server Error', 'GCSP', GrowlerMessageType.Danger);
      } else {
        if (error.error) {
          const responseMessage = error.error;
          if (
            responseMessage &&
            responseMessage.messages &&
            responseMessage.messages.filter(
              (x) => x.messageType === 'WARRNING' || x.messageType === 'ERROR'
            ).length > 0
          ) {
            const errorMessage = this.dataTransferService.getConsolidatedMessage(
              responseMessage.messages.filter((x) => x.messageType === 'ERROR')
            );
            const warnMessage = this.dataTransferService.getConsolidatedMessage(
              responseMessage.messages.filter(
                (x) => x.messageType === 'WARRNING'
              )
            );
            const errorDescriptionMessage = this.dataTransferService.getConsolidatedMessageDescription(
              responseMessage.messages.filter((x) => x.messageType === 'ERROR')
            );

            if (errorMessage.length > 0) {
              this.growler.growl(
                errorMessage,
                'GCSP',
                GrowlerMessageType.Danger,
                errorDescriptionMessage
              );
            }

            if (warnMessage.length > 0) {
              this.growler.growl(
                warnMessage,
                'GCSP',
                GrowlerMessageType.Warning
              );
            }
          }
        } else {
          this.growler.growl('Server Error', 'GCSP', GrowlerMessageType.Danger);
        }
      }
    }
    return throwError(error);
  }
}
