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
  
  bootstrap(element: Element, app: string[]) {
    return <any>this.upgradeAdapter.bootstrap(element, app);
  }
  
  downgradeNg2Component(cmp: Type<any>): Function {
    return <any>this.upgradeAdapter.downgradeNg2Component(cmp);
  }
  
  downgradeNg2Directive(directive: any): Function {
    return this.downgrade.directive(directive);
  }
  
  downgradeNg2Provider(provider: any): Function {
    return <any>this.upgradeAdapter.downgradeNg2Provider(provider);
  }
  
  upgradeNg1Component(directive: string): Type<any> {
    this.upgradedCmpAndDir.push(directive);
    return this.upgradeAdapter.upgradeNg1Component(directive);
  }
  
  upgradeNg1Directive(directive: string): Type<any> {
    //let upgrade = new Upgrade(this.upgradeAdapter, this.module, this.addedProviders,
    //  this.upgradedProviders);
    this.upgradedCmpAndDir.push(directive);
    return this.upgrade.upgradeNg1Directive(directive);
  }
  
  upgradeNg1Provider(provider: string) {
    this.upgradedProviders.push(provider);
    return this.upgradeAdapter.upgradeNg1Provider(provider);
  }

  addNg2Module(mod: Type<any>) {
    this.ng2Modules.push(mod);

    //save added providers
    let meta = Reflect.getOwnMetadata('annotations', mod)[0];
    this.addedProviders.push(...meta.providers);
  }

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
