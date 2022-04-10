import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentFactoryResolver,
  InjectionToken,
  Injector,
} from '@angular/core';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { ModalRef } from './modal-ref';
import { ModalComponent } from './modal.component';
import { ModalService } from './modal.service';
import {
  GLOBAL_MODAL_CONFIG,
  MODAL_CONFIG,
  MODAL_CONTENT_NODES,
} from './tokens';

class MockComponentFactory extends ComponentFactoryResolver {
  comp = {
    destroy: jest.fn(),
    hostView: {
      destroy: jest.fn(),
      rootNodes: [document.createTextNode('Hi, there.')],
    },
    location: {
      nativeElement: 'Hi, there.',
    },
  };

  modalComp = {
    destroy: jest.fn(),
    hostView: {
      destroy: jest.fn(),
      rootNodes: [document.createTextNode('I am a modal.')],
    },
    location: {
      nativeElement: '<div class="cf-modal--backdrop">I am a modal.</div>',
    },
  };

  factory = {
    create: jest
      .fn()
      .mockReturnValueOnce(this.comp)
      .mockReturnValueOnce(this.modalComp),
  };

  resolveComponentFactory = jest.fn().mockReturnValue(this.factory);
}

describe('ModalService', () => {
  let spectator: SpectatorService<ModalService>;
  let service: ModalService;
  let mockCompFactory: MockComponentFactory;

  const createService = createServiceFactory({
    service: ModalService,
    mocks: [ApplicationRef],
    providers: [
      { provide: GLOBAL_MODAL_CONFIG, useValue: {} },
      { provide: ComponentFactoryResolver, useClass: MockComponentFactory },
      {
        provide: DOCUMENT,
        useFactory: () => ({
          body: {
            appendChild: jest.fn(),
          },
        }),
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
    mockCompFactory = spectator.inject<MockComponentFactory>(
      ComponentFactoryResolver as any
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('using component', () => {
    class DummyComponent {}

    it('should open it', () =>
      expect(service.open(DummyComponent)).toBeTruthy());

    it('should instanciate component', () => {
      service.open(DummyComponent);

      expect(mockCompFactory.resolveComponentFactory).toBeCalledTimes(2);
      expect(mockCompFactory.resolveComponentFactory.mock.calls[0][0]).toBe(
        DummyComponent
      );
      expect(mockCompFactory.resolveComponentFactory.mock.calls[1][0]).toBe(
        ModalComponent
      );
    });

    it('should get the config from modal component', () => {
      service.open(DummyComponent, { backdrop: false });
      const modalInjector = mockCompFactory.factory.create.mock.calls[1][0];

      expect(modalInjector.get(MODAL_CONFIG).backdrop).toBe(false);
    });

    it('should add modal to modals', () => {
      const modalRef = service.open(DummyComponent);
      expect(service.modals.length).toBe(1);
      expect(service.modals).toContain(modalRef);
    });

    it('should fill component and its injector', () => {
      const modalRef = service.open(DummyComponent, { data: 'test' });
      const contentInjector = mockCompFactory.factory.create.mock.calls[1][0];

      const dummyModalView = mockCompFactory.comp;

      expect(contentInjector.get(ModalRef)).toBe(modalRef);
      expect(contentInjector.get(MODAL_CONTENT_NODES)).toBe(
        dummyModalView.hostView.rootNodes
      );
    });

    it('should append modal content into container', () => {
      service.open(DummyComponent);

      const rootNode = spectator.inject(DOCUMENT).body;
      expect(rootNode.appendChild).toBeCalledTimes(1);
      expect(rootNode.appendChild).toBeCalledWith(
        mockCompFactory.modalComp.location.nativeElement
      );
    });

    it('should attach view to ApplicationRef', () => {
      service.open(DummyComponent);

      const { comp, modalComp } = mockCompFactory;
      const appRef = spectator.inject(ApplicationRef);

      expect(appRef.attachView).toBeCalledTimes(2);
      expect(appRef.attachView.mock.calls[0][0]).toBe(modalComp.hostView);
      expect(appRef.attachView.mock.calls[1][0]).toBe(comp.hostView);
    });

    it('should extends the parent injector', () => {
      const FROM_PARENT = new InjectionToken('token from parent injector');
      service.open(DummyComponent, {
        vcr: {
          injector: Injector.create({
            providers: [
              { provide: FROM_PARENT, useValue: 'from parent injector' },
            ],
          }),
        } as any,
      });

      const compInjector = mockCompFactory.factory.create.mock.calls[0][0];
      expect(compInjector.get(FROM_PARENT)).toBe('from parent injector');
    });
  });
});
