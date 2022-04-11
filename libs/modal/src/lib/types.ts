import { TemplateRef, Type } from '@angular/core';
import { ModalRef } from './modal-ref';

export type ExtractModalRefData<T extends ModalRef> = T extends ModalRef<
  infer Data,
  any,
  any
>
  ? Data
  : never;

type _AnyIfUnknown<T> = unknown extends T ? any : T;

export type ExtractModalRefResult<T extends ModalRef> = T extends ModalRef<
  any,
  infer Result,
  any
>
  ? _AnyIfUnknown<Result>
  : never;

export type ComputedModalRefType<
  T extends Type<unknown> | TemplateRef<unknown>
> = T extends TemplateRef<unknown>
  ? any
  : T extends Type<unknown>
  ? ExtractComponentModalRef<T>
  : any;

export type TupleExtract<
  T extends readonly unknown[],
  TypeToExtract
> = T extends [infer Head, ...infer Rest]
  ? [Head] extends [TypeToExtract]
    ? [Head, ...TupleExtract<Rest, TypeToExtract>]
    : TupleExtract<Rest, TypeToExtract>
  : [];

type _ExtractComponentModalRef<T extends Type<unknown>> =
  T extends Type<unknown>
    ? TupleExtract<ConstructorParameters<T>, ModalRef<unknown, unknown>>
    : never;

type ExtractComponentModalRef<T extends Type<unknown>> =
  _ExtractComponentModalRef<T> extends [infer U]
    ? U
    : // Any is necessary to not break things: injecting ModalRef in the component constructor is optional.
      any;
