import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import { logger } from '../utils/logger';
import type { TestContentDetail, TestQuestion, TestOption } from '../types';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = {
  params: { testId: string; contentId?: string; trainingId?: string; lessonId?: string };
};

interface QuestionResult {
  question: TestQuestion;
  selectedOptionId: string | null;
  isCorrect: boolean;
  correctOption: TestOption | undefined;
  selectedOption: TestOption | undefined;
}

export const TestScreen: React.FC = () => {
  const route = useRoute() as RouteParams;
  const navigation = useNavigation();
  const { testId, contentId, trainingId, lessonId } = route.params;

  const [test, setTest] = useState<TestContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);

  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (test?.questions?.length) {
      Animated.timing(progressAnim, {
        toValue: (currentIndex + 1) / test.questions.length,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, test]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getTest(testId);
      setTest(data);
    } catch (err) {
      logger.error('Error fetching test:', err);
      Alert.alert('Hata', 'Test yüklenemedi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const goToNext = () => {
    if (!test) return;
    const next = currentIndex + 1;
    if (next < test.questions.length) {
      setCurrentIndex(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      flatListRef.current?.scrollToIndex({ index: prev, animated: true });
    }
  };

  const submit = () => {
    if (!test) return;
    const questions = test.questions || [];
    const unanswered = questions.filter((q: TestQuestion) => !answers[q.id]).length;

    const doSubmit = () => {
      const questionResults: QuestionResult[] = questions.map((q: TestQuestion) => {
        const selectedId = answers[q.id] || null;
        const correctOption = q.options?.find((o: TestOption) => o.isCorrect);
        const selectedOption = selectedId ? q.options?.find((o: TestOption) => o.id === selectedId) : undefined;
        return {
          question: q,
          selectedOptionId: selectedId,
          isCorrect: !!(selectedOption?.isCorrect),
          correctOption,
          selectedOption,
        };
      });
      setResults(questionResults);
      setSubmitted(true);
      if (contentId && trainingId) {
        (navigation.navigate as (screen: string, params: object) => void)('CourseDetail', {
          trainingId,
          lessonId,
          completedContentId: contentId,
        });
      }
    };

    if (unanswered > 0) {
      Alert.alert(
        'Eksik Cevaplar',
        `${unanswered} soru cevaplanmadı. Yine de testi bitirmek istiyor musunuz?`,
        [
          { text: 'Geri Dön', style: 'cancel' },
          { text: 'Bitir', style: 'destructive', onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
      </SafeAreaView>
    );
  }

  if (!test) return null;

  const questions: TestQuestion[] = test.questions || [];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // ── Results Screen ───────────────────────────────────────────
  if (submitted) {
    const correctCount = results.filter(r => r.isCorrect).length;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Minimal top bar */}
        <View style={styles.reviewTopBar}>
          <Text style={styles.reviewTopBarTitle}>{test.title}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.reviewTopBarClose}>
            <Feather name="x" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Question Review */}
        <ScrollView contentContainerStyle={styles.reviewList}>
          {results.map((r, idx) => (
            <View key={r.question.id} style={styles.reviewCard}>
              {/* Question */}
              <View style={styles.reviewQuestionRow}>
                <View style={[styles.reviewBadge, { backgroundColor: r.isCorrect ? '#d1fae5' : '#fee2e2' }]}>
                  <Feather name={r.isCorrect ? 'check' : 'x'} size={14} color={r.isCorrect ? '#059669' : '#dc2626'} />
                </View>
                <Text style={styles.reviewQuestionText}>
                  <Text style={styles.reviewQuestionNum}>{idx + 1}. </Text>
                  {r.question.question}
                </Text>
              </View>

              {/* Options */}
              <View style={styles.reviewOptions}>
                {r.question.options.map((opt: TestOption) => {
                  const isSelected = opt.id === r.selectedOptionId;
                  const isCorrect = opt.isCorrect;
                  let optStyle = styles.reviewOpt;
                  let textStyle: any = styles.reviewOptText;
                  let iconName: keyof typeof Feather.glyphMap = 'circle';
                  let iconColor = '#94a3b8';

                  if (isCorrect) {
                    optStyle = { ...styles.reviewOpt, ...styles.reviewOptCorrect };
                    textStyle = { ...styles.reviewOptText, color: '#065f46' };
                    iconName = 'check-circle';
                    iconColor = '#059669';
                  } else if (isSelected && !isCorrect) {
                    optStyle = { ...styles.reviewOpt, ...styles.reviewOptWrong };
                    textStyle = { ...styles.reviewOptText, color: '#7f1d1d' };
                    iconName = 'x-circle';
                    iconColor = '#dc2626';
                  }

                  return (
                    <View key={opt.id} style={optStyle}>
                      <Feather name={iconName} size={16} color={iconColor} style={{ marginRight: 8, flexShrink: 0 }} />
                      <Text style={textStyle}>{opt.text}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Explanation */}
              {r.question.explanation ? (
                <View style={styles.explanationBox}>
                  <Feather name="info" size={14} color="#1d4ed8" style={{ marginRight: 6, marginTop: 2, flexShrink: 0 }} />
                  <Text style={styles.explanationText}>{r.question.explanation}</Text>
                </View>
              ) : null}
            </View>
          ))}

          {/* Score summary */}
          <View style={styles.scoreSummary}>
            <View style={styles.scoreSummaryLeft}>
              <Feather name="check-circle" size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.scoreSummaryText}>
                <Text style={styles.scoreSummaryBold}>{correctCount}</Text> doğru  ·  <Text style={styles.scoreSummaryBold}>{totalQuestions - correctCount}</Text> yanlış  ·  <Text style={styles.scoreSummaryBold}>{totalQuestions}</Text> soru
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Quiz Screen ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={() => {
          Alert.alert('Testi Bırak', 'Testi bırakmak istediğinize emin misiniz? İlerlemeniz kaydedilmeyecek.', [
            { text: 'Devam Et', style: 'cancel' },
            { text: 'Bırak', style: 'destructive', onPress: () => navigation.goBack() },
          ]);
        }}>
          <Feather name="x" size={22} color="#64748b" />
        </TouchableOpacity>

        <Text style={styles.quizHeaderTitle} numberOfLines={1}>{test.title}</Text>

        <Text style={styles.quizCounter}>
          {currentIndex + 1}<Text style={styles.quizCounterTotal}>/{totalQuestions}</Text>
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Answered indicator */}
      <Text style={styles.answeredHint}>{answeredCount}/{totalQuestions} cevaplandı</Text>

      {/* Questions Pager */}
      <FlatList
        ref={flatListRef}
        data={questions}
        keyExtractor={(q) => q.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item: q, index }) => {
          const selectedId = answers[q.id];
          return (
            <View style={[styles.questionPage, { width: SCREEN_WIDTH }]}>
              <ScrollView contentContainerStyle={styles.questionScroll} showsVerticalScrollIndicator={false}>
                {/* Question Text */}
                <View style={styles.questionCard}>
                  <Text style={styles.questionLabel}>Soru {index + 1}</Text>
                  <Text style={styles.questionText}>{q.question}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  {(q.options || []).map((opt: TestOption, optIdx: number) => {
                    const isSelected = selectedId === opt.id;
                    const optLetters = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => selectOption(q.id, opt.id)}
                        activeOpacity={0.75}
                        style={[styles.optionRow, isSelected ? styles.optionRowSelected : null]}
                      >
                        <View style={[styles.optionLetter, isSelected ? styles.optionLetterSelected : null]}>
                          <Text style={[styles.optionLetterText, isSelected ? styles.optionLetterTextSelected : null]}>
                            {optLetters[optIdx] || optIdx + 1}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]} numberOfLines={5}>
                          {opt.text}
                        </Text>
                        {isSelected && (
                          <Feather name="check-circle" size={18} color="#4338ca" style={{ marginLeft: 8 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          );
        }}
      />

      {/* Navigation Footer */}
      <View style={styles.navFooter}>
        <TouchableOpacity
          onPress={goToPrev}
          style={[styles.navButton, currentIndex === 0 ? styles.navButtonDisabled : null]}
          disabled={currentIndex === 0}
        >
          <Feather name="chevron-left" size={20} color={currentIndex === 0 ? '#cbd5e1' : '#4338ca'} />
          <Text style={[styles.navButtonText, currentIndex === 0 ? styles.navButtonTextDisabled : null]}>Önceki</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity style={styles.submitButton} onPress={submit}>
            <Feather name="flag" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.submitButtonText}>Testi Bitir</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={goToNext} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: '#4338ca' }]}>Sonraki</Text>
            <Feather name="chevron-right" size={20} color="#4338ca" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Quiz Header
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quizHeaderTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  quizCounter: { fontSize: 18, fontWeight: '700', color: '#4338ca' },
  quizCounterTotal: { fontSize: 14, fontWeight: '400', color: '#94a3b8' },

  // Progress
  progressBarBg: { height: 4, backgroundColor: '#e2e8f0' },
  progressBarFill: { height: 4, backgroundColor: '#4338ca', borderRadius: 2 },
  answeredHint: {
    textAlign: 'right',
    paddingRight: 16,
    paddingTop: 6,
    paddingBottom: 2,
    fontSize: 12,
    color: '#94a3b8',
  },

  // Question Page
  questionPage: { flex: 1 },
  questionScroll: { padding: 16, paddingBottom: 8 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  questionText: { fontSize: 16, fontWeight: '600', color: '#0f172a', lineHeight: 24 },

  // Options
  optionsContainer: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  optionRowSelected: { borderColor: '#4338ca', backgroundColor: '#eef2ff' },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  optionLetterSelected: { backgroundColor: '#4338ca' },
  optionLetterText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  optionLetterTextSelected: { color: '#fff' },
  optionText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 20 },
  optionTextSelected: { color: '#3730a3', fontWeight: '600' },

  // Nav Footer
  navFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
  },
  navButtonDisabled: { backgroundColor: '#f8fafc' },
  navButtonText: { fontSize: 14, fontWeight: '600', color: '#4338ca', marginHorizontal: 2 },
  navButtonTextDisabled: { color: '#cbd5e1' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338ca',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Results ──────────────────────────────────────────────────
  reviewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reviewTopBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  reviewTopBarClose: { padding: 4 },
  scoreSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  scoreSummaryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  scoreSummaryText: { fontSize: 13, color: '#374151', flexShrink: 1 },
  scoreSummaryBold: { fontWeight: '700', color: '#0f172a' },

  // Review List
  reviewList: { padding: 16, paddingBottom: 40, gap: 12 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  reviewBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  reviewQuestionText: { flex: 1, fontSize: 14, color: '#0f172a', lineHeight: 21 },
  reviewQuestionNum: { fontWeight: '700', color: '#4338ca' },
  reviewOptions: { gap: 6 },
  reviewOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  reviewOptCorrect: { backgroundColor: '#d1fae5' },
  reviewOptWrong: { backgroundColor: '#fee2e2' },
  reviewOptText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },

  // Explanation
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  explanationText: { flex: 1, fontSize: 13, color: '#1e3a5f', lineHeight: 19 },

  // Close Button
  closeButton: {
    backgroundColor: '#4338ca',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  closeButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});