import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ApiService from '../services/api';
import { logger } from '../utils/logger';
import type { TestContentDetail, TestQuestion } from '../types';
import { useRoute, useNavigation } from '@react-navigation/native';

type RouteParams = {
  params: { testId: string; contentId?: string; onComplete?: () => void };
};

export const TestScreen: React.FC = () => {
  const route = useRoute() as RouteParams;
  const navigation = useNavigation();
  const { testId, contentId, onComplete } = route.params;

  const [test, setTest] = useState<TestContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

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
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const submit = () => {
    if (!test) return;
    setSubmitting(true);
    try {
      const questions = test.questions || [];
      let correct = 0;
      questions.forEach((q: TestQuestion) => {
        const selected = answers[q.id];
        if (!selected) return;
        const opt = q.options?.find(o => o.id === selected);
        if (opt && opt.isCorrect) correct += 1;
      });
      setResult({ correct, total: questions.length });
      
      // Mark test as completed when submitted
      if (onComplete) {
        onComplete();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}><ActivityIndicator size="large" color="#4338ca" /></View>
      </SafeAreaView>
    );
  }

  if (!test) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>{test.title}</Text>
        {test.description ? <Text style={styles.description}>{test.description}</Text> : null}

        <View style={{ marginTop: 12 }}>
          {test.questions.map((q) => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionText}>{q.question}</Text>
              <View style={{ marginTop: 8 }}>
                {(q.options || []).map((opt) => (
                  <TouchableOpacity key={opt.id} onPress={() => selectOption(q.id, opt.id)} style={[styles.option, answers[q.id] === opt.id ? styles.optionSelected : null]}>
                    <Text style={answers[q.id] === opt.id ? styles.optionTextSelected : styles.optionText}>{opt.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Sonuç: {result.correct} / {result.total}</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
              <Text style={styles.doneButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={submitting}>
            <Text style={styles.submitButtonText}>{submitting ? 'Gönderiliyor...' : 'Testi Bitir'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  description: { color: '#64748b', marginTop: 8 },
  questionCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12 },
  questionText: { fontWeight: '600', color: '#0f172a' },
  option: { padding: 10, borderRadius: 10, backgroundColor: '#f8fafc', marginBottom: 8 },
  optionSelected: { backgroundColor: '#4338ca' },
  optionText: { color: '#0f172a' },
  optionTextSelected: { color: '#ffffff' },
  submitButton: { marginTop: 8, backgroundColor: '#4338ca', padding: 14, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  resultBox: { marginTop: 12, padding: 12, backgroundColor: '#ffffff', borderRadius: 12, alignItems: 'center' },
  resultText: { fontWeight: '700' },
  doneButton: { marginTop: 8, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  doneButtonText: { color: '#4338ca', fontWeight: '700' },
});