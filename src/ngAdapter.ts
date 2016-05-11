import {UpgradeAdapter} from '@angular/upgrade';
import {Type, ElementRef, Provider} from '@angular/core';

import {Downgrade} from './downgrade';
import {Upgrade} from './upgrade';
import {ScopeEvents} from './scopeevents';


export class ngAdapter {
  private upgradeAdapter: UpgradeAdapter;
  private downgrade: Downgrade;
  private upgrade: Upgrade;
  private addedProviders: any;
  private upgradedProviders: string[];
  
  constructor(private module: angular.IModule) {
    this.addedProviders = {};
    this.upgradedProviders = [];
    this.upgradeAdapter = new UpgradeAdapter();
    this.downgrade = new Downgrade(this.upgradeAdapter, module);
    this.upgrade = new Upgrade(this.upgradeAdapter, module, this.addedProviders,
      this.upgradedProviders);
      
    //add scope events service
    this.addProvider(ScopeEvents);
    
    //ng1 $timeout, $interval service
    this.addProvider(new Provider('$timeout', {useValue: setTimeout}));
    this.addProvider(new Provider('$interval', {useValue: setInterval}));
  }
  
  bootstrap(element: Element, app: string[]) {
    return <any>this.upgradeAdapter.bootstrap(element, app);
  }
  
  downgradeNg2Component(cmp: Type): Function {
    return <any>this.upgradeAdapter.downgradeNg2Component(cmp);
  }
  
  downgradeNg2Directive(directive: any): Function {
    return this.downgrade.directive(directive);
  }
  
  downgradeNg2Provider(provider: any): Function {
    return <any>this.upgradeAdapter.downgradeNg2Provider(provider);
  }
  
  addProvider(provider: Function|Provider) {
    if (provider instanceof Provider) {
      this.addedProviders[(<any>provider).token] = provider.token;
    } else {
       this.addedProviders[(<any>provider).name || (<any>provider).token] = provider;
    }
    return this.upgradeAdapter.addProvider(provider);
  }
  
  upgradeNg1Component(directive: string): Type {
    return this.upgradeAdapter.upgradeNg1Component(directive);
  }
  
  upgradeNg1Directive(directive: string): Type {
    //let upgrade = new Upgrade(this.upgradeAdapter, this.module, this.addedProviders,
    //  this.upgradedProviders);
    return this.upgrade.upgradeNg1Directive(directive);
  }
  
  upgradeNg1Provider(provider: string) {
    this.upgradedProviders.push(provider);
    return this.upgradeAdapter.upgradeNg1Provider(provider);
  }
}
