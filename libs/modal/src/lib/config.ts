import { ElementRef, ViewContainerRef } from '@angular/core';
import { Observable } from 'rxjs';

type GuardFn = (
  result?: unknown
) => boolean | Promise<boolean> | Observable<boolean>;

export interface GlobalModalConfig {
  id?: string;
  backdrop: boolean;
  enableClose: boolean;
  className?: string;
  container: HTMLElement | ElementRef<HTMLElement>;
  onClose?: () => void | undefined;
  canClose?: GuardFn | GuardFn[];
}

export interface ModalConfig<Data = any> extends GlobalModalConfig {
  vcr: ViewContainerRef;
  data?: Data;
}
