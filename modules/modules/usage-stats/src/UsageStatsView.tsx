import { requireNativeView } from 'expo';
import * as React from 'react';

import { UsageStatsViewProps } from './UsageStats.types';

const NativeView: React.ComponentType<UsageStatsViewProps> =
  requireNativeView('UsageStats');

export default function UsageStatsView(props: UsageStatsViewProps) {
  return <NativeView {...props} />;
}
