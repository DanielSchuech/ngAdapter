import {UpgradeAdapter} from 'angular2/upgrade';
import {ElementRef, Type, Directive, Injector, Input, EventEmitter,
    OnInit, DoCheck, NgZone} from 'angular2/core';
import {ScopeEvents} from './scopeevents';
import {Scope} from './scope';

export class Upgrade {
  constructor(private upgradeAdapter: UpgradeAdapter, private module: angular.IModule,
    private addedProvider: any, private upgradedProviders: string[]) {}
  
  upgradeNg1Directive(directive: string): Type {
    let directiveFnOrArray = this.searchDirective(directive);
    let fn = this.evaluateDirectiveAndDeps(directiveFnOrArray);
    return this.createDirective(directive, fn.function, fn.dependencies);
    //return () => {};
  }
  
  /**
   * searches in angular.module for the directive and returns it
   */
  searchDirective(directive:string): Function|Array<any> {
    /**
     * invokeQuee contains all actions on angular.module
     * including controller, directive & service declarations
     */
    let queue: any[] = (<any>this.module)._invokeQueue;
    if (queue.length === 0) {
      showError();
    }
    
    let foundFunction: Function;    
    queue.forEach((action: any[]) => {
      if (action.length >= 3) {
        /**
         * action[0] i.e. $controllerProvider | $provide
         * action[1] i.e. register | factory | directive
         * action[2][0] name
         * action[2][1] function
         */
        if (action[1] === 'directive' && action[2][0] === directive) {
          foundFunction = action[2][1];
        }
      }
    });
    if (!foundFunction) {showError(); }
    
    return foundFunction;
    
    function showError() {
      throw new Error('Cannot find directive: ' + directive);
    }
  }
  
  /**
   * searches for the directive function and the required dependencies
   * return {
   *  function: Function -> directive Function
   *  dependencies: string[] -> required Dependencies
   * }
   */
  evaluateDirectiveAndDeps(directive: Function|Array<string|Function>) {
    /**
     * directive is an Fn or Array:
     *    * array for Inline Array Annotation
     *      i.e. ['$scope', 'greeter', function($scope, greeter) {}]
     *    * function -> dependency names are located in directive.$inject
     */
    
    /** Inline Array Notation */
    if (Array.isArray(directive)) {
      let fn = <Function>directive.splice(directive.length - 1, 1)[0];
      let dependencies = <string[]>directive;
      return {
        function: fn,
        dependencies: dependencies
      };
    }
    /** $inject syntax */
    else {
      return {
        function: directive,
        dependencies: directive.$inject
      }
    }
  }
  
  /**
   * create a directive
   */
  createDirective(selector: string, fn: Function, deps: string[]) {
    //evaluate bindings
    let bindings = Object.keys(fn().scope || {});
    
    //evaluate events
    let events: string[] = []
    bindings.forEach((binding: string) => {
      events.push(binding + 'Changed: ' + binding + 'Change');
    });
    
    //evaluate properties
    let properties = {
      selector: '[' + selector + ']',
      properties: bindings,
      events: events
    }
    
    let addedProviders = this.addedProvider;
    let upgradedProviders = this.upgradedProviders;
    
    @Directive(properties)
    class ngAdapterDirective implements OnInit, DoCheck {
      private bindingIntervall: any;
      private oldBindingValues: any = {};
      private _equals: any = {}; //selfdefined equals functions (i.e. in scope watch)
      private _watch:any = {} //listeners for scope watch
      
      constructor(private injector: Injector, private element: ElementRef,
          private scopeEvents: ScopeEvents, private zone: NgZone) {
        bindings.forEach((binding: string) => {
          //setup output events for two way binding
          (<any>this)[binding + 'Changed'] = new EventEmitter<any>();
          this.oldBindingValues[binding] = (<any>this)[binding];
        });
      }
      
      ngOnInit() {
        let scope = <any>this;
        //setting up scope 
        Scope.setUp(scope, this.scopeEvents, this.zone);
        
        let dependencies = determineDependencies(deps, this.injector, addedProviders,
          upgradedProviders); 

        let directive = fn(...dependencies);
        let attrs = createAttrs(this.element);
        
        directive.link(scope, [this.element.nativeElement], attrs);
      }
      
      ngDoCheck() {
        bindings.forEach((binding) => {
          let scope = <any>this;
          let equals: Function = scope._equals[binding] || function (a: any, b: any) {return a === b; }; 
          if (!equals(this.oldBindingValues[binding], scope[binding])) {
            //binding value changed
            //emit output event
            scope[binding + 'Changed'].next(scope[binding]);
            
            //execute scope $watch
            Scope.executeScopeWatchListener(binding, scope, this.oldBindingValues[binding], 
              scope[binding]);
            
            //reset old binding value
            this.oldBindingValues[binding] = scope[binding];
          }
        });
      }
    }
    
    /**
     * Angular2 uses the name to find the directiv function
     * change read-only name property to find the different upgraded directives
     */
    Object.defineProperty(ngAdapterDirective, "name", {
      value: 'ngAdapterDirective_' + selector
    });
    
    return <any>ngAdapterDirective;
  }
}

/**
 * inputs array of dependencies as string + more needed information
 * return array with dependencies objects
 */
function determineDependencies(deps: string[], injector: Injector, addedProviders: any, 
      upgradedProviders: string[]) {
  let dependencies: any[] = [];
  deps && deps.forEach((dep: string) => {
    //check if dependency is a ng2Provider
    let depKeyNg2 = addedProviders[dep];
    
    //check if dependency is a ng1Provider
    let depKeyNg1: string;
    if (upgradedProviders.indexOf(dep) > -1) {depKeyNg1 = dep; }
    
    //warn if provider in ng1 & 2 available
    if (depKeyNg1 && depKeyNg2) {
      depKeyNg2 = undefined;
      console.warn('Provider ' + dep + ' is available in native ng1 and native ng2!' +
        'Using ng1 Provider! Check for naming conflicts!');
    }
    
    //throw Error if provider is not available
    if (!depKeyNg1 && !depKeyNg2) {
      throw new Error('Provider ' + dep + ' is not available!');
    }
    
    let depObj = injector.get(depKeyNg1 || depKeyNg2);
    dependencies.push(depObj);
  });

  return dependencies;
}

/**
 * create attrs object from attributes NamedNodeMap
 */
function createAttrs(element: ElementRef) {
  let attrs: any = {};
  let map = element.nativeElement.attributes;
  for (let i = 0; i < map.length; i++) {
    attrs[map[i].name] = map[i].value;
  }
  return attrs;
}
