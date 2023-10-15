// IInjection: this represents a class - the class take a name which it stores the name of the class.
export interface IInjection extends Function {
  name: string;
}

// AliasInjection: this is the storing interface or object dependencies. - it extends the IInjection interface because it inherits the 'name' property.
export interface IAliasInjection extends IInjection {
  alias: boolean;
}
