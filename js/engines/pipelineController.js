/**
 * StrategyIQ Intelligence Pipeline Controller
 * Manages the flow from raw input to artifact generation.
 */

// If running in Node/Worker environment
let signalEngine, artifactEngine, stagingFormatter;

if (typeof require !== 'undefined') {
    signalEngine = require('./signalEngine');
    artifactEngine = require('./artifactEngine');
    stagingFormatter = require('./stagingFormatter');
}

/**
 * Main processing pipeline
 * input → signalEngine → stagingFormatter → artifactEngine
 */
async function processIntelligencePipeline(rawInput) {
    try {
        // 1. Execute Signal Engine
        const signalResult = await signalEngine.processSignal(rawInput);
        
        // 2. Execute Staging Formatter
        const stagingResult = await stagingFormatter.formatStaging(signalResult);
        
        // 3. Default to auto-approve for Version 1
        const refinedInsight = "Simulated insight from signal engine";
        const recommendedAction = "Simulated action from signal engine";
        const outputType = "Guide";
        
        // 4. Execute Artifact Engine
        const artifactResult = await artifactEngine.generateArtifact(refinedInsight, recommendedAction, outputType);
        
        return {
            signal: "Captured Signal",
            refinedInsight: refinedInsight,
            whyItMatters: "Simulated tension gap",
            recommendedAction: recommendedAction,
            output: outputType,
            stagingPreview: stagingResult,
            artifact: artifactResult
        };
    } catch (error) {
        console.error("Pipeline Error:", error);
        throw error;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { processIntelligencePipeline };
}
