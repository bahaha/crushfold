import { ComponentRef, TemplateRef } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalRefProps<Data = any> {
  id: string;
  data: Data;
  backdropClick$: Subject<MouseEvent>;
  afterClosed$: Subject<unknown>;
}

export class ModalRef<
  Data = any,
  Result = any,
  Ref extends ComponentRef<any> | TemplateRef<any> =
    | ComponentRef<any>
    | TemplateRef<any>
> {
  public id: string;
  public ref: Ref;
  public backdropClick$: Subject<MouseEvent>;
  public afterClosed$: Subject<unknown>;
  public data: Data;

  onClose: (result?: Result) => unknown;

  constructor(props: ModalRefProps) {
    this.id = props.id;
    this.data = props.data ?? {};
    this.backdropClick$ = props.backdropClick$;
    this.afterClosed$ = props.afterClosed$;
  }

  close(result?: Result) {
    this.onClose?.(result);
  }
}
