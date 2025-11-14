import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { auditBackendConnection, type AuditReport } from '../../utils/backendAudit';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export const BackendAuditPanel: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const auditReport = await auditBackendConnection();
      setReport(auditReport);
      setLastRun(new Date());
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run audit on mount
    runAudit();
  }, []);

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'fail':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getOverallColor = (overall: 'healthy' | 'degraded' | 'critical') => {
    switch (overall) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Backend Connection Audit</CardTitle>
            <CardDescription>
              Comprehensive test of Supabase backend connectivity and services
            </CardDescription>
          </div>
          <Button
            onClick={runAudit}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Audit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !report && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Running comprehensive audit...</span>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className={`p-4 rounded-lg border-2 ${getOverallColor(report.overall)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Overall Status: {report.overall.toUpperCase()}</h3>
                  <p className="text-sm mt-1">
                    {report.summary.passed} passed, {report.summary.warnings} warnings, {report.summary.failed} failed
                  </p>
                </div>
                {getStatusIcon(report.overall === 'healthy' ? 'pass' : report.overall === 'degraded' ? 'warning' : 'fail')}
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Test Results</h3>
              {report.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(result.status)}
                        <h4 className="font-semibold">{result.test}</h4>
                        <span className="text-xs opacity-75">
                          ({new Date(result.timestamp).toLocaleTimeString()})
                        </span>
                      </div>
                      <p className="text-sm">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {lastRun && (
              <div className="text-sm text-gray-500 text-center pt-4 border-t">
                Last run: {lastRun.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {!loading && !report && (
          <div className="text-center py-8 text-gray-500">
            Click "Run Audit" to test the backend connection
          </div>
        )}
      </CardContent>
    </Card>
  );
};


