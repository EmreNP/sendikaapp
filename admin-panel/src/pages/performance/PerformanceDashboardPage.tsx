import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  BarChart3,
  Building2,
  Users,
  Activity,
  UserCheck,
  ChevronRight,
  RefreshCw,
  Calendar,
  Download,
  Loader2,
  Clock,
  Zap,
  CalendarDays,
  CalendarRange,
  X,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { performanceService } from '@/services/api/performanceService';
import type {
  PerformanceDashboardSummary,
  BranchPerformanceReport,
  ManagerPerformanceReport,
  BranchPerformanceResponse,
  ManagerPerformanceResponse,
  ReportGenerateResponse,
  BranchReportData,
  ManagerReportData,
} from '@/types/performance';
import { StatCard, Card, Badge, SkeletonCard, EmptyState } from '@/components/performance/UIComponents';
import SimpleBarChart, { ProgressBar } from '@/components/performance/Charts';
import { logger } from '@/utils/logger';

// ==================== Tab türleri ====================
type TabType = 'overview' | 'branches' | 'managers';

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
  { id: 'branches', label: 'Şube Raporu', icon: Building2 },
  { id: 'managers', label: 'Yönetici Raporu', icon: Users },
];

// ==================== Tarih Presetleri ====================
type PeriodPreset = 'this-week' | 'this-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'custom';

interface PresetOption {
  id: PeriodPreset;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  getDates: () => { startDate: string; endDate: string };
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

const PERIOD_PRESETS: PresetOption[] = [
  {
    id: 'this-week',
    label: 'Bu Hafta',
    shortLabel: '1H',
    icon: Zap,
    getDates: () => {
      const now = new Date();
      const dayOfWeek = now.getDay() || 7;
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek + 1);
      return { startDate: toDateStr(start), endDate: toDateStr(now) };
    },
  },
  {
    id: 'this-month',
    label: 'Bu Ay',
    shortLabel: '1A',
    icon: Calendar,
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toDateStr(start), endDate: toDateStr(now) };
    },
  },
  {
    id: 'last-3-months',
    label: 'Son 3 Ay',
    shortLabel: '3A',
    icon: CalendarDays,
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return { startDate: toDateStr(start), endDate: toDateStr(now) };
    },
  },
  {
    id: 'last-6-months',
    label: 'Son 6 Ay',
    shortLabel: '6A',
    icon: CalendarRange,
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { startDate: toDateStr(start), endDate: toDateStr(now) };
    },
  },
  {
    id: 'this-year',
    label: 'Bu Yıl',
    shortLabel: '1Y',
    icon: Clock,
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: toDateStr(start), endDate: toDateStr(now) };
    },
  },
];

// Ay ismini Türkçe göster
function monthLabel(monthKey: string): string {
  const months: Record<string, string> = {
    '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis',
    '05': 'May', '06': 'Haz', '07': 'Tem', '08': 'Ağu',
    '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara',
  };
  const [, m] = monthKey.split('-');
  return months[m] || m;
}

// Dinamik period etiketleme (günlük, haftalık, aylık)
function formatPeriodLabel(period: string, granularity: 'daily' | 'weekly' | 'monthly'): string {
  if (granularity === 'daily') {
    // "2026-02-12" -> "12 Şub"
    const date = new Date(period);
    const day = date.getDate();
    const month = monthLabel(period.substring(0, 7));
    return `${day} ${month}`;
  } else if (granularity === 'weekly') {
    // "2026-W06" -> "H6"
    const weekNum = period.split('-W')[1];
    return `H${weekNum}`;
  } else {
    // "2026-02" -> "Şub"
    return monthLabel(period);
  }
}

// Tarih formatlama
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}

// Varsayılan tarihler (son 3 ay)
function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  return {
    startDate: toDateStr(start),
    endDate: toDateStr(now),
  };
}

