import { apiRequest } from '@/utils/api';
import type {
  PerformanceDashboardSummary,
  BranchPerformanceResponse,
  ManagerPerformanceResponse,
  PerformanceReportParams,
  ReportGenerateParams,
  ReportGenerateResponse,
} from '@/types/performance';

export const performanceService = {
  /**
   * Genel performans dashboard özeti
   */
  async getDashboardSummary(params?: PerformanceReportParams) {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.branchId) queryParams.append('branchId', params.branchId);

    const queryString = queryParams.toString();
    const endpoint = `/api/reports/performance${queryString ? `?${queryString}` : ''}`;

    return apiRequest<PerformanceDashboardSummary>(endpoint);
  },

  /**
   * Şube bazlı performans raporu
   */
  async getBranchPerformance(params?: { branchId?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.branchId) queryParams.append('branchId', params.branchId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = `/api/reports/performance/branches${queryString ? `?${queryString}` : ''}`;

    return apiRequest<BranchPerformanceResponse>(endpoint);
  },

  /**
   * İlçe yöneticisi bazlı performans raporu
   */
  async getManagerPerformance(params?: { branchId?: string; managerId?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.branchId) queryParams.append('branchId', params.branchId);
    if (params?.managerId) queryParams.append('managerId', params.managerId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = `/api/reports/performance/managers${queryString ? `?${queryString}` : ''}`;

    return apiRequest<ManagerPerformanceResponse>(endpoint);
  },

  /**
   * PDF rapor verisi oluştur (audit log tabanlı)
   */
  async generateReport(params: ReportGenerateParams) {
    const queryParams = new URLSearchParams();
    queryParams.append('type', params.type);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.managerId) queryParams.append('managerId', params.managerId);

    const queryString = queryParams.toString();
    const endpoint = `/api/reports/generate?${queryString}`;

    return apiRequest<ReportGenerateResponse>(endpoint);
  },
};
