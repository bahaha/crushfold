import { byText, Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { ModalConfig } from './config';
import { ModalRef } from './modal-ref';
import { ModalComponent } from './modal.component';
import {
  defaultModalConfigFactory,
  MODAL_CONFIG,
  MODAL_CONTENT_NODES,
} from './tokens';

describe('ModalComponent', () => {
  let spectator: Spectator<ModalComponent>;
  const createComponent = createComponentFactory({
    component: ModalComponent,
    declarations: [],
    providers: [
      {
        provide: ModalRef,
        useFactory: () => ({ close: jest.fn(), backdropClick$: new Subject() }),
      },
      {
        provide: MODAL_CONFIG,
        useFactory: () => defaultModalConfigFactory(document.body),
      },
      {
        provide: MODAL_CONTENT_NODES,
        useValue: [],
      },
    ],
  });

  afterEach(() => {
    const containerEls = document.querySelectorAll('.cf-modal--content');
    const backdropEls = document.querySelectorAll('.cf-modal--backdrop');

    [...Array.from(containerEls), ...Array.from(backdropEls)]
      .filter(Boolean)
      .forEach((el) => el.remove());
  });

  function withConfig(config: Partial<ModalConfig> = {}) {
    return {
      providers: [
        {
          provide: MODAL_CONFIG,
          useValue: { ...defaultModalConfigFactory(document.body), ...config },
        },
      ],
    };
  }

  it('should create', () => {
    spectator = createComponent();
    expect(spectator.component).toBeTruthy();
  });

  it('should set className to its class', () => {
    spectator = createComponent(
      withConfig({ className: 'iam-class the-second-class  ' })
    );
    const host = spectator.query('.iam-class.the-second-class', { root: true });

    expect(host).toBeTruthy();
    expect(host).toBe(spectator.fixture.nativeElement);
  });

  it('should place nodes into modal content', () => {
    spectator = createComponent({
      providers: [
        {
          provide: MODAL_CONTENT_NODES,
          useValue: [
            document.createTextNode('Hi, there. '),
            document.createTextNode('Modal content here.'),
          ],
        },
      ],
    });

    expect(
      spectator.query(byText('Hi, there. Modal content here.'))
    ).toBeTruthy();
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

  describe('when enableClose (default), should call #close', () => {
    beforeEach(() => (spectator = createComponent()));

    it('on keyboard ESCAPE', () => {
      const { close } = spectator.inject(ModalRef);
      spectator.dispatchKeyboardEvent(document.body, 'keyup', 'Enter');
      expect(close).not.toBeCalled();

      spectator.dispatchKeyboardEvent(document.body, 'keyup', 'Escape');
      expect(close).toBeCalled();
    });

    it('on click backdrop', () => {
      const { close } = spectator.inject(ModalRef);

      spectator.dispatchMouseEvent('.cf-modal--content', 'click');
      expect(close).not.toBeCalled();

      spectator.dispatchMouseEvent('.cf-modal--backdrop', 'click');
      expect(close).toBeCalled();
    });
  });

  describe('when enableClose is disabled, should not call #close', () => {
    beforeEach(
      () => (spectator = createComponent(withConfig({ enableClose: false })))
    );

    it('on keyboard ESCAPE', () => {
      const { close } = spectator.inject(ModalRef);
      spectator.dispatchKeyboardEvent(document.body, 'keyup', 'Escape');
      expect(close).not.toBeCalled();
    });

    it('on click backdrop', () => {
      const { close } = spectator.inject(ModalRef);
      spectator.dispatchMouseEvent('.cf-modal--backdrop', 'click');
      expect(close).not.toBeCalled();
    });
  });
});
