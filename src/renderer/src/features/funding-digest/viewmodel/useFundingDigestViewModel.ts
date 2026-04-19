import { useEffect } from 'react'
import { useDataState } from 'astra'
import { FundingRepo, FundingDigestPayload } from '../repo/FundingRepo'

export const useFundingDigestViewModel = () => {
  const repo = new FundingRepo()
  const [digestState, executeLoad] = useDataState<FundingDigestPayload>()

  useEffect(() => {
    executeLoad(() => repo.getFundingDigest())
  }, [])

  return {
    digestState,
    reload: () => executeLoad(() => repo.getFundingDigest())
  }
}
