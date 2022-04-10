import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  Inject,
  Injectable,
  Injector,
  TemplateRef,
  Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { GlobalModalConfig, ModalConfig } from './config';
import { ModalRef } from './modal-ref';
import { ModalComponent } from './modal.component';
import {
  GLOBAL_MODAL_CONFIG,
  MODAL_CONFIG,
  MODAL_CONTENT_NODES,
} from './tokens';

interface OpenParams {
  config: ModalConfig;
  modalRef: ModalRef;
}

interface AttachOptions {
  modalRef: ModalRef;
  ref: ComponentRef<any> | TemplateRef<any>;
  view: EmbeddedViewRef<any>;
  config: ModalConfig;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  modals: ModalRef[] = [];

  constructor(
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    @Inject(MODAL_CONFIG) private defaultConfig: ModalConfig,
    @Inject(GLOBAL_MODAL_CONFIG) private globalConfig: GlobalModalConfig
  ) {}

  /* FIXME: 
      https://github.com/angular/angular/issues/45263
      Angular 13, ComponentFactory is deprecated, 
      and without ComponentFactory, 
      the component could be generated ONLY with view container reference
  */
  open(compOrTemplate: any, config: Partial<ModalConfig> = {}) {
    const configWithDefaults = this.mergeConfig(config);

    const modalRef = this.openComponent(compOrTemplate, {
      config: configWithDefaults,
      modalRef: new ModalRef({ backdropClick$: new Subject() }),
    });

    this.modals.push(modalRef);

    return modalRef;
  }

  private openComponent(
    component: Type<any>,
    { config, modalRef }: OpenParams
  ) {
    const factory =
      this.componentFactoryResolver.resolveComponentFactory(component);
    const compRef = factory.create(
      Injector.create({
        providers: [
          { provide: ModalRef, useValue: modalRef },
          { provide: MODAL_CONFIG, useValue: config },
        ],
        parent: config.vcr?.injector || this.injector,
      })
    );

    return this.attach({
      modalRef,
      config,
      ref: compRef,
      view: compRef.hostView as EmbeddedViewRef<any>,
    });
  }

  private attach({ modalRef, config, view, ref }: AttachOptions) {
    const modal = this.createModal(config, modalRef, view);
    const container =
      config.container instanceof ElementRef
        ? config.container.nativeElement
        : config.container;

    container.appendChild(modal.location.nativeElement);
    this.appRef.attachView(modal.hostView);

    this.appRef.attachView(view);
    return modalRef;
  }

  private createModal(
    config: ModalConfig,
    modalRef: ModalRef,
    view: EmbeddedViewRef<any>
  ) {
    const factory =
      this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
    return factory.create(
      Injector.create({
        providers: [
          { provide: ModalRef, useValue: modalRef },
          { provide: MODAL_CONFIG, useValue: config },
          { provide: MODAL_CONTENT_NODES, useValue: view.rootNodes },
        ],
        parent: this.injector,
      })
    );
  }

  private mergeConfig(config: Partial<ModalConfig>): ModalConfig {
    return {
      ...this.defaultConfig,
      id: this.nanoid(),
      ...this.globalConfig,
      ...config,
    };
  }

  private nanoid() {
    return Math.random().toString(36).substring(7);
  }
}
