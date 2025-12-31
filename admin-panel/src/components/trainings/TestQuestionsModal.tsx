import { X } from 'lucide-react';
import type { TestContent } from '@/types/training';

interface TestQuestionsModalProps {
  test: TestContent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TestQuestionsModal({ test, isOpen, onClose }: TestQuestionsModalProps) {
  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {test.title} - Sorular
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {test.description && (
              <p className="mb-4 text-sm text-gray-600">{test.description}</p>
            )}

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {test.questions && test.questions.length > 0 ? (
                test.questions.map((question, index) => (
                  <div key={question.id || index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <p className="font-medium text-gray-900 flex-1">{question.question}</p>
                    </div>

                    <div className="ml-8 space-y-2">
                      {question.options && question.options.map((option, optIndex) => (
                        <div
                          key={option.id || optIndex}
                          className={`p-2 rounded-lg border ${
                            option.isCorrect
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                              option.isCorrect
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className={`flex-1 ${option.isCorrect ? 'font-medium text-green-800' : 'text-gray-700'}`}>
                              {option.text}
                            </span>
                            {option.isCorrect && (
                              <span className="text-xs font-medium text-green-600">✓ Doğru Cevap</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {question.explanation && (
                      <div className="mt-3 ml-8 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 mb-1">Açıklama:</p>
                        <p className="text-sm text-blue-700">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Bu test için henüz soru eklenmemiş.
                </div>
              )}
            </div>

            {test.timeLimit && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Süre Limiti:</span> {test.timeLimit} dakika
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

