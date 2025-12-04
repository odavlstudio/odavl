/**
 * TensorFlow V2 Model Training Script
 * Phase 2 Week 7-8: ML System V2
 * 
 * Trains neural network for trust score prediction
 * Target: >92% accuracy, 60% auto-approval rate
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GitHubDataMiner, type GitHubFixSample } from '../learning/data-collection.js';
import { MLTrustPredictor, type MLFeatures, type TrainingData } from '../learning/ml-trust-predictor.js';

interface TrainingConfig {
    datasetPath?: string;
    modelOutputPath?: string;
    epochs?: number;
    batchSize?: number;
    validationSplit?: number;
    learningRate?: number;
    targetSamples?: number;
}

interface TrainingMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
}

export class TensorFlowV2Trainer {
    private config: Required<TrainingConfig>;
    private model: tf.Sequential | null = null;
    private trainingData: TrainingData[] = [];
    private validationData: TrainingData[] = [];

    constructor(config: TrainingConfig = {}) {
        this.config = {
            datasetPath: config.datasetPath || '.odavl/ml-data/github-samples.json',
            modelOutputPath: config.modelOutputPath || '.odavl/ml-models/trust-predictor-v2',
            epochs: config.epochs || 100,
            batchSize: config.batchSize || 32,
            validationSplit: config.validationSplit || 0.2,
            learningRate: config.learningRate || 0.001,
            targetSamples: config.targetSamples || 100000,
        };
    }

    /**
     * Full training pipeline
     */
    async train(): Promise<TrainingMetrics> {
        console.log('🚀 TensorFlow V2 Training Pipeline Starting...\n');

        // Step 1: Collect data
        await this.collectTrainingData();

        // Step 2: Prepare features
        await this.prepareFeatures();

        // Step 3: Build model
        this.buildModel();

        // Step 4: Train model
        const metrics = await this.trainModel();

        // Step 5: Evaluate
        await this.evaluateModel();

        // Step 6: Save model
        await this.saveModel();

        console.log('\n✅ Training Complete!');
        return metrics;
    }

    /**
     * Step 1: Collect training data from GitHub
     */
    private async collectTrainingData(): Promise<void> {
        console.log('📦 Step 1/6: Collecting GitHub Training Data\n');

        // Check if dataset already exists
        try {
            const existingData = await fs.readFile(this.config.datasetPath, 'utf-8');
            const samples = JSON.parse(existingData) as GitHubFixSample[];
            
            if (samples.length >= this.config.targetSamples) {
                console.log(`✅ Found existing dataset: ${samples.length} samples`);
                console.log(`   Location: ${this.config.datasetPath}\n`);
                return;
            }

            console.log(`⚠️  Existing dataset has only ${samples.length} samples`);
            console.log(`   Target: ${this.config.targetSamples} samples`);
            console.log(`   Collecting ${this.config.targetSamples - samples.length} more...\n`);
        } catch {
            console.log('📥 No existing dataset found, collecting from scratch...\n');
        }

        // Collect data from GitHub
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            throw new Error('GITHUB_TOKEN environment variable required for data collection');
        }

        const miner = new GitHubDataMiner(githubToken);

        // Collect samples by language
        const languages = [
            { name: 'TypeScript', target: 40000 },
            { name: 'JavaScript', target: 30000 },
            { name: 'Python', target: 30000 },
        ];

        let totalCollected = 0;

        for (const lang of languages) {
            console.log(`\n🔍 Mining ${lang.name} repositories...`);
            console.log(`   Target: ${lang.target} samples`);

            const samples = await miner.mineRepositories(
                lang.name,
                lang.target,
                (progress) => {
                    const percent = ((progress.samplesCollected / progress.samplesTarget) * 100).toFixed(1);
                    const eta = Math.ceil(progress.estimatedTimeRemaining / 60);
                    process.stdout.write(
                        `\r   Progress: ${progress.samplesCollected}/${progress.samplesTarget} (${percent}%) | ETA: ${eta}m`
                    );
                }
            );

            totalCollected += samples.length;
            console.log(`\n   ✅ Collected ${samples.length} ${lang.name} samples`);
        }

        // Export combined dataset
        const allSamples = miner.getSamples();
        const dir = path.dirname(this.config.datasetPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.config.datasetPath, JSON.stringify(allSamples, null, 2));

        console.log(`\n💾 Saved ${allSamples.length} samples to ${this.config.datasetPath}`);
        console.log(`\n📊 Dataset Statistics:`);
        const stats = miner.getStats();
        console.log(`   Total Samples: ${stats.totalSamples}`);
        console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`   By Language:`, stats.byLanguage);
        console.log(`   By Error Type:`, stats.byErrorType);
    }

    /**
     * Step 2: Prepare ML features from raw samples
     */
    private async prepareFeatures(): Promise<void> {
        console.log('\n🔧 Step 2/6: Preparing ML Features\n');

        // Load raw samples
        const rawData = await fs.readFile(this.config.datasetPath, 'utf-8');
        const samples = JSON.parse(rawData) as GitHubFixSample[];

        console.log(`   Processing ${samples.length} samples...`);

        // Convert to ML features
        for (const sample of samples) {
            const features = this.extractFeatures(sample);
            const label = sample.fixSucceeded ? 1 : 0;

            this.trainingData.push({
                features,
                label,
                metadata: {
                    recipeId: sample.id,
                    timestamp: sample.metadata.date,
                    errorType: sample.errorType,
                    language: sample.language,
                },
            });
        }

        // Shuffle data
        this.shuffleArray(this.trainingData);

        // Split train/validation
        const splitIndex = Math.floor(this.trainingData.length * (1 - this.config.validationSplit));
        this.validationData = this.trainingData.splice(splitIndex);

        console.log(`   ✅ Prepared ${this.trainingData.length} training samples`);
        console.log(`   ✅ Prepared ${this.validationData.length} validation samples`);
    }

    /**
     * Extract ML features from GitHub sample
     */
    private extractFeatures(sample: GitHubFixSample): MLFeatures {
        return {
            historicalSuccessRate: Math.random(), // Placeholder - calculate from history
            errorFrequency: this.normalizeErrorFrequency(sample.errorType),
            codeComplexity: Math.min(sample.complexity / 100, 1),
            linesChanged: Math.min(sample.linesChanged / 100, 1),
            filesModified: Math.min(1 / 10, 1), // Placeholder
            errorTypeCriticality: this.getErrorCriticality(sample.errorType),
            similarPastOutcomes: Math.random(), // Placeholder - cosine similarity
            timeSinceLastFailure: Math.random(), // Placeholder
            projectMaturity: Math.random(), // Placeholder
            testCoverage: Math.random(), // Placeholder
            recipeComplexity: Math.min(sample.linesChanged / 50, 1),
            communityTrust: Math.random(), // Placeholder
        };
    }

    /**
     * Step 3: Build neural network model
     */
    private buildModel(): void {
        console.log('\n🏗️  Step 3/6: Building Neural Network\n');

        this.model = tf.sequential({
            layers: [
                // Input layer (12 features)
                tf.layers.dense({
                    inputShape: [12],
                    units: 64,
                    activation: 'relu',
                    kernelInitializer: 'heNormal',
                }),
                tf.layers.dropout({ rate: 0.3 }),

                // Hidden layer 1
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    kernelInitializer: 'heNormal',
                }),
                tf.layers.dropout({ rate: 0.2 }),

                // Hidden layer 2
                tf.layers.dense({
                    units: 16,
                    activation: 'relu',
                    kernelInitializer: 'heNormal',
                }),
                tf.layers.dropout({ rate: 0.1 }),

                // Output layer (binary classification)
                tf.layers.dense({
                    units: 1,
                    activation: 'sigmoid',
                }),
            ],
        });

        // Compile model
        this.model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy', 'precision', 'recall'],
        });

        console.log('   ✅ Model Architecture:');
        console.log('      Input: 12 features');
        console.log('      Hidden: 64 → 32 → 16 neurons (ReLU + Dropout)');
        console.log('      Output: 1 neuron (Sigmoid)');
        console.log('      Optimizer: Adam (lr=0.001)');
        console.log('      Loss: Binary Crossentropy');
    }

    /**
     * Step 4: Train the model
     */
    private async trainModel(): Promise<TrainingMetrics> {
        console.log('\n🎓 Step 4/6: Training Model\n');

        if (!this.model) throw new Error('Model not built');

        // Convert to tensors
        const trainX = tf.tensor2d(this.trainingData.map(d => this.featuresToArray(d.features)));
        const trainY = tf.tensor2d(this.trainingData.map(d => [d.label]));
        const valX = tf.tensor2d(this.validationData.map(d => this.featuresToArray(d.features)));
        const valY = tf.tensor2d(this.validationData.map(d => [d.label]));

        // Train
        const history = await this.model.fit(trainX, trainY, {
            epochs: this.config.epochs,
            batchSize: this.config.batchSize,
            validationData: [valX, valY],
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        console.log(
                            `   Epoch ${epoch + 1}/${this.config.epochs}: ` +
                            `loss=${logs?.loss.toFixed(4)} ` +
                            `acc=${logs?.acc.toFixed(4)} ` +
                            `val_acc=${logs?.val_acc.toFixed(4)}`
                        );
                    }
                },
            },
        });

        // Cleanup tensors
        trainX.dispose();
        trainY.dispose();
        valX.dispose();
        valY.dispose();

        // Calculate metrics
        const finalLogs = history.history;
        const accuracy = finalLogs.acc[finalLogs.acc.length - 1];
        const precision = finalLogs.precision?.[finalLogs.precision.length - 1] || 0;
        const recall = finalLogs.recall?.[finalLogs.recall.length - 1] || 0;

        const metrics: TrainingMetrics = {
            accuracy,
            precision,
            recall,
            f1Score: (2 * precision * recall) / (precision + recall),
            falsePositiveRate: 0, // Calculate from confusion matrix
            falseNegativeRate: 0,
        };

        console.log(`\n   ✅ Training Complete!`);
        console.log(`      Accuracy: ${(accuracy * 100).toFixed(2)}%`);
        console.log(`      Precision: ${(precision * 100).toFixed(2)}%`);
        console.log(`      Recall: ${(recall * 100).toFixed(2)}%`);
        console.log(`      F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`);

        return metrics;
    }

    /**
     * Step 5: Evaluate model
     */
    private async evaluateModel(): Promise<void> {
        console.log('\n📊 Step 5/6: Evaluating Model\n');

        if (!this.model) throw new Error('Model not trained');

        // Test on validation set
        const valX = tf.tensor2d(this.validationData.map(d => this.featuresToArray(d.features)));
        const valY = tf.tensor2d(this.validationData.map(d => [d.label]));

        const result = this.model.evaluate(valX, valY) as tf.Scalar[];
        const loss = await result[0].data();
        const accuracy = await result[1].data();

        console.log(`   Validation Loss: ${loss[0].toFixed(4)}`);
        console.log(`   Validation Accuracy: ${(accuracy[0] * 100).toFixed(2)}%`);

        // Calculate auto-approval rate
        const predictions = this.model.predict(valX) as tf.Tensor;
        const predArray = await predictions.data();
        const autoApprovalThreshold = 0.7;
        const autoApprovalCount = Array.from(predArray).filter(p => p >= autoApprovalThreshold).length;
        const autoApprovalRate = autoApprovalCount / predArray.length;

        console.log(`   Auto-Approval Rate (threshold=0.7): ${(autoApprovalRate * 100).toFixed(1)}%`);

        // Cleanup
        valX.dispose();
        valY.dispose();
        predictions.dispose();
    }

    /**
     * Step 6: Save trained model
     */
    private async saveModel(): Promise<void> {
        console.log('\n💾 Step 6/6: Saving Model\n');

        if (!this.model) throw new Error('Model not trained');

        const modelPath = `file://${path.resolve(this.config.modelOutputPath)}`;
        await this.model.save(modelPath);

        console.log(`   ✅ Model saved to: ${this.config.modelOutputPath}`);
        console.log(`      Format: TensorFlow.js LayersModel`);
        console.log(`      Files: model.json + weights.bin`);
    }

    // Helper methods
    private featuresToArray(features: MLFeatures): number[] {
        return [
            features.historicalSuccessRate,
            features.errorFrequency,
            features.codeComplexity,
            features.linesChanged,
            features.filesModified,
            features.errorTypeCriticality,
            features.similarPastOutcomes,
            features.timeSinceLastFailure,
            features.projectMaturity,
            features.testCoverage,
            features.recipeComplexity,
            features.communityTrust,
        ];
    }

    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private normalizeErrorFrequency(errorType: string): number {
        const frequencies: Record<string, number> = {
            'typescript-type': 0.8,
            'security': 0.9,
            'import-missing': 0.6,
            'runtime-null': 0.7,
            'performance': 0.4,
            'general-fix': 0.5,
        };
        return frequencies[errorType] || 0.5;
    }

    private getErrorCriticality(errorType: string): number {
        const criticality: Record<string, number> = {
            'security': 1.0,
            'runtime-null': 0.8,
            'typescript-type': 0.6,
            'import-missing': 0.5,
            'performance': 0.4,
            'general-fix': 0.3,
        };
        return criticality[errorType] || 0.5;
    }
}

// CLI execution
if (require.main === module) {
    const trainer = new TensorFlowV2Trainer({
        targetSamples: 100000,
        epochs: 100,
        learningRate: 0.001,
    });

    trainer.train()
        .then((metrics) => {
            console.log('\n🎉 Training Pipeline Complete!');
            console.log('   Final Metrics:', metrics);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Training Failed:', error);
            process.exit(1);
        });
}
