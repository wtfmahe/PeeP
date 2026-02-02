import { NativeModule, requireNativeModule } from 'expo';

import { UsageStatsModuleEvents } from './UsageStats.types';

declare class UsageStatsModule extends NativeModule<UsageStatsModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<UsageStatsModule>('UsageStats');
