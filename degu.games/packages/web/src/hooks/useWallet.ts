"use client";

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

export function useWallet() {
    const { user, ready, authenticated } = usePrivy();
    const { wallets } = useWallets();

    const getProvider = async () => {
        if (!wallets || wallets.length === 0) {
            throw new Error("No wallet found");
        }

        const wallet = wallets[0];
        const provider = await wallet.getEthersProvider();
        return provider;
    };

    const getSigner = async () => {
        const provider = await getProvider();
        return await provider.getSigner();
    };

    const sendTransaction = async (to: string, data: string, value?: string) => {
        const signer = await getSigner();

        return await signer.sendTransaction({
            to,
            data,
            value: value ? ethers.parseEther(value) : undefined,
        });
    };

    const callContract = async (
        contractAddress: string,
        abi: any[],
        method: string,
        args: any[] = [],
        value?: string
    ) => {
        const signer = await getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        const tx = await contract[method](...args, {
            value: value ? ethers.parseEther(value) : undefined,
        });

        return await tx.wait();
    };

    return {
        walletAddress: wallets?.[0]?.address,
        isConnected: wallets && wallets.length > 0,
        sendTransaction,
        callContract,
        getProvider,
        getSigner,
        ready,
        authenticated,
    };
}
