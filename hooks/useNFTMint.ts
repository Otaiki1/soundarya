import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

interface MintSignatureResponse {
  signature: string
  scoreData: {
    overallScore: number
    symmetry: number
    goldenRatio: number
    boneStructure: number
    harmony: number
    skinQuality: number
    dimorphism: number
    percentile: number
  }
  mintPrice: string
}

interface NFTMintResult {
  tokenId?: string
  txHash?: string
}

export function useNFTMint(analysisId: string) {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const { writeContract, data: writeData } = useWriteContract()
  const { data: receipt, isLoading: isMinting } = useWaitForTransactionReceipt({
    hash: writeData,
    confirmations: 2,
  })

  const mint = useCallback(async (): Promise<NFTMintResult> => {
    if (!isConnected || !address) {
      setError('Wallet not connected')
      return {}
    }

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Get mint signature from API
      const signatureRes = await fetch('/api/onchain/mint-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, walletAddress: address }),
      })

      if (!signatureRes.ok) {
        throw new Error('Failed to get mint signature')
      }

      const { signature, scoreData, mintPrice } = (await signatureRes.json()) as MintSignatureResponse

      // Step 2: Call smart contract to mint
      writeContract(
        {
          abi: [
            {
              type: 'function',
              name: 'mintScore',
              inputs: [
                { name: 'scoreData', type: 'tuple', components: [
                  { name: 'overallScore', type: 'uint256' },
                  { name: 'symmetry', type: 'uint256' },
                  { name: 'goldenRatio', type: 'uint256' },
                  { name: 'boneStructure', type: 'uint256' },
                  { name: 'harmony', type: 'uint256' },
                  { name: 'skinQuality', type: 'uint256' },
                  { name: 'dimorphism', type: 'uint256' },
                  { name: 'percentile', type: 'uint256' },
                ] },
                { name: 'signature', type: 'bytes' },
              ],
              outputs: [
                { name: 'tokenId', type: 'uint256' },
              ],
              stateMutability: 'payable',
            } as const,
          ],
          address: (process.env.NEXT_PUBLIC_SOUNDARYA_NFT_ADDRESS || '') as `0x${string}`,
          functionName: 'mintScore',
          args: [scoreData, signature as `0x${string}`],
          value: parseEther(mintPrice),
        },
        {
          onSuccess: async (hash) => {
            setTxHash(hash)

            // Step 3: Record mint in database
            try {
              const recordRes = await fetch('/api/onchain/record-mint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  analysisId,
                  walletAddress: address,
                  txHash: hash,
                  scoreData,
                }),
              })

              if (!recordRes.ok) {
                console.error('Failed to record mint')
              }

              // Extract token ID from receipt
              if (receipt?.logs && receipt.logs.length > 0) {
                const lastLog = receipt.logs[receipt.logs.length - 1]
                if ('topics' in lastLog && lastLog.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daf11c3d7ac5e8b25e0e64e7737ea476ce3') {
                  const tokenIdFromLog = BigInt(lastLog.topics[3] || '0').toString()
                  setTokenId(tokenIdFromLog)
                }
              }

              setIsSuccess(true)
            } catch (err) {
              console.error('Failed to record mint:', err)
            }
          },
          onError: (err) => {
            setError(`Transaction failed: ${err.message}`)
            setIsLoading(false)
          },
        }
      )

      return { txHash }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setIsLoading(false)
      return {}
    }
  }, [isConnected, address, analysisId, writeContract, receipt])

  return {
    mint,
    isLoading: isLoading || isMinting,
    isSuccess,
    error,
    txHash,
    tokenId,
  }
}
