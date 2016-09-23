import {UpgradeAdapter} from '@angular/upgrade';
import {Type, ElementRef, Provider, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {Downgrade} from './downgrade';
import {Upgrade} from './upgrade';
import {ScopeEvents} from './scopeevents';

import {dashToCamel} from './helper';
declare var Reflect: any;

export class ngAdapter {
  private upgradeAdapter: UpgradeAdapter;
  private downgrade: Downgrade;
  private upgrade: Upgrade;
  private addedProviders: Type<any>[] = [];
  private upgradedProviders: string[] = [];
  private upgradedCmpAndDir: string[] = [];
  private ng2Modules: Type<any>[] = [];
  
  constructor(private module: angular.IModule) {
    this.upgradeAdapter = new UpgradeAdapter(<any>this.ng2Modules);
    this.downgrade = new Downgrade(this.upgradeAdapter, module);
    this.upgrade = new Upgrade(this.upgradeAdapter, module, this.addedProviders,
      this.upgradedProviders);
      
    /**
     * ngAdapter ng2 module
     * add internal services + ng1 $timeout & $interval
     */
    @NgModule({
      imports: [BrowserModule],
      providers: [
        ScopeEvents,
        {provide: '$timeout', useValue: setTimeout},
        {provide: '$interval', useValue: setInterval}
      ]
    })
    class ngAdapterModul {}
    this.ng2Modules.push(ngAdapterModul);
  }
  
  /**
   * bootstrap the AngularJS and Angular 2 hybrid appication
   */
  bootstrap(element: Element, app: string[]) {
    return <any>this.upgradeAdapter.bootstrap(element, app);
  }
  
  /**
   * downgrade an Angular 2 component to AngularJS
   * 
   * @example
   * angular.module('app').directive('MyNg2Component', adapter.downgradeNg2Component(MyNg2Component));
   */
  downgradeNg2Component(cmp: Type<any>): Function {
    return <any>this.upgradeAdapter.downgradeNg2Component(cmp);
  }
  
  /**
   * downgrade an Angular 2 directive to AngularJS
   * 
   * @example
   * angular.module('app').directive('myHighlight', adapter.downgradeNg2Directive(MyHighlight));
   */
  downgradeNg2Directive(directive: any): Function {
    return this.downgrade.directive(directive);
  }
  
  /**
   * downgrade an Angular 2 Service to AngularJS
   * the services has to be added to Angular 2 before
   * 
   * @example
   * @Injectable()
   * class MyService {}
   * 
   * @NgModule({
   *  providers: [MyService]
   * })
   * class MyModule {}
   * 
   * adapter.addNg2Module(MyModule);
   * 
   * angular.module('app').factory('myService', adapter.downgradeNg2Directive(MyService));
   */
  downgradeNg2Provider(provider: any): Function {
    return <any>this.upgradeAdapter.downgradeNg2Provider(provider);
  }
  
  /**
   * upgrade an AngularJS element directive to Angular 2
   * WARNING: You ALWAYS have to downgrade your Angular 2 Component at the end!
   * 
   * @example
   * @Component({
   *  selector: 'app-component',
   *  template: '<my-ng1-element></my-ng1-element>'
   * })
   * class AppComponent {}
   * 
   * @NgModule({
   *  declarations: [adapter.upgradeNg1Component('myNg1Element')]
   * })
   * 
   * angular.module('app').directive('MyNg2Component', adapter.downgradeNg2Component(MyNg2Component));
   */
  upgradeNg1Component(directive: string): Type<any> {
    this.upgradedCmpAndDir.push(directive);
    return this.upgradeAdapter.upgradeNg1Component(directive);
  }
  
  /**
   * upgrade an AngularJS element directive to Angular 2
   * WARNING: You ALWAYS have to downgrade your Angular 2 Component at the end!
   * 
   * scope bindings of the AngularJS Directive has to be used in Angular 2 with Angular 2 Syntax 
   * 
   * @example
   * @Component({
   *  selector: 'app-component',
   *  template: '<div my-ng1-highlight [myVar]="'myString'">Hello World</div>'
   * })
   * class AppComponent {}
   * 
   * @NgModule({
   *  declarations: [adapter.upgradeNg1Directive('myNg1Highlight')]
   * })
   * 
   * angular.module('app').directive('MyNg2Component', adapter.downgradeNg2Component(MyNg2Component));
   */
  upgradeNg1Directive(directive: string): Type<any> {
    //let upgrade = new Upgrade(this.upgradeAdapter, this.module, this.addedProviders,
    //  this.upgradedProviders);
    this.upgradedCmpAndDir.push(directive);
    return this.upgrade.upgradeNg1Directive(directive);
  }
  
  /**
   * upgrade an AngularJS Service and inject it to the Angular 2 main module
   * 
   * @example
   * angular.module('app').service('myNg1Service', MyNg1Service);
   * adapter.upgradeNg1Provider('myNg1Service');
   */
  upgradeNg1Provider(provider: string) {
    this.upgradedProviders.push(provider);
    return this.upgradeAdapter.upgradeNg1Provider(provider);
  }

  /**
   * add Angular 2 Module to the Angular 2 main module
   * 
   * @example
   * @NgModule({})
   * class MyModule {}
   * 
   * adapter.addNg2Module(MyModule);
   */
  addNg2Module(mod: Type<any>) {
    this.ng2Modules.push(mod);

    //save added providers
    let meta = Reflect.getOwnMetadata('annotations', mod)[0];
    this.addedProviders.push(...meta.providers);
  }

  /**
   * downgrade an added Angular 2 Module to an AngularJS Module
   * an AngularJS Module with the name of the given class/function will be created
   * returns name of module as string
   * 
   * NgModule has to be added before downgrading
   * 
   * instead of adding the module name after downgrading to the requries field of an AngularJS Module
   * you can add it on creating even if it doesn´t exists at this moment
   * angular.module('app', ['MyNg2Module']);
   * 
   * @example
   * @NgModule({})
   * class MyNg2Module {}
   * 
   * adapter.addNg2Module(MyNg2Module);
   * let moduleName = adapter.downgradeNg2Module(MyNg2Module); //'MyNg2Module'
   * angular.module('App').requires.push(moduleName);
   */
  downgradeNg2Module(mod: Type<any>) {
    if (this.ng2Modules.indexOf(mod) < 0) {
      throw Error('NgModule has to be added with adapter.addNg2Module first!');
    }
    let ng1Module = angular.module((<any>mod).name, []);

    let meta = Reflect.getOwnMetadata('annotations', mod)[0];
    meta.declarations && meta.declarations.forEach((item: Type<any>) => {
      let type = Reflect.getOwnMetadata('annotations', item)[0];

      //dont downgrade upgraded ng1 types
      let isUpgraded = (selector: string) => {
        return this.upgradedCmpAndDir.indexOf(selector) > -1
      }
      
      let selector = type.selector
      if (selector && type.template && !isUpgraded(selector)) {
        //its a component
        ng1Module.directive(dashToCamel(selector), <any>this.downgradeNg2Component(item));
      }
      if (selector && !type.template && 
          !isUpgraded(selector.substring(1, selector.length - 1))) {
        //its a directive
        ng1Module.directive(dashToCamel(selector.substring(1, selector.length - 1)), 
          <any>this.downgradeNg2Directive(item));
      }
    });

    meta.providers && meta.providers.forEach((item: Type<any>) => {
      if (this.upgradedProviders.indexOf((<any>item).name) < 0) {
        ng1Module.service((<any>item).name, item);
      }
    })

    return ng1Module.name;
  }
}
