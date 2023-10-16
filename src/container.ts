/**import reflect-metdata to allow manipulation of metadata ssociated with classes/constuctors and objects */
import "reflect-metadata";

import { IAliasInjection, IInjection } from "injectors";
import { INJECTIONS_CLASS, IS_INJECTABLE, KEYS_CONTAINER } from "./constants";

// IoCContainer: container class that implements dependency injection and dependency inversion.
export class IoCContainer {
  //instances: a map of instantiated objects with map with class names as keys and objects as values.
  public instances: { [name: string]: Object } = {};

  //injectables: an array of classes
  private injectables: Array<IInjection> = [];

  //aliases: a map to store aliases
  private aliases: { [name: string]: Array<IInjection | IAliasInjection> } = {};

  //containerKeyIdentifier: a unique identifier for the container
  private containerKeyIdentifier: Symbol;

  constructor() {
    this.containerKeyIdentifier = Symbol();
  }

  // Type guard for IInjection
  instanceOfIInjection(object: any): object is IInjection {
    return "name" in object;
  }

  // Registers the class with the container @param {IInjection} injectable the class the user wishes to register with the container. @returns {void}
  public register(injectable: IInjection, alias?: string): void {
    if (this.instanceOfIInjection(injectable)) {
      if (!Reflect.getOwnMetadata(IS_INJECTABLE, injectable)) {
        throw new Error(
          "This class is not injectable. Internal Method [[getOwnMetadata]] returned undefined."
        );
      }

      if (alias === injectable.name) {
        throw new Error(`Class name must be different from ALIAS`);
      }

      if (alias) {
        this.aliases[alias] = this.aliases[alias]
          ? [...this.aliases[alias], injectable]
          : [injectable];
      }

      const classcontainerKeyIdentifiers = Reflect.getOwnMetadata(
        KEYS_CONTAINER,
        injectable
      );

      if (
        classcontainerKeyIdentifiers.find(
          (key: Symbol) => key === this.containerKeyIdentifier
        )
      ) {
        throw new Error(
          `Class ${
            (injectable as IInjection).name
          } was already assigned to this container.`
        );
      }

      classcontainerKeyIdentifiers.push(this.containerKeyIdentifier);
      Reflect.defineMetadata(
        KEYS_CONTAINER,
        classcontainerKeyIdentifiers,
        injectable
      );
      this.injectables = [...this.injectables, injectable];
    }
  }

  /**
   * Returns an instantiated object of the class specified.
   * @param {Function | string} name the name of the class the user wishes to instantiate
   */
  public resolve<T>(name: Function | string): T {
    const classRef = this.getClassRefByName(name);

    if (!classRef) {
      throw new Error(`Class "${name}" is not registered in container.`);
    }

    this.instantiate(classRef as new (...args: any[]) => IInjection);
    return this.instances[classRef.name] as T;
  }

  /**
   * Instantiates an instance of a class with its dependences.
   * @param {new (...args: any[]) => IInjection} Instance the class to be instantiated
   */
  private instantiate(Instance: new (...args: any[]) => IInjection) {
    if (this.getInstance(Instance.name)) {
      console.log("RIGHT HERE");
      return;
    }

    const injects = Reflect.getMetadata(INJECTIONS_CLASS, Instance);

    const dependencies = injects
      .map((injections: any) => {
        if (!injections) {
          throw new Error(
            `Dependency failed for "${Instance.name}" check for circular dependencies.`
          );
        }

        return this.resolve<Object>(
          injections.alias ? injections.name : injections
        );
      })
      .filter((d: any) => d);
    console.log(...dependencies);
    const instance = new Instance(...dependencies);
    this.addInstance(instance, Instance.name);
  }

  // Helper functions for the Register and Resolve functons.

  /**
   * Retrieves an instantiated class registered with the container.
   * @param {string} name the name of the class to retrieve.
   * @returns {Object}
   */
  private getInstance(name: string): Object {
    return this.instances[name];
  }

  /**
   * Adds an instance to the container's instance mapping
   * @param {Object} instance the instantiated instance.
   * @param {string} name the name of the instantiated instances class.
   */
  private addInstance(instance: Object, name: string) {
    this.instances[name] = instance;
  }

  /**
   * Returns the name of the class if it exists within the container, otherwise
   * returns null if it does not.
   * @param {Function} name the name of the class
   * @returns {IInjection}
   */
  private getClassRefByName(name: Function | string): IInjection | null {
    if (name instanceof Function) {
      const classcontainerKeyIdentifiers = Reflect.getOwnMetadata(
        KEYS_CONTAINER,
        name
      );

      if (
        classcontainerKeyIdentifiers.find(
          (c: Symbol) => c === this.containerKeyIdentifier
        )
      ) {
        return name;
      }
    }
    return null;
  }

  // Removes the cached instances, aliases, and injectables. @returns {void}
  public dispose(): void {
    this.injectables.length = 0;

    for (const prop of Object.getOwnPropertyNames(this.aliases)) {
      delete this.aliases[prop];
    }

    for (const prop of Object.getOwnPropertyNames(this.instances)) {
      delete this.instances[prop];
    }
  }
}

// Return new container based on class created
export const container = new IoCContainer();
