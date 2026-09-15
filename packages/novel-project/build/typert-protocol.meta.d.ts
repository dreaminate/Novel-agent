/**
 * Generator-only metadata facade for the published DSH protocol package.
 * Runtime and ordinary typechecking resolve the unmodified npm package.
 */
declare module '@deepseek-ai/dsh-typert-protocol' {
  import type { Context } from '@deepseek-ai/cordis'

  /** Public registry shape used by author Remote actions during generation. */
  export interface TypertRegistryContract {
    readonly lookups: {
      get(key: string): {
        resolve(value: unknown): unknown | Promise<unknown>
      } | undefined
    }
  }

  export interface TypertLookup<Host, Wire> {
    readonly host: Host
    readonly wire: Wire
  }

  export interface TypertContext<Wire> {
    readonly wire: Wire
  }

  export interface TypertLookupMap {}
  export interface TypertContextMap {}

  type RemoteMethodDecorator = <
    This extends object,
    Args extends unknown[],
    Result,
  >(
    method: (this: This, ...args: Args) => Result,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Result
    >,
  ) => void

  export abstract class TypertRemoteService<out T = never> {
    protected readonly ctx: Context & { readonly typert: TypertRegistryContract }
    readonly typertRemote: {
      readonly service: TypertRemoteService<T>
      readonly serviceKey: string
      readonly namespace: string
    }

    protected constructor(
      ctx: Context,
      serviceKey: string,
      options?: { readonly namespace?: string },
    )
  }

  export function Remote<
    This extends object,
    Args extends unknown[],
    Result,
  >(
    method: (this: This, ...args: Args) => Result,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Result
    >,
  ): void

  export function Remote(exportName: string): RemoteMethodDecorator
}
