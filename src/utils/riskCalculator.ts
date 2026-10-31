export interface RiskParameters {
  accountBalance: number;
  riskPercentage: number; // e.g. 1% or 2%
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  isLong: boolean;
}

export type RiskWarningCode =
  | 'CAPITAL_POSITIVE'
  | 'PRICES_POSITIVE'
  | 'LONG_SL'
  | 'LONG_TP'
  | 'SHORT_SL'
  | 'SHORT_TP'
  | 'HIGH_RISK'
  | 'LOW_RR';

export interface RiskAnalysisResult {
  riskAmount: number; // in currency, e.g. $100
  rewardAmount: number; // in currency, e.g. $250
  riskRewardRatio: number; // e.g. 2.5
  positionSize: number; // in units of asset
  positionValue: number; // in currency
  stopLossDistance: number;
  stopLossPercent: number;
  takeProfitDistance: number;
  takeProfitPercent: number;
  isValid: boolean;
  /** Messages français conservés pour compatibilité et tests. */
  warnings: string[];
  /** Codes stables pour l'affichage localisé. */
  warningCodes: RiskWarningCode[];
}

/**
 * Calculates accurate position sizing and risk/reward metrics for trades.
 */
export function calculateRisk(params: RiskParameters): RiskAnalysisResult {
  const { accountBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, isLong } = params;
  const warnings: string[] = [];

  if (accountBalance <= 0) {
    return {
      riskAmount: 0,
      rewardAmount: 0,
      riskRewardRatio: 0,
      positionSize: 0,
      positionValue: 0,
      stopLossDistance: 0,
      stopLossPercent: 0,
      takeProfitDistance: 0,
      takeProfitPercent: 0,
      isValid: false,
      warnings: ['Le capital du compte doit être supérieur à zéro.'],
      warningCodes: ['CAPITAL_POSITIVE'],
    };
  }

  if (entryPrice <= 0 || stopLossPrice <= 0 || takeProfitPrice <= 0) {
    return {
      riskAmount: 0,
      rewardAmount: 0,
      riskRewardRatio: 0,
      positionSize: 0,
      positionValue: 0,
      stopLossDistance: 0,
      stopLossPercent: 0,
      takeProfitDistance: 0,
      takeProfitPercent: 0,
      isValid: false,
      warnings: ['Les prix d\'entrée, de Stop-Loss et de Take-Profit doivent être strictement positifs.'],
      warningCodes: ['PRICES_POSITIVE'],
    };
  }

  // Validate directional logic
  const warningCodes: RiskWarningCode[] = [];
  if (isLong) {
    if (stopLossPrice >= entryPrice) {
      warnings.push('Pour un achat (LONG), le Stop-Loss doit être inférieur au prix d\'entrée.');
      warningCodes.push('LONG_SL');
    }
    if (takeProfitPrice <= entryPrice) {
      warnings.push('Pour un achat (LONG), le Take-Profit doit être supérieur au prix d\'entrée.');
      warningCodes.push('LONG_TP');
    }
  } else {
    if (stopLossPrice <= entryPrice) {
      warnings.push('Pour une vente (SHORT), le Stop-Loss doit être supérieur au prix d\'entrée.');
      warningCodes.push('SHORT_SL');
    }
    if (takeProfitPrice >= entryPrice) {
      warnings.push('Pour une vente (SHORT), le Take-Profit doit être inférieur au prix d\'entrée.');
      warningCodes.push('SHORT_TP');
    }
  }

  const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
  const takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);

  const stopLossPercent = (stopLossDistance / entryPrice) * 100;
  const takeProfitPercent = (takeProfitDistance / entryPrice) * 100;

  const riskAmount = (accountBalance * riskPercentage) / 100;
  
  // Position size in units: riskAmount / price distance to stop loss
  const positionSize = stopLossDistance > 0 ? riskAmount / stopLossDistance : 0;
  const positionValue = positionSize * entryPrice;
  const rewardAmount = positionSize * takeProfitDistance;

  const riskRewardRatio = riskAmount > 0 ? Number((rewardAmount / riskAmount).toFixed(2)) : 0;

  if (riskPercentage > 3) {
    warnings.push('Attention: Risque supérieur à 3% du capital sur un seul trade. Gestion prudente recommandée <= 2%.');
    warningCodes.push('HIGH_RISK');
  }

  if (riskRewardRatio < 1.5 && warnings.length === 0) {
    warnings.push('Ratio R:R inférieur à 1.5. Une espérance de gain mathématique favorable requiert idéalement un R:R >= 2.0.');
    warningCodes.push('LOW_RR');
  }

  return {
    riskAmount: Number(riskAmount.toFixed(2)),
    rewardAmount: Number(rewardAmount.toFixed(2)),
    riskRewardRatio,
    positionSize: Number(positionSize.toFixed(4)),
    positionValue: Number(positionValue.toFixed(2)),
    stopLossDistance: Number(stopLossDistance.toFixed(4)),
    stopLossPercent: Number(stopLossPercent.toFixed(2)),
    takeProfitDistance: Number(takeProfitDistance.toFixed(4)),
    takeProfitPercent: Number(takeProfitPercent.toFixed(2)),
    isValid: warnings.filter(w => w.includes('doit être')).length === 0,
    warnings,
    warningCodes,
  };
}
