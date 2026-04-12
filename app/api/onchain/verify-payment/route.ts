import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SOUNDARYA_CHAIN, SOUNDARYA_RPC_URL, SOUNDARYA_SCORE_ABI, SOUNDARYA_SCORE_ADDRESS } from '@/lib/contracts'
import { createPublicClient, http, parseEventLogs, type Hex } from 'viem'

const publicClient = createPublicClient({
  chain: SOUNDARYA_CHAIN,
  transport: http(SOUNDARYA_RPC_URL),
})

export async function POST(req: Request) {
  try {
    const {
      hash: rawHash,
      txHash,
      type: rawType,
      analysisId,
      walletAddress,
    } = await req.json()

    const hash = (rawHash ?? txHash) as Hex | undefined
    const type =
      rawType === 'subscription' ? 'subscribe' : rawType === 'mint' ? 'mint' : rawType

    if (!hash) {
      return NextResponse.json({ error: 'Missing transaction hash' }, { status: 400 })
    }

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed' }, { status: 400 })
    }

    const touchesScoreContract = receipt.logs.some(
      (log) => log.address.toLowerCase() === SOUNDARYA_SCORE_ADDRESS.toLowerCase(),
    )

    if (!touchesScoreContract) {
      return NextResponse.json(
        { error: 'Transaction was not executed against the Soundarya score contract' },
        { status: 400 },
      )
    }

    const decodedLogs = parseEventLogs({
      abi: SOUNDARYA_SCORE_ABI,
      logs: receipt.logs,
      strict: false,
    }) as Array<{ eventName?: string; args?: Record<string, unknown> }>

    // Update state based on payment type
    if (type === 'scan' && analysisId) {
      return NextResponse.json({
        error: 'Legacy scan verification is disabled. Use the unlock verification flow instead.',
      }, { status: 400 })
    }

    if (type === 'subscribe') {
      const subscribedEvent = decodedLogs.find((log) => log.eventName === 'Subscribed')
      const expiry =
        typeof subscribedEvent?.args?.expiry === 'bigint'
          ? Number(subscribedEvent.args.expiry)
          : null
      const subscribedWallet =
        typeof subscribedEvent?.args?.user === 'string'
          ? subscribedEvent.args.user
          : walletAddress ?? null

      if (!subscribedEvent) {
        return NextResponse.json(
          { error: 'Subscription event not found for this transaction' },
          { status: 400 },
        )
      }

      return NextResponse.json({
        success: true,
        hash,
        type,
        verified: Boolean(subscribedEvent),
        walletAddress: subscribedWallet,
        expiry,
      })
    }

    if (type === 'mint') {
      const mintEvent = decodedLogs.find((log) => log.eventName === 'ScoreMinted')
      const tokenId =
        typeof mintEvent?.args?.tokenId === 'bigint' ? mintEvent.args.tokenId.toString() : null

      if (!mintEvent) {
        return NextResponse.json(
          { error: 'Mint event not found for this transaction' },
          { status: 400 },
        )
      }

      let mintRecorded = false
      try {
        let { error } = await supabaseAdmin
          .from('nft_mints')
          .update({
            status: 'confirmed',
            ...(tokenId ? { token_id: tokenId } : {}),
          })
          .eq('tx_hash', hash)

        if (error && tokenId) {
          const fallback = await supabaseAdmin
            .from('nft_mints')
            .update({ status: 'confirmed' })
            .eq('tx_hash', hash)

          error = fallback.error
        }

        mintRecorded = !error
      } catch (recordError) {
        console.warn('Mint confirmation persistence skipped:', recordError)
      }

      return NextResponse.json({
        success: true,
        hash,
        type,
        verified: Boolean(mintEvent),
        tokenId,
        walletAddress,
        contractAddress: SOUNDARYA_SCORE_ADDRESS,
        mintRecorded,
      })
    }

    return NextResponse.json({
      success: true,
      hash,
      type,
      verified: true,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
