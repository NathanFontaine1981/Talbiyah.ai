import { supabase } from '@/lib/supabase';

export interface QuranProgress {
  surah_number: number;
  surah_name: string;
  start_ayah: number;
  end_ayah: number;
  stage: 'understanding' | 'fluency' | 'memorization';
  completion_level: 'basic' | 'intermediate' | 'advanced' | 'mastered';
  last_practiced: string;
  confidence_score: number;
  notes?: string;
}

export interface LessonCoverage {
  surah_number: number;
  surah_name: string;
  ayat_covered: number[];
  stages_completed: {
    understanding: boolean;
    fluency: boolean;
    memorization: boolean;
  };
  lesson_date: string;
}

/**
 * Extracts Quran coverage information from a lesson transcript
 * This analyzes the transcript to determine:
 * - Which surah and ayat were covered
 * - Which stage(s) were practiced
 * - Completion/confidence level
 */
export async function extractLessonCoverage(
  transcript: string,
  detectedStage: 'understanding' | 'fluency' | 'memorization',
  lessonMetadata?: {
    surah_number?: number;
    surah_name?: string;
    start_ayah?: number;
    end_ayah?: number;
  }
): Promise<LessonCoverage | null> {
  try {
    // If metadata is provided, use it directly
    if (
      lessonMetadata?.surah_number &&
      lessonMetadata?.start_ayah &&
      lessonMetadata?.end_ayah
    ) {
      // Generate array of ayat covered
      const ayatCovered = [];
      for (let i = lessonMetadata.start_ayah; i <= lessonMetadata.end_ayah; i++) {
        ayatCovered.push(i);
      }

      return {
        surah_number: lessonMetadata.surah_number,
        surah_name: lessonMetadata.surah_name || '',
        ayat_covered: ayatCovered,
        stages_completed: {
          understanding: detectedStage === 'understanding',
          fluency: detectedStage === 'fluency',
          memorization: detectedStage === 'memorization'
        },
        lesson_date: new Date().toISOString()
      };
    }

    // Otherwise, try to extract from transcript using AI
    const { data, error } = await supabase.functions.invoke('extract-lesson-coverage', {
      body: { transcript }
    });

    if (error || !data) {
      console.warn('Could not extract coverage from transcript:', error);
      return null;
    }

    return {
      ...data,
      stages_completed: {
        understanding: detectedStage === 'understanding',
        fluency: detectedStage === 'fluency',
        memorization: detectedStage === 'memorization'
      },
      lesson_date: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting lesson coverage:', error);
    return null;
  }
}

/**
 * Updates a student's Quran progress based on a completed lesson
 */
export async function updateQuranProgress(
  studentId: string,
  coverage: LessonCoverage,
  stage: 'understanding' | 'fluency' | 'memorization',
  confidenceScore: number = 0.8
): Promise<boolean> {
  try {
    // Get or create progress record for each ayah
    for (const ayahNumber of coverage.ayat_covered) {
      const { data: existing, error: fetchError } = await supabase
        .from('quran_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('surah_number', coverage.surah_number)
        .eq('ayah_number', ayahNumber)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is okay
        console.error('Error fetching progress:', fetchError);
        continue;
      }

      const progressData = {
        student_id: studentId,
        surah_number: coverage.surah_number,
        surah_name: coverage.surah_name,
        ayah_number: ayahNumber,
        [`${stage}_completed`]: true,
        [`${stage}_level`]: determineCompletionLevel(confidenceScore),
        [`${stage}_last_practiced`]: coverage.lesson_date,
        [`${stage}_confidence`]: confidenceScore,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('quran_progress')
          .update(progressData)
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating progress:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('quran_progress')
          .insert({
            ...progressData,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting progress:', insertError);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating Quran progress:', error);
    return false;
  }
}

/**
 * Determines completion level based on confidence score and stage
 */
function determineCompletionLevel(
  confidenceScore: number
): 'basic' | 'intermediate' | 'advanced' | 'mastered' {
  if (confidenceScore >= 0.95) return 'mastered';
  if (confidenceScore >= 0.85) return 'advanced';
  if (confidenceScore >= 0.70) return 'intermediate';
  return 'basic';
}

/**
 * Gets a student's overall Quran progress
 */
export async function getStudentQuranProgress(
  studentId: string
): Promise<QuranProgress[]> {
  try {
    const { data, error } = await supabase
      .from('quran_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('surah_number', { ascending: true })
      .order('ayah_number', { ascending: true });

    if (error) {
      console.error('Error fetching Quran progress:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting student Quran progress:', error);
    return [];
  }
}

/**
 * Gets progress for a specific surah
 */
export async function getSurahProgress(
  studentId: string,
  surahNumber: number
): Promise<{
  total_ayat: number;
  understanding_completed: number;
  fluency_completed: number;
  memorization_completed: number;
  completion_percentage: {
    understanding: number;
    fluency: number;
    memorization: number;
  };
}> {
  try {
    // Get total ayat count for the surah
    const surahInfo = getSurahInfo(surahNumber);

    // Get all progress records for this surah
    const { data, error } = await supabase
      .from('quran_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('surah_number', surahNumber);

    if (error) {
      console.error('Error fetching surah progress:', error);
      return {
        total_ayat: surahInfo.total_ayat,
        understanding_completed: 0,
        fluency_completed: 0,
        memorization_completed: 0,
        completion_percentage: {
          understanding: 0,
          fluency: 0,
          memorization: 0
        }
      };
    }

    const progress = data || [];

    const understandingCount = progress.filter((p) => p.understanding_completed).length;
    const fluencyCount = progress.filter((p) => p.fluency_completed).length;
    const memorizationCount = progress.filter((p) => p.memorization_completed).length;

    return {
      total_ayat: surahInfo.total_ayat,
      understanding_completed: understandingCount,
      fluency_completed: fluencyCount,
      memorization_completed: memorizationCount,
      completion_percentage: {
        understanding: (understandingCount / surahInfo.total_ayat) * 100,
        fluency: (fluencyCount / surahInfo.total_ayat) * 100,
        memorization: (memorizationCount / surahInfo.total_ayat) * 100
      }
    };
  } catch (error) {
    console.error('Error calculating surah progress:', error);
    return {
      total_ayat: 0,
      understanding_completed: 0,
      fluency_completed: 0,
      memorization_completed: 0,
      completion_percentage: {
        understanding: 0,
        fluency: 0,
        memorization: 0
      }
    };
  }
}

/**
 * Gets basic info about a surah (number of ayat, name, etc.)
 */
export function getSurahInfo(surahNumber: number): {
  number: number;
  name: string;
  english_name: string;
  total_ayat: number;
  revelation_type: 'Meccan' | 'Medinan';
} {
  const surahData: Record<number, any> = {
    1: { name: 'Al-Fatihah', english_name: 'The Opening', total_ayat: 7, revelation_type: 'Meccan' },
    2: { name: 'Al-Baqarah', english_name: 'The Cow', total_ayat: 286, revelation_type: 'Medinan' },
    3: { name: 'Aal-E-Imran', english_name: 'Family of Imran', total_ayat: 200, revelation_type: 'Medinan' },
    79: { name: 'An-Nazi\'at', english_name: 'Those Who Drag Forth', total_ayat: 46, revelation_type: 'Meccan' },
    67: { name: 'Al-Mulk', english_name: 'The Sovereignty', total_ayat: 30, revelation_type: 'Meccan' },
    // Add more as needed
  };

  return surahData[surahNumber] || {
    number: surahNumber,
    name: `Surah ${surahNumber}`,
    english_name: '',
    total_ayat: 0,
    revelation_type: 'Meccan'
  };
}

/**
 * Calculates overall Quran completion percentage for a student
 */
export async function getOverallQuranProgress(
  studentId: string
): Promise<{
  total_ayat_in_quran: number;
  understanding_completed: number;
  fluency_completed: number;
  memorization_completed: number;
  completion_percentage: {
    understanding: number;
    fluency: number;
    memorization: number;
  };
  surahs_started: number;
  surahs_fully_memorized: number;
}> {
  try {
    const TOTAL_AYAT_IN_QURAN = 6236;

    // Get all progress records
    const { data, error } = await supabase
      .from('quran_progress')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching overall progress:', error);
      return {
        total_ayat_in_quran: TOTAL_AYAT_IN_QURAN,
        understanding_completed: 0,
        fluency_completed: 0,
        memorization_completed: 0,
        completion_percentage: {
          understanding: 0,
          fluency: 0,
          memorization: 0
        },
        surahs_started: 0,
        surahs_fully_memorized: 0
      };
    }

    const progress = data || [];

    const understandingCount = progress.filter((p) => p.understanding_completed).length;
    const fluencyCount = progress.filter((p) => p.fluency_completed).length;
    const memorizationCount = progress.filter((p) => p.memorization_completed).length;

    // Count unique surahs started
    const uniqueSurahs = new Set(progress.map((p) => p.surah_number));

    return {
      total_ayat_in_quran: TOTAL_AYAT_IN_QURAN,
      understanding_completed: understandingCount,
      fluency_completed: fluencyCount,
      memorization_completed: memorizationCount,
      completion_percentage: {
        understanding: (understandingCount / TOTAL_AYAT_IN_QURAN) * 100,
        fluency: (fluencyCount / TOTAL_AYAT_IN_QURAN) * 100,
        memorization: (memorizationCount / TOTAL_AYAT_IN_QURAN) * 100
      },
      surahs_started: uniqueSurahs.size,
      surahs_fully_memorized: 0 // Calculate by checking if all ayat of a surah are memorized
    };
  } catch (error) {
    console.error('Error calculating overall progress:', error);
    return {
      total_ayat_in_quran: 6236,
      understanding_completed: 0,
      fluency_completed: 0,
      memorization_completed: 0,
      completion_percentage: {
        understanding: 0,
        fluency: 0,
        memorization: 0
      },
      surahs_started: 0,
      surahs_fully_memorized: 0
    };
  }
}

/**
 * Auto-updates Quran progress after a lesson with insights generation
 */
export async function autoTrackLessonProgress(
  lessonId: string,
  studentId: string,
  transcript: string,
  detectedStage: 'understanding' | 'fluency' | 'memorization',
  confidenceScore: number,
  lessonMetadata?: {
    surah_number?: number;
    surah_name?: string;
    start_ayah?: number;
    end_ayah?: number;
  }
): Promise<boolean> {
  try {
    // Extract what was covered in the lesson
    const coverage = await extractLessonCoverage(
      transcript,
      detectedStage,
      lessonMetadata
    );

    if (!coverage) {
      console.warn('Could not extract lesson coverage');
      return false;
    }

    // Update progress for each ayah
    const success = await updateQuranProgress(
      studentId,
      coverage,
      detectedStage,
      confidenceScore
    );

    if (success) {
      console.log('✅ Quran progress auto-updated:', {
        surah: coverage.surah_name,
        ayat: coverage.ayat_covered,
        stage: detectedStage
      });
    }

    return success;
  } catch (error) {
    console.error('Error in auto-tracking lesson progress:', error);
    return false;
  }
}
