import { useEffect, useState, useRef } from 'react';
import { X, Plus, Trash2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { contentService } from '@/services/api/contentService';
import type { TestContent, CreateTestContentRequest, UpdateTestContentRequest, TestQuestion, TestOption } from '@/types/training';
import { generateUniqueId } from '@/utils/idGenerator';
import { logger } from '@/utils/logger';

interface TestFormModalProps {
  test: TestContent | null;
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TestFormModal({ test, lessonId, isOpen, onClose, onSuccess }: TestFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: '',
    order: '' as string | number,
    isActive: true,
  });
  const [questions, setQuestions] = useState<Omit<TestQuestion, 'id'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!test;

  useEffect(() => {
    if (isOpen) {
      if (test) {
        setFormData({
          title: test.title || '',
          description: test.description || '',
          timeLimit: test.timeLimit?.toString() || '',
          order: test.order || '',
          isActive: test.isActive ?? true,
        });
        setQuestions(test.questions.map(q => ({
          question: q.question,
          options: q.options || Array(5).fill(null).map((_, i) => ({
            id: `opt_${generateUniqueId("opt")}_${i}`,
            text: '',
            isCorrect: false,
          })),
          explanation: q.explanation,
        })));
      } else {
        setFormData({
          title: '',
          description: '',
          timeLimit: '',
          order: '',
          isActive: true,
        });
        setQuestions([]);
      }
      setError(null);
    }
  }, [isOpen, test]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: Array(5).fill(null).map((_, i) => ({
        id: `opt_${generateUniqueId("opt")}_${i}`,
        text: '',
        isCorrect: false,
      })),
      explanation: '',
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setError('Excel dosyası en az bir soru içermelidir (başlık satırı hariç)');
          return;
        }

        // İlk satır başlık olabilir, kontrol et
        let startRow = 0;
        const firstRow = jsonData[0];
        if (
          firstRow[0]?.toString().toLowerCase().includes('soru') ||
          firstRow[0]?.toString().toLowerCase().includes('question')
        ) {
          startRow = 1; // Başlık satırını atla
        }

        const importedQuestions: Omit<TestQuestion, 'id'>[] = [];

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          // Excel formatı: Soru | Seçenek 1 | Seçenek 2 | Seçenek 3 | Seçenek 4 | Seçenek 5 | Doğru Cevap (1-5) | Açıklama
          const questionText = row[0]?.toString().trim();
          if (!questionText) continue;

          const options: TestOption[] = [];
          for (let j = 1; j <= 5; j++) {
            const optionText = row[j]?.toString().trim() || '';
            options.push({
              id: `opt_${generateUniqueId("opt")}_${i}_${j}`,
              text: optionText,
              isCorrect: false,
            });
          }

          // Doğru cevap (6. sütun, 1-5 arası sayı)
          const correctAnswer = row[6];
          let correctIndex = -1;
          if (correctAnswer !== undefined && correctAnswer !== null) {
            const correctNum = parseInt(correctAnswer.toString());
            if (correctNum >= 1 && correctNum <= 5) {
              correctIndex = correctNum - 1; // 0-based index
            }
          }

          if (correctIndex === -1) {
            setError(`Satır ${i + 1}: Doğru cevap 1-5 arasında bir sayı olmalıdır`);
            return;
          }

          // Doğru cevabı işaretle
          options[correctIndex].isCorrect = true;

          // Açıklama (7. sütun, opsiyonel)
          const explanation = row[7]?.toString().trim() || '';

          importedQuestions.push({
            question: questionText,
            options: options,
            explanation: explanation || undefined,
          });
        }

        if (importedQuestions.length === 0) {
          setError('Excel dosyasından hiç soru okunamadı');
          return;
        }

        // Mevcut sorulara ekle veya değiştir
        setQuestions([...questions, ...importedQuestions]);
        setError(null);
        
        // File input'u temizle
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        logger.error('Excel import error:', err);
        setError('Excel dosyası okunurken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    // Template data
    const templateData = [
      ['Soru', 'Seçenek 1', 'Seçenek 2', 'Seçenek 3', 'Seçenek 4', 'Seçenek 5', 'Doğru Cevap', 'Açıklama'],
      ['Örnek soru metni?', 'A şıkkı', 'B şıkkı', 'C şıkkı (Doğru)', 'D şıkkı', 'E şıkkı', '3', 'Bu bir örnek sorudur'],
      ['İkinci örnek soru?', 'Yanlış seçenek', 'Doğru seçenek', 'Yanlış seçenek', 'Yanlış seçenek', 'Yanlış seçenek', '2', ''],
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Soru
      { wch: 20 }, // Seçenek 1
      { wch: 20 }, // Seçenek 2
      { wch: 20 }, // Seçenek 3
      { wch: 20 }, // Seçenek 4
      { wch: 20 }, // Seçenek 5
      { wch: 15 }, // Doğru Cevap
      { wch: 25 }, // Açıklama
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Sorular');
    XLSX.writeFile(wb, 'test_sorulari_template.xlsx');
  };

  const updateQuestion = (index: number, field: keyof Omit<TestQuestion, 'id'>, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof TestOption, value: any) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = updated[questionIndex].options!.map((opt, i) =>
        i === optionIndex ? { ...opt, [field]: value } : opt
      );
      
      // Eğer bir seçenek doğru olarak işaretleniyorsa, diğerlerini false yap
      if (field === 'isCorrect' && value === true) {
        updated[questionIndex].options = updated[questionIndex].options!.map((opt, i) =>
          i === optionIndex ? opt : { ...opt, isCorrect: false }
        );
      }
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Başlık zorunludur');
      return;
    }

    if (questions.length === 0) {
      setError('En az bir soru eklenmelidir');
      return;
    }

    try {
      setLoading(true);
      
      const questionsData = questions.map(q => ({
        question: q.question,
        options: q.options || [],
        explanation: q.explanation,
      }));

      if (isEditMode && test) {
        const updateData: UpdateTestContentRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          questions: questionsData,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
          isActive: formData.isActive,
        };
        await contentService.updateTest(test.id, updateData);
      } else {
        const createData: CreateTestContentRequest = {
          lessonId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          questions: questionsData,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
          isActive: formData.isActive,
        };
        await contentService.createTest(lessonId, createData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Save test error:', err);
      setError(err.message || 'Test kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h3 className="text-sm font-medium text-white">
              {isEditMode ? 'Testi Düzenle' : 'Yeni Test Ekle'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Süre (dakika)
                    </label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        placeholder="Otomatik"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıra
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        placeholder="Otomatik"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                    Aktif
                  </label>
                </div>

                {/* Questions */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Sorular ({questions.length})</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={downloadTemplate}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Excel Template İndir"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelImport}
                        className="hidden"
                        id="excel-import"
                      />
                      <label
                        htmlFor="excel-import"
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                        title="Excel'den soru içe aktar"
                      >
                        <Upload className="w-5 h-5" />
                      </label>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Yeni Soru Ekle"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {questions.map((question, qIndex) => (
                      <div key={qIndex} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Soru {qIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Soru Metni <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={question.question}
                              onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Seçenekler (5 seçenek, 1 doğru cevap)
                            </label>
                            {question.options && question.options.map((option, oIndex) => (
                              <div key={option.id} className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-gray-500 w-8">{oIndex + 1}.</span>
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder={`Seçenek ${oIndex + 1}`}
                                  required
                                />
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`question-${qIndex}-correct`}
                                    checked={option.isCorrect}
                                    onChange={(e) => updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Doğru</span>
                                </label>
                              </div>
                            ))}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Açıklama
                            </label>
                            <input
                              type="text"
                              value={question.explanation || ''}
                              onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Opsiyonel"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

