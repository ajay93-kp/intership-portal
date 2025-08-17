import re
from collections import Counter

class SimpleML:
    def __init__(self):
        # Simple positive and negative word lists
        self.positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect',
            'completed', 'finished', 'successful', 'achieved', 'learned', 'improved',
            'enjoyed', 'loved', 'exciting', 'interesting', 'challenging', 'rewarding',
            'productive', 'efficient', 'helpful', 'supportive', 'collaborative'
        }
        
        self.negative_words = {
            'bad', 'terrible', 'awful', 'horrible', 'difficult', 'hard', 'struggling',
            'failed', 'failed', 'problem', 'issue', 'error', 'bug', 'broken',
            'frustrated', 'confused', 'lost', 'stuck', 'blocked', 'delayed',
            'complicated', 'complex', 'overwhelming', 'stressful', 'tiring'
        }
        
    def analyze_sentiment(self, text):
        """
        Simple sentiment analysis using word frequency
        Returns a score between -1 (negative) and 1 (positive)
        """
        if not text:
            return 0.0
            
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        
        positive_count = sum(1 for word in words if word in self.positive_words)
        negative_count = sum(1 for word in words if word in self.negative_words)
        
        total_words = len(words)
        if total_words == 0:
            return 0.0
            
        # Calculate sentiment score
        positive_ratio = positive_count / total_words
        negative_ratio = negative_count / total_words
        
        sentiment_score = positive_ratio - negative_ratio
        
        # Normalize to -1 to 1 range
        return max(-1.0, min(1.0, sentiment_score * 5))
    
    def get_sentiment_label(self, score):
        """
        Convert sentiment score to label
        """
        if score >= 0.1:
            return 'positive'
        elif score <= -0.1:
            return 'negative'
        else:
            return 'neutral'
    
    def classify_progress_quality(self, text):
        """
        Simple classification of progress update quality
        Returns: 'good', 'satisfactory', 'needs_improvement'
        """
        if not text:
            return 'satisfactory'
            
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        
        positive_count = sum(1 for word in words if word in self.positive_words)
        negative_count = sum(1 for word in words if word in self.negative_words)
        
        # Simple logic based on word counts
        if positive_count > negative_count and positive_count >= 3:
            return 'good'
        elif negative_count > positive_count and negative_count >= 2:
            return 'needs_improvement'
        else:
            return 'satisfactory'
    
    def extract_keywords(self, text, top_n=5):
        """
        Extract important keywords from text
        """
        if not text:
            return []
            
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs'
        }
        
        # Extract words
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Filter out stop words and short words
        filtered_words = [word for word in words if word not in stop_words and len(word) > 3]
        
        # Count frequency
        word_freq = Counter(filtered_words)
        
        # Return top N words
        return [word for word, freq in word_freq.most_common(top_n)]
    
    def get_progress_insights(self, text):
        """
        Generate insights about the progress update
        """
        sentiment_score = self.analyze_sentiment(text)
        quality = self.classify_progress_quality(text)
        keywords = self.extract_keywords(text, 3)
        
        insights = {
            'sentiment_score': sentiment_score,
            'sentiment_label': self.get_sentiment_label(sentiment_score),
            'quality': quality,
            'keywords': keywords,
            'word_count': len(text.split()),
            'has_technical_terms': any(word in text.lower() for word in ['code', 'programming', 'development', 'software', 'database', 'api', 'framework']),
            'has_learning_terms': any(word in text.lower() for word in ['learned', 'understood', 'figured', 'discovered', 'explored', 'studied'])
        }
        
        return insights

# Global ML instance
ml_utils = SimpleML()