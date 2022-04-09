import { InjectionToken } from '@angular/core';
import { ModalConfig } from './config';

export const defaultModalConfigFactory = (): ModalConfig => ({
  backdrop: true,
});

export const MODAL_CONFIG = new InjectionToken<ModalConfig>(
  'Modal config token',
  {
    providedIn: 'root',
    factory: defaultModalConfigFactory,
  }
);
