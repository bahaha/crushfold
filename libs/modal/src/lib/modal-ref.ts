import { ComponentRef, TemplateRef } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalRefProps<Data = any> {
  data: Data;
  backdropClick$: Subject<MouseEvent>;
}

export class ModalRef<
  Data = any,
  Result = any,
  Ref extends ComponentRef<any> | TemplateRef<any> =
    | ComponentRef<any>
    | TemplateRef<any>
> {
  public ref: Ref;
  public backdropClick$: Subject<MouseEvent>;
  public data: Data;

  constructor(props: ModalRefProps) {
    this.data = props.data ?? {};
    this.backdropClick$ = props.backdropClick$;
  }

  close(result?: Result) {}
}
