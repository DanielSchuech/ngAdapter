import {UpgradeAdapter} from 'angular2/upgrade';
import {Type, ElementRef} from 'angular2/core';

import {Downgrade} from './downgrade';

export class ngAdapter {
  private upgradeAdapter: UpgradeAdapter;
  private downgrade: Downgrade;
  
  constructor(private module: angular.IModule) {
    this.upgradeAdapter = new UpgradeAdapter();
    this.downgrade = new Downgrade(this.upgradeAdapter, module);
  }
  
  bootstrap(element: Element, app: string[]) {
    this.upgradeAdapter.bootstrap(element, app);
  }
  
  downgradeNg2Component(cmp: Type) {
    return <any>this.upgradeAdapter.downgradeNg2Component(cmp);
  }
  
  downgradeNg2Directive(directive: any): Function {
    return this.downgrade.directive(directive);
  }
  
  downgradeNg2Provider(provider: any) {
    return <any>this.upgradeAdapter.downgradeNg2Provider(provider);
  }
  
  addProvider(provider: any) {
    return this.upgradeAdapter.addProvider(provider);
  }
}
