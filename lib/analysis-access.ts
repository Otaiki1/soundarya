interface AnalysisAccessParams {
  analysis: {
    user_id?: string | null;
    session_id?: string | null;
    wallet_address?: string | null;
  };
  userId?: string | null;
  sessionId?: string | null;
  walletAddress?: string | null;
}

export function hasAnalysisAccess({
  analysis,
  userId,
  sessionId,
  walletAddress,
}: AnalysisAccessParams): boolean {
  if (userId && analysis.user_id === userId) {
    return true;
  }

  if (sessionId && analysis.session_id === sessionId) {
    return true;
  }

  if (
    walletAddress &&
    analysis.wallet_address &&
    analysis.wallet_address.toLowerCase() === walletAddress.toLowerCase()
  ) {
    return true;
  }

  return false;
}
