import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './UsageStats.types';

type UsageStatsModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class UsageStatsModule extends NativeModule<UsageStatsModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(UsageStatsModule, 'UsageStatsModule');
