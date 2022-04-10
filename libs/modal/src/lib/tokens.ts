import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';
import { ModalConfig } from './config';

export const MODAL_CONTENT_NODES = new InjectionToken('nodes of modal content');

export const defaultModalConfigFactory = (
  container?: ModalConfig['container']
): ModalConfig => ({
  backdrop: true,
  enableClose: true,
  container: container ?? inject(DOCUMENT).body,

  vcr: null,
});

export const GLOBAL_MODAL_CONFIG = new InjectionToken('global modal config');

export const MODAL_CONFIG = new InjectionToken<ModalConfig>(
  'Modal config token',
  {
    providedIn: 'root',
    factory: defaultModalConfigFactory,
  }
);
