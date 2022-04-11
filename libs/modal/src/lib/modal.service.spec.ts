import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentFactoryResolver,
  ElementRef,
  InjectionToken,
  Injector,
  TemplateRef,
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
      rootNodes: [
        document.createTextNode('Hi, there. I am component inside the modal.'),
      ],
    },
    location: {
      nativeElement: 'Hi, there. I am component inside the modal.',
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
    create: jest.fn().mockReturnValueOnce(this.modalComp),
  };

  resolveComponentFactory = jest.fn().mockReturnValue(this.factory);
}

class DummyTemplateRef extends TemplateRef<any> {
  elementRef: ElementRef<any> = null;

  view = {
    rootNodes: [document.createTextNode('Hey. I am a template.')],
    destroy: jest.fn(),
  };

  createEmbeddedView = jest.fn().mockReturnValue(this.view);
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

  it('should throw error if no template or component is provided', () => {
    expect(() => service.open('text' as any)).toThrowError(
      'Modal content must be a component or a template, but got [text] instead.'
    );
  });

  it('should place modal element into container from config', () => {
    const mockContainer = { appendChild: jest.fn() };
    service.open(new DummyTemplateRef(), {
      container: mockContainer as any,
    });

    expect(spectator.inject(DOCUMENT).body.appendChild).not.toBeCalled();
    expect(mockContainer.appendChild).toBeCalledWith(
      mockCompFactory.modalComp.location.nativeElement
    );
  });

  it('should overwrite default config with open params', () => {
    const modalRef = service.open(new DummyTemplateRef(), {
      backdrop: false,
      enableClose: false,
      className: 'iam-modal',
    });

    const modalInjector = mockCompFactory.factory.create.mock.calls[0][0];
    expect(modalInjector.get(MODAL_CONFIG)).toEqual(
      expect.objectContaining({
        backdrop: false,
        enableClose: false,
        className: 'iam-modal',
      })
    );
  });

  describe('using component', () => {
    class DummyComponent {}

    beforeEach(() => {
      const modalFactory = {
        create: jest
          .fn()
          .mockReturnValueOnce(mockCompFactory.comp)
          .mockReturnValueOnce(mockCompFactory.modalComp),
      };
      mockCompFactory.factory = modalFactory;
      mockCompFactory.resolveComponentFactory = jest
        .fn()
        .mockReturnValue(modalFactory);
    });

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

    it('should contain data payload from open', () => {
      const modalRef = service.open(DummyComponent, { data: { foo: 'bar' } });

      expect(modalRef.data).toEqual({ foo: 'bar' });
      const compInjector = mockCompFactory.factory.create.mock.calls[0][0];
      expect(compInjector.get(ModalRef).data).toEqual({ foo: 'bar' });
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

  describe('using template', () => {
    it('should open it', () => {
      expect(service.open(new DummyTemplateRef())).toBeTruthy();
    });

    it('should add modal to modals', () => {
      const modalRef = service.open(new DummyTemplateRef());
      expect(service.modals.length).toBe(1);
      expect(service.modals).toContain(modalRef);
    });

    it('should instanciate template', () => {
      const dummyTemplate = new DummyTemplateRef();
      const modalRef = service.open(dummyTemplate, { backdrop: false });

      expect(modalRef.ref).toBe(dummyTemplate);
      expect(dummyTemplate.createEmbeddedView).toBeCalledTimes(1);
      expect(dummyTemplate.createEmbeddedView).toBeCalledWith({
        $implicit: modalRef,
        config: expect.objectContaining({ backdrop: false }),
      });
    });

    it('should contain data payload from open', () => {
      const modalRef = service.open(new DummyTemplateRef(), {
        data: { foo: 'bar' },
      });
      expect(modalRef.data).toEqual({ foo: 'bar' });
    });

    it('should fill modal injector', () => {
      const dummyTemplate = new DummyTemplateRef();
      const modalRef = service.open(dummyTemplate);

      expect(mockCompFactory.factory.create).toBeCalledTimes(1);
      const modalInjector = mockCompFactory.factory.create.mock.calls[0][0];

      expect(modalInjector.get(ModalRef)).toBe(modalRef);
      expect(modalInjector.get(MODAL_CONTENT_NODES)).toBe(
        dummyTemplate.view.rootNodes
      );
    });

    it('should append modal into container', () => {
      service.open(new DummyTemplateRef());

      const rootNode = spectator.inject(DOCUMENT).body;
      expect(rootNode.appendChild).toBeCalledTimes(1);
      expect(rootNode.appendChild).toBeCalledWith(
        mockCompFactory.modalComp.location.nativeElement
      );
    });

    it('should attach view to ApplicationRef', () => {
      const dummyTemplate = new DummyTemplateRef();
      service.open(dummyTemplate);

      const appRef = spectator.inject(ApplicationRef);
      expect(appRef.attachView).toBeCalledTimes(2);
      expect(appRef.attachView.mock.calls[0][0]).toBe(
        mockCompFactory.modalComp.hostView
      );
      expect(appRef.attachView.mock.calls[1][0]).toBe(dummyTemplate.view);
    });

    it('should attach ONLY modal view to ApplicationRef with specific vcr', () => {
      const dummyTemplate = new DummyTemplateRef();
      service.open(dummyTemplate, { vcr: new DummyTemplateRef() as any });

      const appRef = spectator.inject(ApplicationRef);
      expect(appRef.attachView).toBeCalledTimes(1);
      expect(appRef.attachView.mock.calls[0][0]).toBe(
        mockCompFactory.modalComp.hostView
      );
    });

    it('should use specific vcr to instanciate template', () => {
      const dummyTemplate = new DummyTemplateRef();
      const customRoot = new DummyTemplateRef();

      const modalRef = service.open(dummyTemplate, {
        vcr: customRoot as any,
        backdrop: false,
      });

      expect(dummyTemplate.createEmbeddedView).not.toBeCalled();
      expect(customRoot.createEmbeddedView).toBeCalledWith(dummyTemplate, {
        $implicit: modalRef,
        config: expect.objectContaining({ backdrop: false }),
      });
    });
  });
});
