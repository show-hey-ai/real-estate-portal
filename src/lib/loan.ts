export interface LoanInput {
  price: number
  downPaymentRate: number
  annualRatePercent: number
  years: number
}

export interface LoanResult {
  downPayment: number
  principal: number
  monthlyPayment: number
  totalInterest: number
}

/** Level-payment (元利均等) mortgage estimate. Fees, taxes and lender conditions are not included. */
export function estimateLoan({ price, downPaymentRate, annualRatePercent, years }: LoanInput): LoanResult {
  const downPayment = Math.round(price * Math.min(Math.max(downPaymentRate, 0), 1))
  const principal = Math.max(price - downPayment, 0)
  const months = Math.max(Math.round(years * 12), 1)
  const monthlyRate = annualRatePercent / 100 / 12
  const monthlyPayment = principal === 0 ? 0
    : monthlyRate === 0 ? principal / months
    : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
  return {
    downPayment,
    principal,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(monthlyPayment * months - principal),
  }
}
