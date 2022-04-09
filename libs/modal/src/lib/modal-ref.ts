import { Subject } from 'rxjs';

export interface ModalRefProps {
  backdropClick$: Subject<MouseEvent>;
}

export class ModalRef {
  public backdropClick$: Subject<MouseEvent>;

  constructor(props: ModalRefProps) {
    this.backdropClick$ = props.backdropClick$;
  }
}
