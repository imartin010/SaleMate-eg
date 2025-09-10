import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Building,
  BarChart3
} from 'lucide-react';

interface TeamMember {
  name: string;
  startDate: string;
  salary: number;
  may: number;
  june: number;
  july: number;
  august: number;
  ytd: number;
}

interface MonthlyData {
  month: string;
  salaries: number;
  rent: number;
  total: number;
}

const TeamPNL: React.FC = () => {
  // Team expense data for previous 3 months
  const teamMembers: TeamMember[] = [
    { name: 'Ali', startDate: '6/1/2025', salary: 20000, may: 20000, june: 20000, july: 20000, august: 20000, ytd: 60000 },
    { name: 'Yara', startDate: '15/6/2025', salary: 20000, may: 0, june: 10000, july: 20000, august: 20000, ytd: 50000 },
    { name: 'Omar', startDate: '7/7/2025', salary: 25000, may: 0, june: 0, july: 25000, august: 20000, ytd: 45000 },
    { name: 'Aya', startDate: '15/7/2025', salary: 20000, may: 0, june: 0, july: 10000, august: 20000, ytd: 30000 },
    { name: 'Mohanad', startDate: '15/5/2025', salary: 50000, may: 25000, june: 50000, july: 50000, august: 50000, ytd: 175000 }
  ];

  const monthlyTotals: MonthlyData[] = [
    { month: 'May', salaries: 25000, rent: 4000, total: 29000 },
    { month: 'June', salaries: 80000, rent: 12000, total: 92000 },
    { month: 'July', salaries: 125000, rent: 20000, total: 145000 },
    { month: 'August', salaries: 130000, rent: 20000, total: 150000 }
  ];

  const totalYTD = {
    salaries: 360000,
    rent: 56000,
    total: 416000
  };

  // Calculate forecasting for next 3 months (simple projection based on August)
  const augustTotal = monthlyTotals[3].total;
  const forecastMonths = [
    { month: 'September', projected: augustTotal * 1.05, growth: 5 },
    { month: 'October', projected: augustTotal * 1.08, growth: 8 },
    { month: 'November', projected: augustTotal * 1.12, growth: 12 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team P&L Dashboard</h1>
            <p className="text-gray-600">Profit & Loss Analysis and Forecasting</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total YTD Expenses</p>
              <p className="text-2xl font-bold text-gray-900">EGP {totalYTD.total.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Salaries YTD</p>
              <p className="text-2xl font-bold text-gray-900">EGP {totalYTD.salaries.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rent & Overhead YTD</p>
              <p className="text-2xl font-bold text-gray-900">EGP {totalYTD.rent.toLocaleString()}</p>
            </div>
            <Building className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Size</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Previous 3 Months P&L */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              P&L Last 3 Months
            </h2>
          </div>
          
          <div className="p-6">
            {/* Team Members Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Team Member Expenses</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-700">Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Start Date</th>
                      <th className="text-right p-3 font-medium text-gray-700">May</th>
                      <th className="text-right p-3 font-medium text-gray-700">June</th>
                      <th className="text-right p-3 font-medium text-gray-700">July</th>
                      <th className="text-right p-3 font-medium text-gray-700">August</th>
                      <th className="text-right p-3 font-medium text-gray-700">YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium">{member.name}</td>
                        <td className="p-3 text-gray-600">{member.startDate}</td>
                        <td className="p-3 text-right">{member.may.toLocaleString()}</td>
                        <td className="p-3 text-right">{member.june.toLocaleString()}</td>
                        <td className="p-3 text-right">{member.july.toLocaleString()}</td>
                        <td className="p-3 text-right">{member.august.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-blue-600">{member.ytd.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Totals */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Monthly Totals</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Category</th>
                      <th className="text-right p-3 font-medium text-gray-700">May</th>
                      <th className="text-right p-3 font-medium text-gray-700">June</th>
                      <th className="text-right p-3 font-medium text-gray-700">July</th>
                      <th className="text-right p-3 font-medium text-gray-700">August</th>
                      <th className="text-right p-3 font-medium text-gray-700">YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium">Total Salaries</td>
                      <td className="p-3 text-right">25,000</td>
                      <td className="p-3 text-right">80,000</td>
                      <td className="p-3 text-right">125,000</td>
                      <td className="p-3 text-right">130,000</td>
                      <td className="p-3 text-right font-bold text-green-600">360,000</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium">Total Rent</td>
                      <td className="p-3 text-right">4,000</td>
                      <td className="p-3 text-right">12,000</td>
                      <td className="p-3 text-right">20,000</td>
                      <td className="p-3 text-right">20,000</td>
                      <td className="p-3 text-right font-bold text-purple-600">56,000</td>
                    </tr>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <td className="p-3 font-bold">Total Expenses</td>
                      <td className="p-3 text-right font-bold">29,000</td>
                      <td className="p-3 text-right font-bold">92,000</td>
                      <td className="p-3 text-right font-bold">145,000</td>
                      <td className="p-3 text-right font-bold">150,000</td>
                      <td className="p-3 text-right font-bold text-red-600">416,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Next 3 Months Forecast */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Forecast Next 3 Months
            </h2>
          </div>
          
          <div className="p-6">
            {/* Forecast Cards */}
            <div className="space-y-4 mb-6">
              {forecastMonths.map((forecast, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{forecast.month} 2024</h4>
                      <p className="text-sm text-gray-600">Projected expenses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        EGP {Math.round(forecast.projected).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">+{forecast.growth}% growth</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Forecast Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">3-Month Forecast Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Projected Total</p>
                  <p className="text-xl font-bold text-blue-600">
                    EGP {Math.round(forecastMonths.reduce((sum, f) => sum + f.projected, 0)).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Avg Monthly</p>
                  <p className="text-xl font-bold text-purple-600">
                    EGP {Math.round(forecastMonths.reduce((sum, f) => sum + f.projected, 0) / 3).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Growth Assumptions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Forecast Assumptions</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Team growth: +1 member per month</li>
                <li>• Salary increases: 5% quarterly</li>
                <li>• Rent escalation: Fixed at current rate</li>
                <li>• Overhead growth: 8% monthly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart (Visual) */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Monthly Expense Trend
        </h3>
        
        <div className="relative">
          {/* Simple bar chart using CSS */}
          <div className="flex items-end gap-4 h-48">
            {monthlyTotals.map((month, index) => {
              const maxValue = Math.max(...monthlyTotals.map(m => m.total));
              const height = (month.total / maxValue) * 160; // Max height 160px
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg relative group hover:from-blue-700 hover:to-blue-500 transition-colors cursor-pointer"
                       style={{ height: `${height}px` }}>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      EGP {month.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-700">{month.month}</p>
                    <p className="text-xs text-gray-500">EGP {month.total.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          3-Month Forecast Projection
        </h3>
        
        <div className="relative">
          <div className="flex items-end gap-4 h-48">
            {forecastMonths.map((forecast, index) => {
              const maxValue = Math.max(...forecastMonths.map(f => f.projected));
              const height = (forecast.projected / maxValue) * 160;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg relative group hover:from-green-700 hover:to-green-500 transition-colors cursor-pointer"
                       style={{ height: `${height}px` }}>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      EGP {Math.round(forecast.projected).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-700">{forecast.month}</p>
                    <p className="text-xs text-green-600">+{forecast.growth}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Print Report
        </button>
        <button 
          onClick={() => {
            // Export data as CSV
            const csvData = teamMembers.map(m => 
              `${m.name},${m.startDate},${m.may},${m.june},${m.july},${m.august},${m.ytd}`
            ).join('\n');
            const blob = new Blob([`Name,Start Date,May,June,July,August,YTD\n${csvData}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'team_pnl_report.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default TeamPNL;
