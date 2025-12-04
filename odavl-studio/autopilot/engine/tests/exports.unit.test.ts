import { describe, it, expect } from 'vitest';
import { predict, EnsemblePrediction, QualityRiskAssessment, PreventiveRecommendations } from '../src/predictive-engine';
import { QualityMetrics, __training_data_types_stub } from '../src/training-data.types';
import { TeamMetrics, TimeSeriesData, TimeSeriesDataPoint, __analytics_types_stub } from '../src/analytics.types';

describe('predictive-engine exports', () => {
    it('predict() returns null (stub)', () => {
        expect(predict()).toBeNull();
    });
    it('EnsemblePrediction is defined', () => {
        expect(EnsemblePrediction).toBeDefined();
    });
    it('QualityRiskAssessment is defined', () => {
        expect(QualityRiskAssessment).toBeDefined();
    });
    it('PreventiveRecommendations is defined', () => {
        expect(PreventiveRecommendations).toBeDefined();
    });
});

describe('training-data.types exports', () => {
    it('QualityMetrics is defined', () => {
        expect(QualityMetrics).toBeDefined();
    });
    it('__training_data_types_stub is 0', () => {
        expect(__training_data_types_stub).toBe(0);
    });
});

describe('analytics.types exports', () => {
    it('TeamMetrics is defined', () => {
        expect(TeamMetrics).toBeDefined();
    });
    it('TimeSeriesData is defined', () => {
        expect(TimeSeriesData).toBeDefined();
    });
    it('TimeSeriesDataPoint is defined', () => {
        expect(TimeSeriesDataPoint).toBeDefined();
    });
    it('__analytics_types_stub is 0', () => {
        expect(__analytics_types_stub).toBe(0);
    });
});
