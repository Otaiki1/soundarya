"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function NavbarConnectButton() {
    return (
        <ConnectButton
            showBalance={false}
            chainStatus="none"
            accountStatus="address"
        />
    );
}
