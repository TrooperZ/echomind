import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// import { Nlp } from '@nlpjs/nlp';
// import { LangEn } from '@nlpjs/lang-en';

// Define emotion keywords
const emotionKeywords = {
  happy: ['happy', 'joy', 'delighted', 'thrilled', 'pleased', 'cheerful', 'content', 'glad', 'enjoy', 'smile', 'laugh', 'wonderful', 'great'],
  sad: ['sad', 'unhappy', 'depressed', 'miserable', 'heartbroken', 'upset', 'disappointed', 'crying', 'tears', 'grief', 'sorrow', 'regret', 'despair'],
  motivated: ['motivated', 'determined', 'inspired', 'energized', 'driven', 'ambitious', 'eager', 'enthusiastic', 'committed', 'productive', 'focused', 'goal'],
  love: ['love', 'adore', 'affection', 'cherish', 'compassion', 'fond', 'caring', 'romantic', 'relationship', 'heart', 'passion', 'devotion', 'appreciate'],
  neutral: ['okay', 'fine', 'average', 'moderate', 'standard', 'normal', 'regular', 'common', 'typical', 'ordinary', 'balanced', 'plain', 'neither'],
  angry: ['angry', 'mad', 'furious', 'outraged', 'annoyed', 'frustrated', 'irritated', 'hostile', 'rage', 'hatred', 'resent', 'bitter', 'enraged'],
  stressed: ['stressed', 'anxious', 'worried', 'nervous', 'tense', 'pressure', 'overwhelmed', 'panic', 'fear', 'dread', 'concern', 'troubled', 'uneasy']
};

// Intensifiers to adjust values
const intensifiers = {
  positive: ['very', 'extremely', 'incredibly', 'really', 'so', 'absolutely', 'completely', 'totally', 'highly', 'deeply'],
  negative: ['not', "don't", 'never', 'barely', 'hardly', 'scarcely', 'rarely']
};

// Simple sentiment analysis function
function getSentimentScore(text: string): number {
  const positive = ['good', 'great', 'excellent', 'wonderful', 'happy', 'joy', 'love', 'like', 'amazing', 'fantastic'];
  const negative = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'angry', 'hate', 'dislike', 'disappointed', 'upset'];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  // Adjust score based on positive/negative adjustment
  words.forEach(word => {
    if (positive.includes(word)) score += 0.2;
    if (negative.includes(word)) score -= 0.2;
  });

  return Math.max(-1, Math.min(1, score));
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  // Validate input
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text parameter is required in request body' }, { status: 400 });
  }

  try {
    // Detect emotions
    const emotionResult = detectEmotions(text);
    return NextResponse.json(emotionResult);
  } catch (error) {
    console.error("Error in emotion detection:", error);
    return NextResponse.json({ error: 'Failed to analyze emotions' }, { status: 500 });
  }
}

function detectEmotions(text: string) {
  const lowercaseText = text.toLowerCase();
  const words = lowercaseText.split(/\s+/);

  const emotions = {
    happy: 0,
    sad: 0,
    motivated: 0,
    love: 0,
    neutral: 0,
    angry: 0,
    stressed: 0
  };

  // Process each word
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    const isNegated = i > 0 && intensifiers.negative.includes(words[i-1]);
    const isIntensified = i > 0 && intensifiers.positive.includes(words[i-1]);

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.includes(word)) {
        let score = 1;

        // Add scores to emotions based on keyword detection
        if (isNegated) {
          score = -0.5;
          if (emotion === 'happy') emotions.sad += 0.3;
          else if (emotion === 'sad') emotions.happy += 0.3;
          else if (emotion === 'motivated') emotions.stressed += 0.3;
          else if (emotion === 'love') emotions.angry += 0.3;
          else if (emotion === 'angry') emotions.neutral += 0.3;
          else if (emotion === 'stressed') emotions.motivated += 0.3;
        } else if (isIntensified) {
          score = 2;
        }

        emotions[emotion as keyof typeof emotions] += score;
      }
    }
  }

  const sentimentScore = getSentimentScore(text);

  if (sentimentScore > 0.3) {
    emotions.happy += sentimentScore * 1.5;
    emotions.motivated += sentimentScore;
  } else if (sentimentScore < -0.3) {
    emotions.sad += Math.abs(sentimentScore) * 1.5;
    emotions.angry += Math.abs(sentimentScore);
    emotions.stressed += Math.abs(sentimentScore) * 0.5;
  } else {
    emotions.neutral += 1;
  }

  const totalScore = Object.values(emotions).reduce((sum, score) => sum + score, 0);
  if (totalScore < 1) {
    emotions.neutral = 1;
  }

  const total = Object.values(emotions).reduce((sum, score) => sum + Math.max(0, score), 0) || 1;
  
  const percentages = {
    happy: Math.max(0, emotions.happy) / total * 100,
    sad: Math.max(0, emotions.sad) / total * 100,
    motivated: Math.max(0, emotions.motivated) / total * 100,
    love: Math.max(0, emotions.love) / total * 100,
    neutral: Math.max(0, emotions.neutral) / total * 100,
    angry: Math.max(0, emotions.angry) / total * 100,
    stressed: Math.max(0, emotions.stressed) / total * 100
  };

  for (const emotion in percentages) {
    percentages[emotion as keyof typeof percentages] = 
      Math.round(percentages[emotion as keyof typeof percentages] * 100) / 100;
  }

  let dominantEmotion = 'neutral';
  let highestScore = 0;

  for (const [emotion, score] of Object.entries(percentages)) {
    if (score > highestScore) {
      highestScore = score;
      dominantEmotion = emotion;
    }
  }

  return {
    ...percentages,
    dominantEmotion
  };
}
