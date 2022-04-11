import { ElementRef, ViewContainerRef } from '@angular/core';

export interface GlobalModalConfig {
  id?: string;
  backdrop: boolean;
  enableClose: boolean;
  className?: string;
  container: HTMLElement | ElementRef<HTMLElement>;
  onClose?: () => void | undefined;
}

export interface ModalConfig<Data = any> extends GlobalModalConfig {
  vcr: ViewContainerRef;
  data?: Data;
}
