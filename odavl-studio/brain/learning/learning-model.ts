/**
 * ODAVL Brain - Machine Learning Model
 * Phase P9: TensorFlow.js-based deployment success prediction
 * 
 * Architecture:
 * - Input: 8 features (risk, test, baseline, volatility, failures)
 * - Hidden: Dense(16) → Dense(8)
 * - Output: Sigmoid (probability 0-1)
 */

import * as tf from '@tensorflow/tfjs-node';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Training sample for ML model
 */
export interface TrainingSample {
  features: number[]; // [riskWeight, testImpact, baselineStability, volatility, criticalFailures, highFailures, regressionCount, improvementCount]
  outcome: boolean; // true = deployment succeeded, false = failed
}

/**
 * ML Model configuration
 */
export interface ModelConfig {
  inputShape: number;
  hiddenUnits: [number, number];
  learningRate: number;
  epochs: number;
  batchSize: number;
}

/**
 * Default model configuration
 */
const DEFAULT_CONFIG: ModelConfig = {
  inputShape: 8,
  hiddenUnits: [16, 8],
  learningRate: 0.001,
  epochs: 50,
  batchSize: 32,
};

/**
 * ODAVL Brain ML Model
 */
export class BrainMLModel {
  private model: tf.Sequential | null = null;
  private config: ModelConfig;
  private modelPath: string;

  constructor(config: Partial<ModelConfig> = {}, modelDir: string = '.odavl/ml-models') {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.modelPath = path.join(modelDir, 'brain-deployment-predictor');
  }

