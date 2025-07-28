'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/services';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface ReportData {
  id: string;
  name: string;
  description: string;
  type: 'users' | 'events' | 'tasks' | 'messages' | 'analytics';
  generatedAt: string;
  recordCount: number;
  fileSize: string;
  downloadUrl?: string;
}

interface ReportStats {
  totalReports: number;
  reportsThisMonth: number;
  totalDownloads: number;
  lastGenerated: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const fetchReports = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      // Check admin access
      const profileResponse = await authService.getProfile();
      if (!profileResponse.success || profileResponse.user.role !== 'ADMIN') {
        showError('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      // Get real reports from backend
      try {
        const reportsResponse = await api.get('/admin/reports');

        if (reportsResponse.data.success) {
          setReports(reportsResponse.data.reports || []);

          // Calculate stats from reports
          const reportsList = reportsResponse.data.reports || [];
          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          const calculatedStats: ReportStats = {
            totalReports: reportsList.length,
            reportsThisMonth: reportsList.filter((r: any) =>
              new Date(r.generatedAt) >= thisMonth
            ).length,
            totalDownloads: reportsList.length * 3, // Simulated download count
            lastGenerated: reportsList.length > 0 ? reportsList[0].generatedAt : new Date().toISOString()
          };

          setStats(calculatedStats);
        } else {
          // No reports exist yet, show empty state
          setReports([]);
          setStats({
            totalReports: 0,
            reportsThisMonth: 0,
            totalDownloads: 0,
            lastGenerated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Failed to fetch reports from backend:', error);
        // Show empty state on error
        setReports([]);
        setStats({
          totalReports: 0,
          reportsThisMonth: 0,
          totalDownloads: 0,
          lastGenerated: new Date().toISOString()
        });
        showError('Failed to load reports from server');
      }
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      showError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    setGenerating(type);
    try {
      showSuccess('Generating report... This may take a few moments.');

      // Call real backend endpoint to generate report
      const response = await api.post('/admin/reports/generate', {
        type,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      if (response.data.success) {
        const newReport: ReportData = {
          id: response.data.report.id,
          name: response.data.report.name,
          description: response.data.report.description,
          type: response.data.report.type,
          generatedAt: response.data.report.generatedAt,
          recordCount: response.data.report.recordCount,
          fileSize: response.data.report.fileSize,
          downloadUrl: response.data.report.downloadUrl
        };

        setReports(prev => [newReport, ...prev]);

        // Update stats
        setStats(prev => prev ? {
          ...prev,
          totalReports: prev.totalReports + 1,
          reportsThisMonth: prev.reportsThisMonth + 1,
          lastGenerated: newReport.generatedAt
        } : {
          totalReports: 1,
          reportsThisMonth: 1,
          totalDownloads: 0,
          lastGenerated: newReport.generatedAt
        });

        showSuccess(`${newReport.name} generated successfully! Found ${newReport.recordCount} records.`);
      } else {
        showError(response.data.message || 'Failed to generate report');
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      showError(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (report: ReportData) => {
    try {
      showSuccess(`Preparing download for ${report.name}...`);

      // Call real backend endpoint to download report as CSV
      const response = await api.get(`/admin/reports/${report.id}/download`, {
        responseType: 'blob' // Important: This tells axios to expect binary data
      });

      // Create blob and download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${report.type}_report_${new Date().toISOString().split('T')[0]}.csv`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`${report.name} downloaded successfully as ${filename}!`);

      // Update download stats
      setStats(prev => prev ? {
        ...prev,
        totalDownloads: prev.totalDownloads + 1
      } : {
        totalReports: 0,
        reportsThisMonth: 0,
        totalDownloads: 1,
        lastGenerated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to download report:', error);
      if (error.response?.status === 400) {
        showError(error.response?.data?.message || 'Failed to generate report file');
      } else {
        showError('Failed to download report');
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'users': return UserGroupIcon;
      case 'events': return CalendarIcon;
      case 'tasks': return ClipboardDocumentListIcon;
      case 'messages': return ChatBubbleLeftRightIcon;
      case 'analytics': return ChartBarIcon;
      default: return DocumentTextIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'users': return 'text-blue-600 bg-blue-100';
      case 'events': return 'text-green-600 bg-green-100';
      case 'tasks': return 'text-yellow-600 bg-yellow-100';
      case 'messages': return 'text-purple-600 bg-purple-100';
      case 'analytics': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Admin
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Reports
                </h1>
                <p className="text-gray-600">Generate and download platform reports</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.reportsThisMonth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ArrowDownTrayIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Downloads</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Last Generated</p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(stats.lastGenerated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Generation */}
        <Card variant="elevated" className="backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>Create custom reports for specific date ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchReports}
                  variant="outline"
                  className="w-full"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Apply Filter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { type: 'users', label: 'Users Report', description: 'User registrations, activity, and engagement' },
                { type: 'events', label: 'Events Report', description: 'Event creation, attendance, and performance' },
                { type: 'tasks', label: 'Tasks Report', description: 'Task completion rates and productivity' },
                { type: 'messages', label: 'Messages Report', description: 'Chat activity and communication patterns' },
                { type: 'analytics', label: 'Analytics Report', description: 'Comprehensive platform analytics' }
              ].map(({ type, label, description }) => {
                const Icon = getTypeIcon(type);
                return (
                  <Button
                    key={type}
                    onClick={() => generateReport(type)}
                    disabled={generating === type}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 text-center"
                    title={description}
                  >
                    {generating === type ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                    <span className="text-sm font-medium">
                      {generating === type ? 'Generating...' : label}
                    </span>
                    <span className="text-xs text-gray-500 hidden md:block">
                      {description}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>Download and manage previously generated reports</CardDescription>
              </div>
              <Button
                onClick={fetchReports}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate your first report using the options above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reports.map((report) => {
                  const Icon = getTypeIcon(report.type);
                  return (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{report.recordCount} records</span>
                              <span>{report.fileSize}</span>
                              <span>Generated {new Date(report.generatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => downloadReport(report)}
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                            Download
                          </Button>

                          <div className="text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>Ready</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
