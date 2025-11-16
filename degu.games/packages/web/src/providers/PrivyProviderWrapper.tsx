"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from '@/lib/privy';

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={privyConfig.appId}
            config={privyConfig.config}
        >
            {children}
        </PrivyProvider>
    );
}