  /**
   * Create neural network architecture
   */
  private createModel(): tf.Sequential {
    const model = tf.sequential();

    // Input → Hidden Layer 1 (16 units)
    model.add(tf.layers.dense({
      inputShape: [this.config.inputShape],
      units: this.config.hiddenUnits[0],
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));

    // Hidden Layer 1 → Hidden Layer 2 (8 units)
    model.add(tf.layers.dense({
      units: this.config.hiddenUnits[1],
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));

    // Dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Output Layer (sigmoid for binary classification)
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    }));

    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Train model with training samples
   */
  async trainModel(samples: TrainingSample[]): Promise<{
    loss: number;
    accuracy: number;
    epochs: number;
  }> {
    if (samples.length < 10) {
      throw new Error('Insufficient training data (minimum 10 samples required)');
    }

    // Create or reset model
    if (this.model) {
      this.model.dispose();
    }
    this.model = this.createModel();

    // Prepare training data
    const features = samples.map(s => s.features);
    const labels = samples.map(s => s.outcome ? 1 : 0);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    try {
      // Train model
      const history = await this.model.fit(xs, ys, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: 0.2,
        shuffle: true,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`[Brain ML] Epoch ${epoch}: loss=${logs?.loss.toFixed(4)}, acc=${logs?.acc.toFixed(4)}`);
            }
          },
        },
      });

      const finalEpoch = history.epoch.length - 1;
      const loss = Array.isArray(history.history.loss) 
        ? history.history.loss[finalEpoch] 
        : 0;
      const accuracy = Array.isArray(history.history.acc)
        ? history.history.acc[finalEpoch]
        : 0;

      console.log(`[Brain ML] ✅ Training complete: loss=${loss.toFixed(4)}, accuracy=${accuracy.toFixed(4)}`);

      return {
        loss: typeof loss === 'number' ? loss : 0,
        accuracy: typeof accuracy === 'number' ? accuracy : 0,
        epochs: this.config.epochs,
      };
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  /**
   * Predict deployment outcome
   * @returns Probability of failure (0-1)
   */
  async predictOutcome(inputVector: number[]): Promise<number> {
    if (!this.model) {
      throw new Error('Model not loaded or trained. Call trainModel() or loadModel() first.');
    }

    if (inputVector.length !== this.config.inputShape) {
      throw new Error(`Invalid input vector length. Expected ${this.config.inputShape}, got ${inputVector.length}`);
    }

    const input = tf.tensor2d([inputVector]);
    try {
      const prediction = this.model.predict(input) as tf.Tensor;
      const failureProbability = await prediction.data();
      return failureProbability[0];
    } finally {
      input.dispose();
    }
  }

  /**
   * Save model to disk
   */
  async saveModel(): Promise<string> {
    if (!this.model) {
      throw new Error('No model to save. Train model first.');
    }

    // Ensure directory exists
    const modelDir = path.dirname(this.modelPath);
    if (!existsSync(modelDir)) {
      await mkdir(modelDir, { recursive: true });
    }

    // Save model
    const savePath = `file://${this.modelPath}`;
    await this.model.save(savePath);

    // Save metadata
    const metadata = {
      config: this.config,
      savedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    await writeFile(
      path.join(this.modelPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`[Brain ML] 💾 Model saved to ${this.modelPath}`);
    return this.modelPath;
  }

  /**
   * Load model from disk
   */
  async loadModel(): Promise<boolean> {
    try {
      const loadPath = `file://${this.modelPath}/model.json`;
      
      if (!existsSync(path.join(this.modelPath, 'model.json'))) {
        console.warn(`[Brain ML] ⚠️ Model not found at ${this.modelPath}`);
        return false;
      }

      this.model = await tf.loadLayersModel(loadPath) as tf.Sequential;
      
      // Load metadata
      const metadataPath = path.join(this.modelPath, 'metadata.json');
      if (existsSync(metadataPath)) {
        const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
        this.config = { ...this.config, ...metadata.config };
      }

      console.log(`[Brain ML] ✅ Model loaded from ${this.modelPath}`);
      return true;
    } catch (error) {
      console.error(`[Brain ML] ❌ Failed to load model:`, error);
      return false;
    }
  }

  /**
   * Check if model is ready for predictions
   */
  isModelReady(): boolean {
    return this.model !== null;
  }

  /**
   * Dispose model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

// ============================================================================
// Phase P10: LSTM TREND PREDICTION MODEL
// ============================================================================

/**
 * LSTM sample for time-series trend prediction
 */
export interface LSTMSample {
  riskWeight: number;
  testImpact: number;
  baselineStability: number;
  volatility: number;
  outcome: number; // 0 = failure, 1 = success
}

/**
 * ODAVL Brain LSTM Model for Time-Series Trend Prediction
 * Phase P10: Analyzes deployment patterns over time
 * 
 * Architecture:
 * - Input: Last N=20 deployment samples (sequence)
 * - LSTM: 32 units
 * - Dense: 16 units (relu)
 * - Output: 1 unit (sigmoid) - failure probability
 */
export class BrainLSTMModel {
  private model: tf.Sequential | null = null;
  private readonly sequenceLength = 20;
  private readonly featureCount = 4; // riskWeight, testImpact, baselineStability, volatility
  private modelPath: string;

  constructor() {
    const odavlRoot = path.join(process.cwd(), '.odavl', 'ml-models', 'brain-lstm-trend');
    this.modelPath = `file://${odavlRoot}`;
  }

  /**
   * Phase P10: Create LSTM model for trend prediction
   */
  private createModel(): tf.Sequential {
    const model = tf.sequential();

    // LSTM layer (32 units)
    model.add(tf.layers.lstm({
      units: 32,
      inputShape: [this.sequenceLength, this.featureCount],
      returnSequences: false,
    }));

    // Dense layer (16 units, relu)
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
    }));

    // Output layer (1 unit, sigmoid)
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    }));

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Phase P10: Train LSTM model with time-series samples
   */
  async trainLSTM(samples: LSTMSample[]): Promise<{ loss: number; accuracy: number; epochs: number }> {
    if (samples.length < this.sequenceLength) {
      throw new Error(`LSTM requires at least ${this.sequenceLength} samples`);
    }

    // Create sequences from samples
    const sequences: number[][][] = [];
    const labels: number[] = [];

    for (let i = this.sequenceLength; i < samples.length; i++) {
      const sequence: number[][] = [];
      for (let j = i - this.sequenceLength; j < i; j++) {
        sequence.push([
          samples[j].riskWeight,
          samples[j].testImpact,
          samples[j].baselineStability,
          samples[j].volatility,
        ]);
      }
      sequences.push(sequence);
      labels.push(samples[i].outcome);
    }

    // Convert to tensors
    const xs = tf.tensor3d(sequences);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Create model
    this.model = this.createModel();

    // Train
    const history = await this.model.fit(xs, ys, {
      epochs: 30,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0,
    });

    // Get final metrics
    const finalEpoch = history.epoch.length - 1;
    const loss = history.history.loss[finalEpoch] as number;
    const accuracy = history.history.acc[finalEpoch] as number;

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    return { loss, accuracy, epochs: history.epoch.length };
  }

  /**
   * Phase P10: Predict trend from recent samples
   */
  async predictTrend(samples: LSTMSample[]): Promise<number> {
    if (!this.model) {
      throw new Error('LSTM model not loaded or trained');
    }

    if (samples.length < this.sequenceLength) {
      throw new Error(`LSTM requires ${this.sequenceLength} recent samples`);
    }

    // Take last N samples
    const recentSamples = samples.slice(-this.sequenceLength);

    // Build sequence
    const sequence: number[][] = recentSamples.map(s => [
      s.riskWeight,
      s.testImpact,
      s.baselineStability,
      s.volatility,
    ]);

    // Convert to tensor
    const input = tf.tensor3d([sequence]);

    // Predict
    const prediction = this.model.predict(input) as tf.Tensor;
    const failureProbability = (await prediction.data())[0];

    // Clean up
    input.dispose();
    prediction.dispose();

    return failureProbability;
  }

  /**
   * Phase P10: Save LSTM model to disk
   */
  async saveLSTMModel(): Promise<string> {
    if (!this.model) {
      throw new Error('No LSTM model to save');
    }

    const dirPath = this.modelPath.replace('file://', '');
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    await this.model.save(this.modelPath);

    // Save metadata
    const metadata = {
      sequenceLength: this.sequenceLength,
      featureCount: this.featureCount,
      savedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    await writeFile(
      path.join(dirPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return dirPath;
  }

  /**
   * Phase P10: Load LSTM model from disk
   */
  async loadLSTMModel(): Promise<boolean> {
    try {
      const dirPath = this.modelPath.replace('file://', '');
      const modelJsonPath = path.join(dirPath, 'model.json');

      if (!existsSync(modelJsonPath)) {
        return false;
      }

      this.model = await tf.loadLayersModel(this.modelPath) as tf.Sequential;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if LSTM model is ready
   */
  isModelReady(): boolean {
    return this.model !== null;
  }

  /**
   * Dispose LSTM model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

/**
 * Phase P11: Multi-Task Learning Sample
 * Contains labels for all 4 prediction tasks
 */
export interface MTLSample {
  inputVector: number[]; // 8 features
  deploymentSuccess: number; // 0 or 1
  performanceRegression: number; // 0 or 1
  securityRisk: number; // 0 or 1
  downtimeRisk: number; // 0 or 1
}

/**
 * Phase P11: MTL Prediction Result
 * Contains predictions from all 4 task heads
 */
export interface MTLPrediction {
  deploymentSuccessProbability: number;
  performanceRegressionProbability: number;
  securityRiskProbability: number;
  downtimeRiskProbability: number;
}

/**
 * ODAVL Brain Multi-Task Learning Model
 * Phase P11: Shared-bottom architecture with 4 prediction heads
 * 
 * Architecture:
 * - Shared Layers: Input(8) → Dense(32,relu) → Dense(16,relu) → Dropout(0.2)
 * - Head A: Deployment Success (sigmoid)
 * - Head B: Performance Regression (sigmoid)
 * - Head C: Security Risk (sigmoid)
 * - Head D: Downtime Risk (sigmoid)
 * 
 * Loss: Weighted BCE = 0.5*success + 0.2*performance + 0.2*security + 0.1*downtime
 */
export class BrainMTLModel {
  private model: tf.LayersModel | null = null;
  private readonly inputSize = 8;
  private modelPath: string;

  constructor() {
    const odavlRoot = path.join(process.cwd(), '.odavl', 'ml-models', 'brain-mtl');
    this.modelPath = `file://${odavlRoot}`;
  }

  /**
   * Phase P11: Create MTL model with shared bottom and 4 task heads
   */
  private createModel(): tf.LayersModel {
    // Shared input
    const input = tf.input({ shape: [this.inputSize] });

    // Shared layers (bottom)
    let shared = tf.layers.dense({ units: 32, activation: 'relu', name: 'shared_dense1' }).apply(input) as tf.SymbolicTensor;
    shared = tf.layers.dense({ units: 16, activation: 'relu', name: 'shared_dense2' }).apply(shared) as tf.SymbolicTensor;
    shared = tf.layers.dropout({ rate: 0.2, name: 'shared_dropout' }).apply(shared) as tf.SymbolicTensor;

    // Task-specific heads
    const headA = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'head_success' }).apply(shared) as tf.SymbolicTensor;
    const headB = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'head_performance' }).apply(shared) as tf.SymbolicTensor;
    const headC = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'head_security' }).apply(shared) as tf.SymbolicTensor;
    const headD = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'head_downtime' }).apply(shared) as tf.SymbolicTensor;

    // Create model with multiple outputs
    const model = tf.model({ inputs: input, outputs: [headA, headB, headC, headD] });

    // Compile with weighted loss
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: ['binaryCrossentropy', 'binaryCrossentropy', 'binaryCrossentropy', 'binaryCrossentropy'],
      lossWeights: [0.5, 0.2, 0.2, 0.1], // success, performance, security, downtime
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Phase P11: Train MTL model with multi-task samples
   */
  async trainMTL(samples: MTLSample[]): Promise<{ loss: number; accuracy: number; epochs: number }> {
    if (samples.length < 30) {
      throw new Error('Phase P11: MTL training requires at least 30 samples');
    }

    // Prepare inputs
    const xs = tf.tensor2d(samples.map(s => s.inputVector));

    // Prepare outputs (4 separate tensors for 4 heads)
    const y1 = tf.tensor2d(samples.map(s => [s.deploymentSuccess]));
    const y2 = tf.tensor2d(samples.map(s => [s.performanceRegression]));
    const y3 = tf.tensor2d(samples.map(s => [s.securityRisk]));
    const y4 = tf.tensor2d(samples.map(s => [s.downtimeRisk]));

    this.model = this.createModel();

    const history = await this.model.fit(xs, [y1, y2, y3, y4], {
      epochs: 40,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0,
    });

    // Cleanup tensors
    xs.dispose();
    y1.dispose();
    y2.dispose();
    y3.dispose();
    y4.dispose();

    const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
    const finalAcc = history.history.acc?.[history.history.acc.length - 1] as number || 0;

    return {
      loss: finalLoss,
      accuracy: finalAcc,
      epochs: 40,
    };
  }

  /**
   * Phase P11: Predict all 4 tasks from input vector
   */
  async predictMTL(inputVector: number[]): Promise<MTLPrediction> {
    if (!this.model) {
      throw new Error('Phase P11: MTL model not loaded or trained');
    }

    const input = tf.tensor2d([inputVector]);
    const predictions = this.model.predict(input) as tf.Tensor[];

    const results = await Promise.all(predictions.map(p => p.data()));

    input.dispose();
    predictions.forEach(p => p.dispose());

    return {
      deploymentSuccessProbability: results[0][0],
      performanceRegressionProbability: results[1][0],
      securityRiskProbability: results[2][0],
      downtimeRiskProbability: results[3][0],
    };
  }

  /**
   * Phase P11: Save MTL model to disk
   */
  async saveMTLModel(): Promise<string> {
    if (!this.model) {
      throw new Error('Phase P11: No MTL model to save');
    }

    const dirPath = this.modelPath.replace('file://', '');
    await mkdirp(dirPath);

    await this.model.save(this.modelPath);

    const metadata = {
      inputSize: this.inputSize,
      tasks: ['success', 'performance', 'security', 'downtime'],
      lossWeights: [0.5, 0.2, 0.2, 0.1],
      savedAt: new Date().toISOString(),
      version: 'p11-mtl-v1',
    };

    await writeFile(
      path.join(dirPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return dirPath;
  }

  /**
   * Phase P11: Load MTL model from disk
   */
  async loadMTLModel(): Promise<boolean> {
    try {
      const dirPath = this.modelPath.replace('file://', '');
      const modelJsonPath = path.join(dirPath, 'model.json');

      if (!existsSync(modelJsonPath)) {
        return false;
      }

      this.model = await tf.loadLayersModel(this.modelPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if MTL model is ready
   */
  isModelReady(): boolean {
    return this.model !== null;
  }

  /**
   * Dispose MTL model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