// ==================== Debounce Hook ====================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function PerformanceDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false); // Light filtering state
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  // Date range & preset
  const defaults = getDefaultDates();
  const [activePeriod, setActivePeriod] = useState<PeriodPreset>('last-3-months');
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Debounce custom date inputs (400ms)
  const debouncedStartDate = useDebounce(startDate, 400);
  const debouncedEndDate = useDebounce(endDate, 400);

  // Data states
  const [summary, setSummary] = useState<PerformanceDashboardSummary | null>(null);
  const [branchReport, setBranchReport] = useState<BranchPerformanceResponse | null>(null);
  const [managerReport, setManagerReport] = useState<ManagerPerformanceResponse | null>(null);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [expandedManager, setExpandedManager] = useState<string | null>(null);

  // PDF
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  // Last fetch timestamp for "updated at" indicator
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Human-readable date range label
  const dateRangeLabel = useMemo(() => {
    const preset = PERIOD_PRESETS.find(p => p.id === activePeriod);
    if (preset && activePeriod !== 'custom') return preset.label;
    return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
  }, [activePeriod, startDate, endDate]);

  // Apply preset
  const applyPreset = useCallback((preset: PeriodPreset) => {
    if (preset === 'custom') {
      setActivePeriod('custom');
      setShowCustomRange(true);
      return;
    }
    const presetConfig = PERIOD_PRESETS.find(p => p.id === preset);
    if (!presetConfig) return;
    const dates = presetConfig.getDates();
    setActivePeriod(preset);
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
    setShowCustomRange(false);
  }, []);

  // Veri yükleme
  const fetchData = useCallback(async () => {
    if (isInitialLoad.current) {
      setLoading(true);
    } else {
      setIsFiltering(true);
    }
    setError(null);
    try {
      const [summaryData, branchData, managerData] = await Promise.all([
        performanceService.getDashboardSummary({
          startDate: debouncedStartDate,
          endDate: debouncedEndDate,
          branchId: selectedBranchId || undefined,
        }),
        performanceService.getBranchPerformance({
          branchId: selectedBranchId || undefined,
          startDate: debouncedStartDate,
          endDate: debouncedEndDate,
        }),
        performanceService.getManagerPerformance({
          branchId: selectedBranchId || undefined,
          startDate: debouncedStartDate,
          endDate: debouncedEndDate,
        }),
      ]);
      setSummary(summaryData);
      setBranchReport(branchData);
      setManagerReport(managerData);
      setLastFetchTime(new Date());
    } catch (err: any) {
      logger.error('Performans verisi yüklenirken hata:', err);
      setError(err?.message || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setIsFiltering(false);
      isInitialLoad.current = false;
    }
  }, [selectedBranchId, debouncedStartDate, debouncedEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // PDF rapor oluşturma
  const generatePdfReport = useCallback(async (
    type: 'branch' | 'manager',
    options?: { branchId?: string; managerId?: string }
  ) => {
    const loadingKey = options?.branchId
      ? `branch-${options.branchId}`
      : options?.managerId
      ? `manager-${options.managerId}`
      : `all-${type === 'branch' ? 'branches' : 'managers'}`;

    setPdfLoading(loadingKey);
    try {
      logger.info('Generating PDF report', { type, startDate, endDate, options });
      const reportData = await performanceService.generateReport({
        type,
        startDate,
        endDate,
        branchId: options?.branchId,
        managerId: options?.managerId,
      });
      logger.info('Report data received', {
        reportType: reportData.reportType,
        reportsCount: reportData.reports.length,
        period: reportData.period,
      });
      await createPdf(reportData, type);
    } catch (err: any) {
      logger.error('PDF rapor oluşturulurken hata:', err);
      alert('PDF rapor oluşturulurken bir hata oluştu: ' + (err?.message || ''));
    } finally {
      setPdfLoading(null);
    }
  }, [startDate, endDate]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50/50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Performans Raporları
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Şube ve ilçe yöneticisi performans analizi
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* ====== PERIOD PRESET BUTTONS ====== */}
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 gap-0.5">
                  {PERIOD_PRESETS.map((preset) => {
                    const isActive = activePeriod === preset.id;
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id)}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/80'
                        }`}
                        title={preset.label}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{preset.label}</span>
                        <span className="sm:hidden">{preset.shortLabel}</span>
                        {isActive && isFiltering && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {/* Custom / Özel buton */}
                  <button
                    onClick={() => applyPreset('custom')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      activePeriod === 'custom'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Özel</span>
                  </button>
                </div>

                {/* ====== CUSTOM DATE RANGE (expandable) ====== */}
                <div
                  className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
                    showCustomRange || activePeriod === 'custom'
                      ? 'max-w-[360px] opacity-100'
                      : 'max-w-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-3 py-1.5 shadow-sm ring-1 ring-blue-50">
                    <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setActivePeriod('custom');
                      }}
                      className="text-sm bg-transparent border-none outline-none text-gray-700 w-[120px] focus:text-blue-700"
                    />
                    <div className="w-4 h-px bg-gray-300" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setActivePeriod('custom');
                      }}
                      className="text-sm bg-transparent border-none outline-none text-gray-700 w-[120px] focus:text-blue-700"
                    />
                    <button
                      onClick={() => {
                        applyPreset('last-3-months');
                        setShowCustomRange(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Şube filtresi */}
                {summary && summary.branchComparison.length > 0 && (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Tüm Şubeler</option>
                    {summary.branchComparison.map((b: { branchId: string; branchName: string }) => (
                      <option key={b.branchId} value={b.branchId}>
                        {b.branchName}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => fetchData()}
                  disabled={loading || isFiltering}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading || isFiltering ? 'animate-spin' : ''}`} />
                  Yenile
                </button>
              </div>
            </div>

            {/* ====== ACTIVE FILTER BANNER ====== */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-blue-50/80 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100">
                <Calendar className="w-3.5 h-3.5" />
                <span>{dateRangeLabel}</span>
                <span className="text-blue-400">·</span>
                <span className="text-blue-500">
                  {formatDateShort(startDate)} – {formatDateShort(endDate)}
                </span>
              </div>
              {selectedBranchId && summary && (
                <div className="inline-flex items-center gap-1.5 bg-violet-50/80 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full border border-violet-100">
                  <Building2 className="w-3.5 h-3.5" />
                  {summary.branchComparison.find((b: any) => b.branchId === selectedBranchId)?.branchName || 'Şube'}
                  <button onClick={() => setSelectedBranchId('')} className="ml-0.5 text-violet-400 hover:text-violet-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {isFiltering && (
                <div className="inline-flex items-center gap-1.5 text-blue-500 text-xs animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Güncelleniyor…
                </div>
              )}
              {lastFetchTime && !isFiltering && (
                <span className="text-[10px] text-gray-400">
                  Son güncelleme: {lastFetchTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Header PDF (tab'a göre) */}
              {(activeTab === 'branches' || activeTab === 'managers') && (
                <button
                  onClick={() =>
                    activeTab === 'branches'
                      ? generatePdfReport('branch')
                      : generatePdfReport('manager')
                  }
                  disabled={
                    pdfLoading === (activeTab === 'branches' ? 'all-branches' : 'all-managers')
                  }
                  className="mr-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  title="Seçili tarih aralığına göre PDF oluştur"
                >
                  {pdfLoading === (activeTab === 'branches' ? 'all-branches' : 'all-managers') ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-4 h-4 text-blue-600" />
                  )}
                  PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content — tam genişlik */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 relative">
          {/* Filtering overlay — subtle, doesn't block content */}
          {isFiltering && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 pointer-events-none transition-opacity duration-300" />
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className={`transition-opacity duration-300 ${isFiltering ? 'opacity-60' : 'opacity-100'}`}>
            {activeTab === 'overview' && (
              <OverviewTab summary={summary} loading={loading} />
            )}
            {activeTab === 'branches' && (
              <BranchesTab
                report={branchReport}
                loading={loading}
                expandedBranch={expandedBranch}
                setExpandedBranch={setExpandedBranch}
                onGeneratePdf={(branchId) => generatePdfReport('branch', { branchId })}
                pdfLoading={pdfLoading}
              />
            )}
            {activeTab === 'managers' && (
              <ManagersTab
                report={managerReport}
                loading={loading}
                expandedManager={expandedManager}
                setExpandedManager={setExpandedManager}
                onGeneratePdf={(managerId, branchId) => generatePdfReport('manager', { managerId, branchId })}
                pdfLoading={pdfLoading}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ==================== GENEL BAKIŞ TAB ====================
function OverviewTab({
  summary,
  loading,
}: {
  summary: PerformanceDashboardSummary | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
        </div>
      </div>
    );
  }

  if (!summary) return <EmptyState icon={BarChart3} title="Veri bulunamadı" />;

  const { overview, topBranches, topManagers, activityTrend, branchComparison } = summary;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Şube"
          value={overview.totalBranches}
          subtitle={`${overview.activeBranches} aktif`}
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="İlçe Yöneticisi"
          value={overview.totalManagers}
          icon={Users}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <StatCard
          title="Toplam Aktivite"
          value={overview.totalActivities}
          icon={Activity}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Toplam Üye"
          value={overview.totalMembers}
          subtitle={`${overview.activeMembersCount} aktif`}
          icon={UserCheck}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Aktivite Trendi" subtitle={`Seçili dönem (${activityTrend[0]?.granularity === 'daily' ? 'Günlük' : activityTrend[0]?.granularity === 'weekly' ? 'Haftalık' : 'Aylık'})`}>
          <SimpleBarChart
            data={activityTrend.map((t: { period: string; count: number; granularity: 'daily' | 'weekly' | 'monthly' }) => ({
              label: formatPeriodLabel(t.period, t.granularity),
              value: t.count,
              color: 'bg-blue-500',
            }))}
            height={280}
          />
        </Card>

        <Card title="Şube Karşılaştırma" subtitle="Aktivite sayısına göre">
          <SimpleBarChart
            data={branchComparison
              .sort((a: { activityCount: number }, b: { activityCount: number }) => b.activityCount - a.activityCount)
              .slice(0, 10)
              .map((b: { branchName: string; activityCount: number }) => ({
                label: b.branchName.length > 10 ? b.branchName.substring(0, 10) + '…' : b.branchName,
                value: b.activityCount,
              }))}
            height={280}
          />
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="En İyi Şubeler" subtitle="Aktivite sayısına göre sıralama" noPadding>
          <div className="divide-y divide-gray-50">
            {topBranches.map((branch: { branchId: string; branchName: string; activityCount: number; memberCount: number; performanceScore: number }, index: number) => (
              <div
                key={branch.branchId}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-100 text-amber-700'
                      : index === 1
                      ? 'bg-gray-100 text-gray-600'
                      : index === 2
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{branch.branchName}</p>
                  <p className="text-xs text-gray-400">
                    {branch.activityCount} aktivite · {branch.memberCount} üye
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{branch.activityCount}</p>
                  <p className="text-[10px] text-gray-400">aktivite</p>
                </div>
              </div>
            ))}
            {topBranches.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Henüz veri yok</div>
            )}
          </div>
        </Card>

        <Card title="En İyi Yöneticiler" subtitle="Aktivite sayısına göre sıralama" noPadding>
          <div className="divide-y divide-gray-50">
            {topManagers.map((manager: { uid: string; fullName: string; branchName?: string; activityCount: number }, index: number) => (
              <div
                key={manager.uid}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-100 text-amber-700'
                      : index === 1
                      ? 'bg-gray-100 text-gray-600'
                      : index === 2
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{manager.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {manager.branchName} · {manager.activityCount} aktivite
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{manager.activityCount}</p>
                  <p className="text-[10px] text-gray-400">aktivite</p>
                </div>
              </div>
            ))}
            {topManagers.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Henüz veri yok</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==================== ŞUBE RAPORU TAB ====================
function BranchesTab({
  report,
  loading,
  expandedBranch,
  setExpandedBranch,
  onGeneratePdf,
  pdfLoading,
}: {
  report: BranchPerformanceResponse | null;
  loading: boolean;
  expandedBranch: string | null;
  setExpandedBranch: (id: string | null) => void;
  onGeneratePdf: (branchId: string) => void;
  pdfLoading: string | null;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!report || report.branches.length === 0) {
    return <EmptyState icon={Building2} title="Şube verisi bulunamadı" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Toplam Aktivite"
          value={report.summary.totalActivities}
          subtitle="Seçili dönemde"
          icon={Activity}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Toplam Üye"
          value={report.summary.totalMembers}
          subtitle="Kayıtlı üye sayısı"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      {/* Branch Cards */}
      <div className="space-y-3">
        {report.branches.map((branch: BranchPerformanceReport) => (
          <BranchCard
            key={branch.branchId}
            branch={branch}
            isExpanded={expandedBranch === branch.branchId}
            onToggle={() =>
              setExpandedBranch(expandedBranch === branch.branchId ? null : branch.branchId)
            }
            onGeneratePdf={() => onGeneratePdf(branch.branchId)}
            pdfLoading={pdfLoading === `branch-${branch.branchId}`}
          />
        ))}
      </div>
    </div>
  );
}

function BranchCard({
  branch,
  isExpanded,
  onToggle,
  onGeneratePdf,
  pdfLoading,
}: {
  branch: BranchPerformanceReport;
  isExpanded: boolean;
  onToggle: () => void;
  onGeneratePdf: () => void;
  pdfLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-900 truncate">{branch.branchName}</h3>
              <Badge variant={branch.isActive ? 'success' : 'danger'}>
                {branch.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{branch.activities.total} aktivite</span>
              <span>{branch.members.total} üye</span>
              <span>{branch.announcements.total} duyuru</span>
              <span>{branch.managers.length} yönetici</span>
            </div>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        {/* PDF butonu */}
        <button
          onClick={(e) => { e.stopPropagation(); onGeneratePdf(); }}
          disabled={pdfLoading}
          className="mr-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          title="Bu şubenin PDF raporunu oluştur"
        >
          {pdfLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          PDF
        </button>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5">
          {/* Metrics Grid — haberler ve mesajlar kaldırıldı */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricBox
              label="Aktiviteler"
              value={branch.activities.total}
              detail={`${branch.activities.published} yayında`}
              color="text-emerald-600"
            />
            <MetricBox
              label="Üyeler"
              value={branch.members.total}
              detail={`${branch.members.active} aktif · ${branch.members.pending} bekleyen`}
              color="text-blue-600"
            />
            <MetricBox
              label="Duyurular"
              value={branch.announcements.total}
              detail={`${branch.announcements.published} yayında`}
              color="text-violet-600"
            />
          </div>

          {/* Dinamik Aktivite Grafiği */}
          {branch.activities.byPeriod && branch.activities.byPeriod.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Aktivite Dağılımı ({branch.activities.granularity === 'daily' ? 'Günlük' : branch.activities.granularity === 'weekly' ? 'Haftalık' : 'Aylık'})
              </p>
              <SimpleBarChart
                data={branch.activities.byPeriod.map((p: { period: string; count: number }) => ({
                  label: formatPeriodLabel(p.period, branch.activities.granularity),
                  value: p.count,
                  color: 'bg-emerald-500',
                }))}
                height={180}
              />
            </div>
          )}

          {/* Kategori Dağılımı */}
          {branch.activities.byCategory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Kategori Dağılımı</p>
              <div className="space-y-2">
                {branch.activities.byCategory.map((cat: { categoryId: string; categoryName: string; count: number }) => (
                  <ProgressBar
                    key={cat.categoryId}
                    label={cat.categoryName}
                    value={cat.count}
                    max={branch.activities.total}
                    color="bg-blue-500"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yeni Üyeler & Yöneticiler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Son Dönemde Yeni Üye</p>
              <p className="text-lg font-bold text-gray-900">{branch.members.newThisPeriod}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Şube Yöneticileri</p>
              <div className="space-y-0.5">
                {branch.managers.map((m: { uid: string; firstName: string; lastName: string }) => (
                  <p key={m.uid} className="text-xs text-gray-700">
                    {m.firstName} {m.lastName}
                  </p>
                ))}
                {branch.managers.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Yönetici atanmamış</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== YÖNETİCİ RAPORU TAB ====================
function ManagersTab({
  report,
  loading,
  expandedManager,
  setExpandedManager,
  onGeneratePdf,
  pdfLoading,
}: {
  report: ManagerPerformanceResponse | null;
  loading: boolean;
  expandedManager: string | null;
  setExpandedManager: (id: string | null) => void;
  onGeneratePdf: (managerId: string, branchId?: string) => void;
  pdfLoading: string | null;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!report || report.managers.length === 0) {
    return <EmptyState icon={Users} title="Yönetici verisi bulunamadı" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <StatCard
        title="Toplam Aktivite"
        value={report.summary.totalActivities}
        subtitle="Yöneticiler tarafından oluşturulan (Seçili dönem)"
        icon={Activity}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      />

      {/* Manager Cards */}
      <div className="space-y-3">
        {report.managers.map((manager: ManagerPerformanceReport) => (
          <ManagerCard
            key={manager.uid}
            manager={manager}
            isExpanded={expandedManager === manager.uid}
            onToggle={() =>
              setExpandedManager(expandedManager === manager.uid ? null : manager.uid)
            }
            onGeneratePdf={() => onGeneratePdf(manager.uid, manager.branchId)}
            pdfLoading={pdfLoading === `manager-${manager.uid}`}
          />
        ))}
      </div>
    </div>
  );
}

function ManagerCard({
  manager,
  isExpanded,
  onToggle,
  onGeneratePdf,
  pdfLoading,
}: {
  manager: ManagerPerformanceReport;
  isExpanded: boolean;
  onToggle: () => void;
  onGeneratePdf: () => void;
  pdfLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {manager.firstName} {manager.lastName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              {manager.branchName && <span>📍 {manager.branchName}</span>}
              {manager.district && <span>🏘️ {manager.district}</span>}
              <span>📋 {manager.activities.total} aktivite</span>
              <span>👥 {manager.managedMembers.total} üye</span>
            </div>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        {/* PDF butonu */}
        <button
          onClick={(e) => { e.stopPropagation(); onGeneratePdf(); }}
          disabled={pdfLoading}
          className="mr-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          title="Bu yöneticinin PDF raporunu oluştur"
        >
          {pdfLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          PDF
        </button>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5">
          {/* İletişim Bilgileri */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>✉️ {manager.email}</span>
            {manager.phone && <span>📞 {manager.phone}</span>}
            {manager.lastActivityDate && (
              <span>
                🕐 Son aktivite:{' '}
                {new Date(manager.lastActivityDate).toLocaleDateString('tr-TR')}
              </span>
            )}
          </div>

          {/* Metrics — haberler kaldırıldı */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricBox
              label="Aktiviteler"
              value={manager.activities.total}
              detail={`${manager.activities.published} yayında`}
              color="text-emerald-600"
            />
            <MetricBox
              label="Duyurular"
              value={manager.announcements.total}
              detail={`${manager.announcements.published} yayında`}
              color="text-blue-600"
            />
            <MetricBox
              label="Yönetilen Üye"
              value={manager.managedMembers.total}
              detail={`${manager.managedMembers.active} aktif · ${manager.managedMembers.pending} bekleyen`}
              color="text-amber-600"
            />
          </div>

          {/* Dinamik Aktivite */}
          {manager.activities.byPeriod && manager.activities.byPeriod.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Aktivite Dağılımı ({manager.activities.granularity === 'daily' ? 'Günlük' : manager.activities.granularity === 'weekly' ? 'Haftalık' : 'Aylık'})
              </p>
              <SimpleBarChart
                data={manager.activities.byPeriod.map((p: { period: string; count: number }) => ({
                  label: formatPeriodLabel(p.period, manager.activities.granularity),
                  value: p.count,
                  color: 'bg-violet-500',
                }))}
                height={180}
              />
            </div>
          )}

          {/* Kategori Dağılımı */}
          {manager.activities.byCategory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Kategori Dağılımı</p>
              <div className="space-y-2">
                {manager.activities.byCategory.map((cat: { categoryId: string; categoryName: string; count: number }) => (
                  <ProgressBar
                    key={cat.categoryId}
                    label={cat.categoryName}
                    value={cat.count}
                    max={manager.activities.total}
                    color="bg-violet-500"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Son Aktiviteler */}
          {manager.activities.recentActivities.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Son Aktiviteler</p>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="text-left px-3 py-2 font-medium">Aktivite</th>
                      <th className="text-left px-3 py-2 font-medium">Kategori</th>
                      <th className="text-left px-3 py-2 font-medium">Tarih</th>
                      <th className="text-center px-3 py-2 font-medium">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {manager.activities.recentActivities.map((activity: { id: string; name: string; categoryName?: string; activityDate: string; isPublished: boolean }) => (
                      <tr key={activity.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-gray-700 font-medium truncate max-w-[200px]">
                          {activity.name}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{activity.categoryName || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {activity.activityDate
                            ? new Date(activity.activityDate).toLocaleDateString('tr-TR')
                            : '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant={activity.isPublished ? 'success' : 'warning'}>
                            {activity.isPublished ? 'Yayında' : 'Taslak'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Yardımcı Mini Bileşen ====================
function MetricBox({
  label,
  value,
  detail,
  color = 'text-gray-900',
}: {
  label: string;
  value: number;
  detail?: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
      {detail && <p className="text-[11px] text-gray-400 mt-0.5">{detail}</p>}
    </div>
  );
}

// ==================== PDF OLUŞTURMA (jsPDF) ====================
async function createPdf(
  reportData: ReportGenerateResponse,
  type: 'branch' | 'manager'
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  const periodStart = formatDate(reportData.period.startDate);
  const periodEnd = formatDate(reportData.period.endDate);

  function checkPage(neededHeight: number) {
    if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function drawLine() {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;
  }

  // === BAŞLIK ===
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('Performans Raporu', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Rapor Tarihi: ${formatDate(reportData.generatedAt)}`, margin, y);
  y += 5;
  doc.text(`Donem: ${periodStart} - ${periodEnd}`, margin, y);
  y += 5;
  doc.text(`Rapor Turu: ${type === 'branch' ? 'Sube Raporu' : 'Yonetici Raporu'}`, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38); // red-600
  doc.text('* Bu rapor sadece secili tarih araligindaki aktiviteleri gosterir', margin, y);
  y += 6;
  drawLine();
  y += 3;

  if (type === 'branch') {
    const reports = (reportData as any).reports as BranchReportData[];
    for (let i = 0; i < reports.length; i++) {
      const r = reports[i];
      checkPage(60);

      // Şube başlığı
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text(`${r.branchName}`, margin, y);
      y += 6;

      if (r.managers.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Yoneticiler: ${r.managers.map((m: any) => m.fullName).join(', ')}`, margin, y);
        y += 5;
      }

      // Özet satırları
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      y += 2;

      const summaryLines = [
        `Toplam Uye: ${r.summary.totalMembers} (${r.summary.activeMembers} aktif)`,
        `Yeni Uye: ${r.summary.newMembers}`,
        `Guncellenen Uye: ${r.summary.updatedMembers}`,
        `Toplam Aktivite: ${r.summary.totalActivities}`,
        `Bildirim Gonderildi: ${r.summary.notificationsSent}`,
        `Haber: ${r.summary.newsCreated} | Duyuru: ${r.summary.announcementsCreated}`,
      ];

      for (const line of summaryLines) {
        checkPage(6);
        doc.text(`  * ${line}`, margin, y);
        y += 5;
      }

      // Log satırları
      if (r.logEntries.length > 0) {
        y += 3;
        checkPage(10);
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text('Islem Ozeti:', margin, y);
        y += 5;

        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        for (const log of r.logEntries) {
          checkPage(6);
          const icon = logTypeIcon(log.type);
          doc.text(`  ${icon} ${log.message}`, margin, y);
          y += 5;
        }
      }

      // Aktivite listesi
      if (r.activities.length > 0) {
        y += 3;
        checkPage(10);
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text('Aktiviteler:', margin, y);
        y += 5;

        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        checkPage(7);
        doc.text('Ad', margin + 2, y);
        doc.text('Kategori', margin + 75, y);
        doc.text('Tarih', margin + 120, y);
        doc.text('Durum', margin + 155, y);
        y += 1;
        drawLine();
        y += 2;

        doc.setTextColor(55, 65, 81);
        for (const act of r.activities.slice(0, 20)) {
          checkPage(6);
          const name = act.name.length > 35 ? act.name.substring(0, 35) + '...' : act.name;
          doc.text(name, margin + 2, y);
          doc.text(act.categoryName || '-', margin + 75, y);
          doc.text(act.createdAt ? new Date(act.createdAt).toLocaleDateString('tr-TR') : '-', margin + 120, y);
          doc.text(act.isPublished ? 'Yayinda' : 'Taslak', margin + 155, y);
          y += 5;
        }
        if (r.activities.length > 20) {
          doc.setTextColor(107, 114, 128);
          doc.text(`  ... ve ${r.activities.length - 20} aktivite daha`, margin, y);
          y += 5;
        }
      }

      y += 5;
      if (i < reports.length - 1) {
        drawLine();
        y += 5;
      }
    }
  } else {
    // Manager raporu
    const reports = (reportData as any).reports as ManagerReportData[];
    for (let i = 0; i < reports.length; i++) {
      const r = reports[i];
      checkPage(60);

      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text(`${r.fullName}`, margin, y);
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const info = [r.branchName, r.district, r.email].filter(Boolean).join(' | ');
      doc.text(info, margin, y);
      y += 6;

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);

      const summaryLines = [
        `Yonetilen Uye: ${r.summary.managedMembers} (${r.summary.activeMembers} aktif)`,
        `Yeni Uye: ${r.summary.newMembers}`,
        `Guncellenen Uye: ${r.summary.updatedMembers}`,
        `Onaylanan Basvuru: ${r.summary.approvals} | Reddedilen: ${r.summary.rejections}`,
        `Toplam Aktivite: ${r.summary.totalActivities}`,
        `Bildirim Gonderildi: ${r.summary.notificationsSent}`,
        `Haber: ${r.summary.newsCreated} | Duyuru: ${r.summary.announcementsCreated}`,
      ];

      for (const line of summaryLines) {
        checkPage(6);
        doc.text(`  * ${line}`, margin, y);
        y += 5;
      }

      // Log satırları
      if (r.logEntries.length > 0) {
        y += 3;
        checkPage(10);
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text('Islem Ozeti:', margin, y);
        y += 5;

        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        for (const log of r.logEntries) {
          checkPage(6);
          const icon = logTypeIcon(log.type);
          doc.text(`  ${icon} ${log.message}`, margin, y);
          y += 5;
        }
      }

      // Aktivite listesi
      if (r.activities.length > 0) {
        y += 3;
        checkPage(10);
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text('Aktiviteler:', margin, y);
        y += 5;

        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        checkPage(7);
        doc.text('Ad', margin + 2, y);
        doc.text('Kategori', margin + 75, y);
        doc.text('Tarih', margin + 120, y);
        doc.text('Durum', margin + 155, y);
        y += 1;
        drawLine();
        y += 2;

        doc.setTextColor(55, 65, 81);
        for (const act of r.activities.slice(0, 20)) {
          checkPage(6);
          const name = act.name.length > 35 ? act.name.substring(0, 35) + '...' : act.name;
          doc.text(name, margin + 2, y);
          doc.text(act.categoryName || '-', margin + 75, y);
          doc.text(act.createdAt ? new Date(act.createdAt).toLocaleDateString('tr-TR') : '-', margin + 120, y);
          doc.text(act.isPublished ? 'Yayinda' : 'Taslak', margin + 155, y);
          y += 5;
        }
        if (r.activities.length > 20) {
          doc.setTextColor(107, 114, 128);
          doc.text(`  ... ve ${r.activities.length - 20} aktivite daha`, margin, y);
          y += 5;
        }
      }

      y += 5;
      if (i < reports.length - 1) {
        drawLine();
        y += 5;
      }
    }
  }

  // Dosya adı
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = type === 'branch'
    ? `sube-performans-raporu-${dateStr}.pdf`
    : `yonetici-performans-raporu-${dateStr}.pdf`;

  doc.save(fileName);
}

function logTypeIcon(type: string): string {
  switch (type) {
    case 'user': return '[Uye]';
    case 'activity': return '[Aktivite]';
    case 'notification': return '[Bildirim]';
    case 'news': return '[Haber]';
    case 'announcement': return '[Duyuru]';
    default: return '[+]';
  }
}
