import "reflect-metadata";
import { IAliasInjection } from "injectors";
import { IS_INJECTABLE, KEYS_CONTAINER, INJECTIONS_CLASS } from "./constants";

/**
 * Decorator function created to ready a class for injection.
 * @param {Function} constructorFunction
 */
export function injectable(constructorFunction: Function) {
  Reflect.defineMetadata(IS_INJECTABLE, true, constructorFunction);
  Reflect.defineMetadata(KEYS_CONTAINER, [], constructorFunction);

  if (!Reflect.getOwnMetadata(INJECTIONS_CLASS, constructorFunction)) {
    Reflect.defineMetadata(INJECTIONS_CLASS, [], constructorFunction);
  }
}

/**
 * Decorator to get constructor dependencies
 * @param {string} alias
 */
export function dep(alias?: string) {
  return function (
    target: Function,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    if (propertyKey) {
      throw new Error("dep() should only be used in constructor arguments");
    }

    const aliasInjection = { name: alias, alias: true } as IAliasInjection;
    const inject = alias
      ? aliasInjection
      : Reflect.getMetadata("design:paramtypes", target)[parameterIndex];

    if (inject && Reflect.has(inject, "isExtensible")) {
      throw new Error(
        `You can't inject interfaces or objects without an alias`
      );
    }

    let injects = Reflect.getOwnMetadata(INJECTIONS_CLASS, target) || [];
    injects[parameterIndex] = inject;
    Reflect.defineMetadata(INJECTIONS_CLASS, injects, target);
  };
}
