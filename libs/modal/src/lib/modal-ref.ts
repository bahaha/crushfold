import { ComponentRef, TemplateRef } from '@angular/core';
import { from, merge, of, Subject } from 'rxjs';
import { every, filter, take } from 'rxjs/operators';
import { GlobalModalConfig } from './config';

export interface ModalRefProps<Data = any> {
  id: string;
  data: Data;
  backdropClick$: Subject<MouseEvent>;
  afterClosed$: Subject<unknown>;
}

const isNil = (arg: any) => arg === undefined || arg === null;
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

  canCloseGuards: GlobalModalConfig['canClose'];

  onClose: (result?: Result) => unknown;

  constructor(props: ModalRefProps) {
    this.id = props.id;
    this.data = props.data ?? {};
    this.backdropClick$ = props.backdropClick$;
    this.afterClosed$ = props.afterClosed$;
  }

  close(result?: Result) {
    if (!this.canCloseGuards) {
      this.onClose?.(result);
      return;
    }

    const canCloseGuards = Array.isArray(this.canCloseGuards)
      ? this.canCloseGuards
      : [this.canCloseGuards];
    const closeGuards = canCloseGuards
      .map((guard) => guard(result))
      .map((canClose) =>
        typeof canClose === 'boolean'
          ? of(canClose)
          : from(canClose).pipe(take(1))
      );

    merge(...closeGuards)
      .pipe(every(Boolean), filter(Boolean))
      .subscribe({ next: (_) => this.onClose?.(result) });
  }
}
