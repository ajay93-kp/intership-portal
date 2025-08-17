// Simple Machine Learning Utilities for Text Analysis

class SimpleML {
    constructor() {
        // Positive and negative word lists for sentiment analysis
        this.positiveWords = new Set([
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect',
            'completed', 'finished', 'successful', 'achieved', 'learned', 'improved',
            'enjoyed', 'loved', 'exciting', 'interesting', 'challenging', 'rewarding',
            'productive', 'efficient', 'helpful', 'supportive', 'collaborative',
            'awesome', 'brilliant', 'outstanding', 'superb', 'terrific', 'fabulous'
        ]);

        this.negativeWords = new Set([
            'bad', 'terrible', 'awful', 'horrible', 'difficult', 'hard', 'struggling',
            'failed', 'problem', 'issue', 'error', 'bug', 'broken', 'frustrated',
            'confused', 'lost', 'stuck', 'blocked', 'delayed', 'complicated',
            'complex', 'overwhelming', 'stressful', 'tiring', 'annoying', 'disappointing'
        ]);

        // Technical terms for skill detection
        this.technicalTerms = new Set([
            'javascript', 'react', 'node', 'python', 'java', 'sql', 'database',
            'api', 'frontend', 'backend', 'fullstack', 'development', 'programming',
            'coding', 'algorithm', 'data structure', 'framework', 'library',
            'git', 'github', 'deployment', 'testing', 'debugging', 'optimization'
        ]);

        // Learning indicators
        this.learningTerms = new Set([
            'learned', 'understood', 'figured', 'discovered', 'explored', 'studied',
            'practiced', 'mastered', 'grasped', 'comprehended', 'analyzed', 'researched'
        ]);
    }

    // Analyze sentiment of text
    analyzeSentiment(text) {
        if (!text || typeof text !== 'string') {
            return 0.0;
        }

        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        let positiveCount = 0;
        let negativeCount = 0;

        words.forEach(word => {
            if (this.positiveWords.has(word)) {
                positiveCount++;
            } else if (this.negativeWords.has(word)) {
                negativeCount++;
            }
        });

        const totalWords = words.length;
        if (totalWords === 0) return 0.0;

        const positiveRatio = positiveCount / totalWords;
        const negativeRatio = negativeCount / totalWords;
        const sentimentScore = positiveRatio - negativeRatio;

        // Normalize to -1 to 1 range
        return Math.max(-1.0, Math.min(1.0, sentimentScore * 5));
    }

    // Get sentiment label
    getSentimentLabel(score) {
        if (score >= 0.1) return 'positive';
        if (score <= -0.1) return 'negative';
        return 'neutral';
    }

    // Classify progress quality
    classifyProgressQuality(text) {
        if (!text || typeof text !== 'string') {
            return 'satisfactory';
        }

        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        let positiveCount = 0;
        let negativeCount = 0;

        words.forEach(word => {
            if (this.positiveWords.has(word)) {
                positiveCount++;
            } else if (this.negativeWords.has(word)) {
                negativeCount++;
            }
        });

        if (positiveCount > negativeCount && positiveCount >= 3) {
            return 'good';
        } else if (negativeCount > positiveCount && negativeCount >= 2) {
            return 'needs_improvement';
        } else {
            return 'satisfactory';
        }
    }

    // Extract keywords from text
    extractKeywords(text, topN = 5) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs'
        ]);

        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const filteredWords = words.filter(word => 
            !stopWords.has(word) && word.length > 3
        );

        // Count word frequency
        const wordFreq = {};
        filteredWords.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        // Sort by frequency and return top N
        return Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, topN)
            .map(([word]) => word);
    }

    // Generate comprehensive insights
    getProgressInsights(text) {
        const sentimentScore = this.analyzeSentiment(text);
        const quality = this.classifyProgressQuality(text);
        const keywords = this.extractKeywords(text, 3);
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];

        const insights = {
            sentimentScore: parseFloat(sentimentScore.toFixed(3)),
            sentimentLabel: this.getSentimentLabel(sentimentScore),
            quality: quality,
            keywords: keywords,
            wordCount: words.length,
            hasTechnicalTerms: words.some(word => this.technicalTerms.has(word)),
            hasLearningTerms: words.some(word => this.learningTerms.has(word)),
            readability: this.calculateReadability(text),
            complexity: this.assessComplexity(text)
        };

        return insights;
    }

    // Calculate basic readability score
    calculateReadability(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const syllables = this.countSyllables(text);

        if (sentences.length === 0 || words.length === 0) return 0;

        const avgSentenceLength = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;

        // Simple Flesch Reading Ease approximation
        const readability = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
        return Math.max(0, Math.min(100, readability));
    }

    // Count syllables (approximation)
    countSyllables(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        let syllableCount = 0;

        words.forEach(word => {
            const vowels = word.match(/[aeiouy]+/g) || [];
            syllableCount += vowels.length;
        });

        return syllableCount;
    }

    // Assess text complexity
    assessComplexity(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const longWords = words.filter(word => word.length > 6).length;
        const technicalWordCount = words.filter(word => this.technicalTerms.has(word)).length;

        if (technicalWordCount > 3) return 'high';
        if (longWords > words.length * 0.3) return 'medium';
        return 'low';
    }
}

module.exports = new SimpleML();