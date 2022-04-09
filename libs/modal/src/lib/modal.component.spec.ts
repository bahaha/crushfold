import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { ModalConfig } from './config';
import { ModalRef } from './modal-ref';
import { ModalComponent } from './modal.component';
import { defaultModalConfigFactory, MODAL_CONFIG } from './tokens';

describe('ModalComponent', () => {
  let spectator: Spectator<ModalComponent>;
  const createComponent = createComponentFactory({
    component: ModalComponent,
    declarations: [],
    providers: [
      {
        provide: ModalRef,
        useFactory: () => ({ backdropClick$: new Subject() }),
      },
      {
        provide: MODAL_CONFIG,
        useFactory: defaultModalConfigFactory,
      },
    ],
  });

  function withConfig(config: Partial<ModalConfig> = {}) {
    return {
      providers: [
        {
          provide: MODAL_CONFIG,
          useValue: { ...defaultModalConfigFactory(), ...config },
        },
      ],
    };
  }

  it('should create', () => {
    spectator = createComponent();
    expect(spectator.component).toBeTruthy();
  });

  describe('when backdrop is enabled (default)', () => {
    beforeEach(() => (spectator = createComponent()));

    it('should create backdrop, and set its class', () => {
      expect(spectator.query('.cf-modal--backdrop')).toBeTruthy();
      expect(spectator.query('.cf-modal--backdrop')).toHaveClass(
        'cf-modal--backdrop-visible'
      );
    });

    it('backdropClick$ should point to the backdrop element', () => {
      let hasBackdropClicked = false;
      spectator
        .inject(ModalRef)
        .backdropClick$.subscribe(() => (hasBackdropClicked = true));

      spectator.dispatchMouseEvent('.cf-modal--backdrop', 'click');
      expect(hasBackdropClicked).toBe(true);
    });
  });

  describe('when backdrop is disabled', () => {
    beforeEach(
      () => (spectator = createComponent(withConfig({ backdrop: false })))
    );

    it('should NOT create backdrop', () => {
      expect(spectator.query('.cf-modal--backdrop')).toBeHidden();
      expect(spectator.query('.cf-modal--backdrop-visible')).toBeFalsy();
    });

    it('backdropClick$ should point to the document body', () => {
      let hasBackdropClicked = false;
      spectator
        .inject(ModalRef)
        .backdropClick$.subscribe(() => (hasBackdropClicked = true));

      spectator.dispatchMouseEvent(document.body, 'click');
      expect(hasBackdropClicked).toBe(true);
    });
  });
});
