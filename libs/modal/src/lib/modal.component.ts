import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ModalConfig } from './config';
import { ModalRef } from './modal-ref';
import { MODAL_CONFIG } from './tokens';

@Component({
  selector: 'ng-playground-modal',
  template: `
    <div
      #backdrop
      class="cf-modal--backdrop"
      [hidden]="!config.backdrop"
      [class.cf-modal--backdrop-visible]="config.backdrop"
    >
      <div #modal class="cf-modal--content"></div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnInit, OnDestroy {
  @ViewChild('backdrop', { static: true })
  backdrop!: ElementRef<HTMLDivElement>;
  @ViewChild('modal', { static: true }) modal!: ElementRef<HTMLDivElement>;

  destroy$ = new Subject<void>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(MODAL_CONFIG) public config: ModalConfig,
    public modalRef: ModalRef
  ) {}

  ngOnInit(): void {
    const backdropClick$ = this.listenOnBackdropClick();

    const onEscape$ = fromEvent<KeyboardEvent>(
      this.document.body,
      'keyup'
    ).pipe(filter(({ key }) => key === 'Escape'));

    if (this.config.enableClose) {
      this.closeModalWhile(backdropClick$, onEscape$);
    }
  }

  listenOnBackdropClick() {
    const backdrop = this.config.backdrop
      ? this.backdrop.nativeElement
      : this.document.body;

    const backdropClick$ = fromEvent<MouseEvent>(backdrop, 'click', {
      capture: true,
    }).pipe(
      filter(
        ({ target }) => !this.modal.nativeElement.contains(target as Element)
      ),
      takeUntil(this.destroy$)
    );

    backdropClick$.subscribe(this.modalRef.backdropClick$);
    return backdropClick$;
  }

  closeModalWhile(...observables: Observable<any>[]) {
    merge(...observables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.modalRef.close(),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
