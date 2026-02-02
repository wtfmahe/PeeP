import * as React from 'react';

import { UsageStatsViewProps } from './UsageStats.types';

export default function UsageStatsView(props: UsageStatsViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
