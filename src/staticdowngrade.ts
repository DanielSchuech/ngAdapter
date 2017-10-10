import {ElementRef} from '@angular/core';

declare var Reflect: any;

export function downgradeDirective(directive: any) {
  let metadata = getMetadata(directive);

  let scope = createNewScopeWithBindings(directive);

  // create directive function
  function ng1Directive($injector: angular.auto.IInjectorService) {
    return {
      scope: scope,
      link: (scope: any, element: any, attrs: any) => {
        let el: ElementRef = {
          nativeElement: element[0]
        };
        
        // derivate dependencies
        let deps = getDependencies(directive, el, $injector);
        
        // combine scope and prototype functions
        let prototypes = Object.keys(directive.prototype);
        prototypes.forEach((prototypeKey: string) => {
          scope[prototypeKey] = directive.prototype[prototypeKey];
        });
        
        //create Directive
        directive.apply(scope, deps);
        
        addHostsBinding(directive, element[0], scope);
      }
    };
  }

  return ng1Directive;
}

/**
 * returns Metadata of the Directive
 * i.e. selector, providers, host, ...
 */
function getMetadata(directive: any) {
  let metadata = Reflect.getOwnMetadata('annotations', directive)[0];
  if (!metadata) {
    console.log('Error on finding metadata for directive: ' + directive.name);
    throw new Error();
  }
  return metadata;
}

/**
 * create an empty scope with two way binding of the ng2 directive
 */
function createNewScopeWithBindings(directive: any) {
  let metadata = Reflect.getOwnMetadata('propMetadata', directive);
  if (!metadata) {
    return {};
  }
  let propertyKeys = Object.keys(metadata);
  let scope: any = {};
  propertyKeys.forEach((key) => {
    //check that metadata property is binding
    if (Array.isArray(metadata[key]) &&
      metadata[key].length === 1 &&
      'bindingPropertyName' in metadata[key][0]) {
        scope[key] = '=';
      }
  });
  return scope;
}  


/**
 * evaluate the dependencies of the given ng2 directive
 * returns the instances of the deps in correct order
 */
function getDependencies(directive: any, el: ElementRef, 
            $injector: angular.auto.IInjectorService) {
  let deps: any[] = [];
  let params: Function[] = Reflect.getMetadata('design:paramtypes', directive);
  params && params.forEach((dep: Function) => {
    let dependencyName = (<any>dep).name;
    
    // ElementRef is a special case 
    if (dependencyName === 'ElementRef') {
      deps.push(el);
      return;
    } 
    
    // default case
    let dependency = $injector.get(dependencyName);
    deps.push(dependency);
  });
  return deps;
}

/**
 * adds the event bindings given in the host attribute of the directive metadata
 */
function addHostsBinding(directive: any, element: Element, directiveScope: any) {
  let metadata = Reflect.getOwnMetadata('propMetadata', directive);
  if (!metadata) {
    return {};
  }
  let propertyKeys = Object.keys(metadata);
  let scope: any = {};
  propertyKeys.forEach((key) => {
    //check that metadata property is hosts binding
    if (Array.isArray(metadata[key]) &&
      metadata[key].length === 1 &&
      'eventName' in metadata[key][0] &&
      'args' in metadata[key][0]) {
        //register event listener        
        element.addEventListener(metadata[key][0].eventName, ($event) => {
          directiveScope[key]($event);
        });
      }
  });
  
  //TODO: remove event listener on directive destroy
}
