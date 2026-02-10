import { useState, useEffect } from 'react';
import { MessageSquare, Tag, Plus, Edit, Trash2, Search, Eye, EyeOff, Clock, CheckCircle, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ActionButton from '@/components/common/ActionButton';
import ContactMessageDetailModal from '@/components/contact-messages/ContactMessageDetailModal';
import TopicFormModal from '@/components/topics/TopicFormModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { contactService } from '@/services/api/contactService';
import { useAuth } from '@/context/AuthContext';
import type { ContactMessage, Topic } from '@/types/contact';

type TabType = 'messages' | 'topics';
type FilterType = 'all' | 'read' | 'unread';

export default function ContactMessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('messages');

  // Messages states
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('unread');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Topics states
  const [topicsList, setTopicsList] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [topicsSearchTerm, setTopicsSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isTopicFormModalOpen, setIsTopicFormModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchTopics();
      fetchMessages();
    } else if (activeTab === 'topics') {
      fetchTopicsList();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [page, filter, selectedTopicId]);

  const fetchTopics = async () => {
    try {
      const data = await contactService.getTopics();
      let fetched = data.topics || [];

      // Şube yöneticisi ise, sadece şubelere görünür olan konuları göster
      if (user?.role === 'branch_manager') {
        fetched = fetched.filter((t) => t.isVisibleToBranchManager);
      }

      setTopics(fetched);

      // Eğer seçilen konu artık listede yoksa, filtreyi varsayılan hale getir
      if (selectedTopicId !== 'all' && !fetched.some((t) => t.id === selectedTopicId)) {
        setSelectedTopicId('all');
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchTopicsList = async () => {
    try {
      setTopicsLoading(true);
      setTopicsError(null);
      const data = await contactService.getTopics();
      setTopicsList(data.topics || []);
    } catch (err: any) {
      console.error('Error fetching topics:', err);
      setTopicsError(err.message || 'Konular yüklenirken bir hata oluştu');
      setTopicsList([]);
    } finally {
      setTopicsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      setMessagesError(null);

      const params: {
        page: number;
        limit: number;
        topicId?: string;
        isRead?: boolean;
      } = {
        page,
        limit,
      };

      if (selectedTopicId !== 'all') {
        params.topicId = selectedTopicId;
      }

      if (filter === 'read') {
        params.isRead = true;
      } else if (filter === 'unread') {
        params.isRead = false;
      }

      const data = await contactService.getContactMessages(params);
      setMessages(data.messages || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setMessagesError(err.message || 'Mesajlar yüklenirken bir hata oluştu');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const filteredMessages = messages.filter((message) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return message.message.toLowerCase().includes(searchLower) ||
           getTopicName(message.topicId).toLowerCase().includes(searchLower);
  });

  const handleMessageClick = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
  };

  const handleCreateTopic = () => {
    setSelectedTopic(null);
    setIsTopicFormModalOpen(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsTopicFormModalOpen(true);
  };

  const handleDeleteTopic = (topic: Topic) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Konu Sil',
      message: `"${topic.name}" konusunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setProcessing(true);
          await contactService.deleteTopic(topic.id);
          await fetchTopicsList();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (err: any) {
          console.error('Error deleting topic:', err);
          setTopicsError(err.message || 'Konu silinirken bir hata oluştu');
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const filteredTopics = topicsList.filter((topic) => {
    const matchesSearch =
      topicsSearchTerm === '' ||
      topic.name.toLowerCase().includes(topicsSearchTerm.toLowerCase()) ||
      (topic.description || '').toLowerCase().includes(topicsSearchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatRelativeDate = (date: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined) => {
    if (!date) return '-';
    
    let d: Date;
    
    // Firestore Timestamp formatını kontrol et ({ seconds, nanoseconds } veya { _seconds, _nanoseconds })
    if (typeof date === 'object' && ('seconds' in date || '_seconds' in date)) {
      const seconds = (date as any).seconds || (date as any)._seconds || 0;
      d = new Date(seconds * 1000);
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      return '-';
    }
    
    // Geçerli bir tarih olup olmadığını kontrol et
    if (isNaN(d.getTime())) {
      return '-';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    return topic?.name || '-';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-end">
          {activeTab === 'topics' && (user?.role === 'admin' || user?.role === 'superadmin') && (
            <button
              onClick={handleCreateTopic}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Konu
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'messages'
                  ? 'border-slate-700 text-slate-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                İletişim Mesajları
              </div>
            </button>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button
                onClick={() => setActiveTab('topics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'topics'
                    ? 'border-slate-700 text-slate-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Konular
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Error Message */}
        {(activeTab === 'messages' ? messagesError : topicsError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{activeTab === 'messages' ? messagesError : topicsError}</p>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'messages' ? (
          <>
            {/* Filters */}
            <div className="flex items-center justify-between">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mesaj ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm w-64"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                {/* Topic Filter */}
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value);
                    setPage(1);
                  }}
                  className="pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                >
                  <option value="all">Tüm Konular</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>

                {/* Read/Unread Filter */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      setFilter('all');
                      setPage(1);
                    }}
                  >
                    Tümü
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      filter === 'unread'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      setFilter('unread');
                      setPage(1);
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    Okunmadı
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      filter === 'read'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      setFilter('read');
                      setPage(1);
                    }}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Okundu
                  </button>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {messagesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Yükleniyor...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Mesaj bulunamadı</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !message.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {message.isRead ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  <Tag className="w-3 h-3" />
                                  {getTopicName(message.topicId)}
                                </span>
                                {!message.isRead && (
                                  <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                    Yeni
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-900 mb-2 line-clamp-2">{message.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatRelativeDate(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && !searchTerm && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Toplam {total} mesajdan {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} arası gösteriliyor
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                        >
                          Önceki
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-700">
                          Sayfa {page} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                  {searchTerm && (
                    <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                      {filteredMessages.length} sonuç bulundu
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Search */}
            <div className="flex items-center justify-start">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Konu ara..."
                  value={topicsSearchTerm}
                  onChange={(e) => setTopicsSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm w-64"
                />
              </div>
            </div>

            {/* Topics Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {topicsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Yükleniyor...</p>
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="p-8 text-center">
                  <Tag className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {topicsSearchTerm ? 'Arama sonucu bulunamadı' : 'Henüz konu eklenmemiş'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Konu Adı
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Şube Yöneticilerine Görünür
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTopics.map((topic) => (
                        <tr key={topic.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{topic.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 max-w-md truncate">
                              {topic.description || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {topic.isVisibleToBranchManager ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                <Eye className="w-3 h-3" />
                                Görünür
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                <EyeOff className="w-3 h-3" />
                                Gizli
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {topic.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                Pasif
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <ActionButton
                                icon={Edit}
                                variant="edit"
                                onClick={() => handleEditTopic(topic)}
                                title="Düzenle"
                              />
                              <ActionButton
                                icon={Trash2}
                                variant="delete"
                                onClick={() => handleDeleteTopic(topic)}
                                title="Sil"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats */}
            {filteredTopics.length > 0 && (
              <div className="text-sm text-gray-500">
                Toplam {filteredTopics.length} konu {topicsSearchTerm && `(${topicsList.length} konu içinden)`}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedMessage && (
        <ContactMessageDetailModal
          message={selectedMessage}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedMessage(null);
          }}
          onUpdate={fetchMessages}
          topics={topics}
        />
      )}

      <TopicFormModal
        topic={selectedTopic}
        isOpen={isTopicFormModalOpen}
        onClose={() => setIsTopicFormModalOpen(false)}
        onSuccess={fetchTopicsList}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        processing={processing}
      />
    </AdminLayout>
  );
}
