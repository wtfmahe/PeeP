import { NativeModulesProxy, EventEmitter } from 'expo-modules-core';

// Import the native module. On web, it will be null.
import UsageStatsModule from './src/UsageStatsModule';

export async function hasPermission(): Promise<boolean> {
    return await UsageStatsModule.hasPermission();
}

export async function requestPermission(): Promise<void> {
    return await UsageStatsModule.requestPermission();
}

export async function getForegroundApp(): Promise<string | null> {
    return await UsageStatsModule.getForegroundApp();
}
