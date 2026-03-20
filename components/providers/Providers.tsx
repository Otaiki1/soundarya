'use client'

import React from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, Theme, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from '@/lib/wagmi'

const customTheme: Theme = {
  ...darkTheme({
    accentColor: '#C9A96E',
    accentColorForeground: '#0D0A07',
    borderRadius: 'none',
    fontStack: 'system',
    overlayBlur: 'small',
  }),
  colors: {
    ...darkTheme().colors,
    accentColor: '#C9A96E',
    accentColorForeground: '#0D0A07',
    actionButtonBorder: '#C9A96E',
    actionButtonBorderMobile: '#C9A96E',
    actionButtonSecondaryBackground: '#1A1510',
    closeButton: '#C9A96E',
    closeButtonBackground: 'rgba(201, 169, 110, 0.1)',
    connectButtonBackground: '#1A1510',
    connectButtonBackgroundError: '#1A1510',
    connectButtonInnerBackground: '#C9A96E',
    connectButtonText: '#C9A96E',
    connectButtonTextError: '#C9A96E',
    connectionIndicator: '#C9A96E',
    downloadBottomCardBackground: '#1A1510',
    downloadTopCardBackground: '#131009',
    error: '#C9A96E',
    generalBorder: '#C9A96E',
    generalBorderDim: 'rgba(201, 169, 110, 0.1)',
    menuItemBackground: '#1A1510',
    modalBackdrop: 'rgba(13, 10, 7, 0.9)',
    modalBorder: '#C9A96E',
    modalBackground: '#1A1510',
    modalText: '#E8D5A3',
    modalTextDim: 'rgba(232, 213, 163, 0.6)',
    modalTextSecondary: '#C9A96E',
    primary: '#0D0A07',
    primaryButton: '#C9A96E',
    primaryButtonBorder: '#C9A96E',
    primaryButtonText: '#0D0A07',
    secondaryAction: '#C9A96E',
    secondaryActionBorder: '#C9A96E',
    secondaryButton: '#1A1510',
    secondaryButtonBorder: 'rgba(201, 169, 110, 0.2)',
    secondaryButtonText: '#C9A96E',
    selectedOptionBorder: '#C9A96E',
    standby: '#C9A96E',
  },
  fonts: {
    body: 'system-ui, -apple-system, sans-serif',
  },
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider theme={customTheme}>{children}</RainbowKitProvider>
    </WagmiProvider>
  )
}
