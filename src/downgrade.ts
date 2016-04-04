import {UpgradeAdapter} from 'angular2/upgrade';
import {ElementRef} from 'angular2/core';
import {getFunctionName} from './helper';

export class Downgrade {
  constructor(private upgradeAdapter: UpgradeAdapter, private module: angular.IModule) {
    
  }
  
  directive(directive: any): Function {
    let metadata = this.getMetadata(directive);
    
    // initialise provided services
    this.downgradeProviders(metadata.providers);
    
    let scope = this.createNewScopeWithBindings(directive);
    
    //TODO: require other directives on the same element
    
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
          let directiveScope = angular.extend({}, scope, directive.prototype);
          
          //create Directive
          directive.apply(directiveScope, deps);
          
          addHostsBinding(metadata, element[0], directiveScope);
        }
      };
    }
    
    return ng1Directive;
  }
  
  /**
   * returns Metadata of the Directive
   * i.e. selector, providers, host, ...
   */
  getMetadata(directive: any) {
    let metadata = Reflect.getOwnMetadata('annotations', directive)[0];
    if (!metadata) {
      console.log('Error on finding metadata for directive: ' + getFunctionName(directive));
      throw new Error();
    }
    return metadata;
  }
  
  /**
   * downgrade provided services which are given in the Directive Metadata
   */
  downgradeProviders(providers: Function[]) {
    providers && providers.forEach((provider: Function) => {
      this.upgradeAdapter.addProvider(provider);
      this.module.factory(getFunctionName(provider), 
        this.upgradeAdapter.downgradeNg2Provider(provider));
    });
  }
  
  /**
   * create an empty scope with two way binding of the ng2 directive
   */
  createNewScopeWithBindings(directive: any) {
    let bindings = Reflect.getOwnMetadata('propMetadata', directive);
    if (!bindings) {
      return {};
    }
    let bindingKeys = Object.keys(bindings);
    let scope: any = {};
    bindingKeys.forEach((key) => {
      scope[key] = '=';
    });
    return scope;
  }  
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
    let dependencyName = getFunctionName(dep);
    
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
function addHostsBinding(metadata: any, element: Element, directiveScope: any) {
  let hostKeys = Object.keys(metadata.host);
  hostKeys && hostKeys.forEach((key) => {
    let keyReg = /([A-Z,a-z,0-9]+)/;
    let event = keyReg.exec(key)[0];
    
    let fnReg = /([A-Z,a-z,0-9]+)/;
    let fnName = fnReg.exec(metadata.host[key])[0];
    
    element.addEventListener(event, (event: any) => {
      directiveScope[fnName]();
    });
    
  });
  
  //TODO: remove event listener on directive destroy
}
