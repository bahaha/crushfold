import { Subject } from 'rxjs';

export interface ModalRefProps {
  backdropClick$: Subject<MouseEvent>;
}

export class ModalRef<Data = any, Result = any> {
  public backdropClick$: Subject<MouseEvent>;

  constructor(props: ModalRefProps) {
    this.backdropClick$ = props.backdropClick$;
  }

  close(result?: Result) {}
}
