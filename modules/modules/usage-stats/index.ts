// Reexport the native module. On web, it will be resolved to UsageStatsModule.web.ts
// and on native platforms to UsageStatsModule.ts
export { default } from './src/UsageStatsModule';
export { default as UsageStatsView } from './src/UsageStatsView';
export * from  './src/UsageStats.types';
