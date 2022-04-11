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
import {
  ComputedModalRefType,
  ExtractModalRefData,
  ExtractModalRefResult,
} from './types';

interface OpenParams {
  config: ModalConfig;
  modalRef: ModalRef;
}

interface AttachOptions {
  modalRef: ModalRef;
  ref: ComponentRef<any> | TemplateRef<any>;
  view: EmbeddedViewRef<any>;
  config: ModalConfig;
  attachToApp?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  modals: ModalRef[] = [];

  constructor(
    private appRef: ApplicationRef,
    /* FIXME: 
        https://github.com/angular/angular/issues/45263
        Angular 13, ComponentFactory is deprecated, 
        and without ComponentFactory, 
        the component could be generated ONLY with view container reference
    */
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    @Inject(MODAL_CONFIG) private defaultConfig: ModalConfig,
    @Inject(GLOBAL_MODAL_CONFIG) private globalConfig: GlobalModalConfig
  ) {}

  open<
    TData extends ExtractModalRefData<ComputedModalRefType<T>>,
    TResult extends ExtractModalRefResult<ComputedModalRefType<T>>,
    T extends Type<any> | TemplateRef<any> = Type<any> | TemplateRef<any>,
    TModalRef extends ModalRef = ModalRef<
      TData,
      TResult,
      ComputedModalRefType<T>
    >
  >(compOrTemplate: T, config: Partial<ModalConfig<TData>> = {}): TModalRef {
    const configWithDefaults = this.mergeConfig(config);

    const modalRef = new ModalRef({
      data: configWithDefaults.data,
      backdropClick$: new Subject(),
    });
    const openParams = {
      config: configWithDefaults,
      modalRef,
    };

    this.modals.push(modalRef);

    return compOrTemplate instanceof TemplateRef
      ? (this.openTemplate(compOrTemplate, openParams) as TModalRef)
      : typeof compOrTemplate === 'function'
      ? (this.openComponent(compOrTemplate, openParams) as TModalRef)
      : this.throwMustBeTemplateOrComponent(compOrTemplate);
  }

  private openTemplate(
    template: TemplateRef<any>,
    { config, modalRef }: OpenParams
  ) {
    const context = { $implicit: modalRef, config };
    const view =
      config.vcr?.createEmbeddedView(template, context) ||
      template.createEmbeddedView(context);

    return this.attach({
      modalRef,
      config,
      view,
      ref: template,
      attachToApp: !config.vcr,
    });
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

  private attach({
    modalRef,
    config,
    view,
    ref,
    attachToApp = true,
  }: AttachOptions): ModalRef {
    const modal = this.createModal(config, modalRef, view);
    const container =
      config.container instanceof ElementRef
        ? config.container.nativeElement
        : config.container;

    modalRef.ref = ref;
    container.appendChild(modal.location.nativeElement);
    this.appRef.attachView(modal.hostView);

    if (attachToApp) {
      this.appRef.attachView(view);
    }
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

  private throwMustBeTemplateOrComponent(value: unknown): never {
    throw new TypeError(
      `Modal content must be a component or a template, but got [${value}] instead.`
    );
  }

  private nanoid() {
    return Math.random().toString(36).substring(7);
  }
}
