import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Building,
  BarChart3,
  Target,
  Zap
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
  sales: number;
  profit: number;
  profitMargin: number;
}

interface SalesData {
  month: string;
  sales: number;
  growth?: number;
}

const TeamPNL: React.FC = () => {
  // Sales volume data
  const salesData: SalesData[] = [
    { month: 'June', sales: 28711980 },
    { month: 'July', sales: 76798190, growth: 267.48 },
    { month: 'August', sales: 151093390, growth: 196.74 },
    { month: 'September', sales: 104885519, growth: -30.58 } // Calculated decline
  ];

  // Team expense data
  const teamMembers: TeamMember[] = [
    { name: 'Ali', startDate: '6/1/2025', salary: 20000, may: 20000, june: 20000, july: 20000, august: 20000, ytd: 60000 },
    { name: 'Yara', startDate: '15/6/2025', salary: 20000, may: 0, june: 10000, july: 20000, august: 20000, ytd: 50000 },
    { name: 'Omar', startDate: '7/7/2025', salary: 25000, may: 0, june: 0, july: 25000, august: 20000, ytd: 45000 },
    { name: 'Aya', startDate: '15/7/2025', salary: 20000, may: 0, june: 0, july: 10000, august: 20000, ytd: 30000 },
    { name: 'Mohanad', startDate: '15/5/2025', salary: 50000, may: 25000, june: 50000, july: 50000, august: 50000, ytd: 175000 }
  ];

  // Combined P&L data with sales and expenses
  const monthlyPnL: MonthlyData[] = [
    { 
      month: 'June', 
      salaries: 80000, 
      rent: 12000, 
      total: 92000, 
      sales: 28711980,
      profit: 28711980 - 92000,
      profitMargin: ((28711980 - 92000) / 28711980) * 100
    },
    { 
      month: 'July', 
      salaries: 125000, 
      rent: 20000, 
      total: 145000, 
      sales: 76798190,
      profit: 76798190 - 145000,
      profitMargin: ((76798190 - 145000) / 76798190) * 100
    },
    { 
      month: 'August', 
      salaries: 130000, 
      rent: 20000, 
      total: 150000, 
      sales: 151093390,
      profit: 151093390 - 150000,
      profitMargin: ((151093390 - 150000) / 151093390) * 100
    },
    { 
      month: 'September', 
      salaries: 130000, 
      rent: 20000, 
      total: 150000, 
      sales: 104885519,
      profit: 104885519 - 150000,
      profitMargin: ((104885519 - 150000) / 104885519) * 100
    }
  ];

  const totalYTD = {
    salaries: 465000, // Updated with September
    rent: 72000,
    expenses: 537000,
    sales: 361489079, // Total sales June-September
    profit: 361489079 - 537000,
    profitMargin: ((361489079 - 537000) / 361489079) * 100
  };

  // Forecast next 3 months based on trends
  const forecastMonths = [
    { month: 'October', projectedSales: 110000000, projectedExpenses: 160000 },
    { month: 'November', projectedSales: 125000000, projectedExpenses: 170000 },
    { month: 'December', projectedSales: 140000000, projectedExpenses: 180000 }
  ];

  const formatCurrency = (amount: number) => {
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const formatEGP = (amount: number) => {
    return `EGP ${amount.toLocaleString()}`;
  };

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
            <p className="text-gray-600">Revenue, Expenses & Profit Analysis</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue YTD</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalYTD.sales)}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses YTD</p>
              <p className="text-2xl font-bold text-red-600">{formatEGP(totalYTD.expenses)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit YTD</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalYTD.profit)}</p>
            </div>
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-600">{totalYTD.profitMargin.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Size</p>
              <p className="text-2xl font-bold text-orange-600">{teamMembers.length}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly P&L Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly P&L Performance
            </h2>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">Month</th>
                    <th className="text-right p-3 font-medium text-gray-700">Sales Revenue</th>
                    <th className="text-right p-3 font-medium text-gray-700">Total Expenses</th>
                    <th className="text-right p-3 font-medium text-gray-700">Net Profit</th>
                    <th className="text-right p-3 font-medium text-gray-700">Margin %</th>
                    <th className="text-right p-3 font-medium text-gray-700">Growth %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPnL.map((month, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium">{month.month}</td>
                      <td className="p-3 text-right font-bold text-green-600">{formatCurrency(month.sales)}</td>
                      <td className="p-3 text-right text-red-600">{formatEGP(month.total)}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{formatCurrency(month.profit)}</td>
                      <td className="p-3 text-right font-medium">
                        <span className={month.profitMargin > 95 ? 'text-green-600' : month.profitMargin > 90 ? 'text-yellow-600' : 'text-red-600'}>
                          {month.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {index > 0 && (
                          <span className={salesData[index]?.growth && salesData[index].growth! > 0 ? 'text-green-600' : 'text-red-600'}>
                            {salesData[index]?.growth ? `${salesData[index].growth!.toFixed(1)}%` : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sales Growth Analysis */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Sales Growth Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">June → July: </span>
                  <span className="font-bold text-green-600">+267.48%</span>
                </div>
                <div>
                  <span className="text-green-700">July → August: </span>
                  <span className="font-bold text-green-600">+196.74%</span>
                </div>
                <div>
                  <span className="text-red-700">August → September: </span>
                  <span className="font-bold text-red-600">-30.58%</span>
                </div>
                <div>
                  <span className="text-blue-700">Avg Monthly Growth: </span>
                  <span className="font-bold text-blue-600">+144.55%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Expense Breakdown
            </h2>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-700">Name</th>
                    <th className="text-left p-3 font-medium text-gray-700">Start Date</th>
                    <th className="text-right p-3 font-medium text-gray-700">June</th>
                    <th className="text-right p-3 font-medium text-gray-700">July</th>
                    <th className="text-right p-3 font-medium text-gray-700">August</th>
                    <th className="text-right p-3 font-medium text-gray-700">Sept</th>
                    <th className="text-right p-3 font-medium text-gray-700">YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium">{member.name}</td>
                      <td className="p-3 text-gray-600 text-sm">{member.startDate}</td>
                      <td className="p-3 text-right">{member.june.toLocaleString()}</td>
                      <td className="p-3 text-right">{member.july.toLocaleString()}</td>
                      <td className="p-3 text-right">{member.august.toLocaleString()}</td>
                      <td className="p-3 text-right">{member.salary.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{(member.ytd + member.salary).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                    <td className="p-3">Total Salaries</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right">80,000</td>
                    <td className="p-3 text-right">125,000</td>
                    <td className="p-3 text-right">130,000</td>
                    <td className="p-3 text-right">130,000</td>
                    <td className="p-3 text-right text-red-600">465,000</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-medium">Rent & Overhead</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right">12,000</td>
                    <td className="p-3 text-right">20,000</td>
                    <td className="p-3 text-right">20,000</td>
                    <td className="p-3 text-right">20,000</td>
                    <td className="p-3 text-right text-red-600">72,000</td>
                  </tr>
                  <tr className="border-b-2 border-gray-400 bg-red-50 font-bold text-lg">
                    <td className="p-3">Total Expenses</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right text-red-700">92,000</td>
                    <td className="p-3 text-right text-red-700">145,000</td>
                    <td className="p-3 text-right text-red-700">150,000</td>
                    <td className="p-3 text-right text-red-700">150,000</td>
                    <td className="p-3 text-right text-red-700">537,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Sales vs Expenses Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Sales vs Expenses Trend
        </h3>
        
        <div className="relative">
          <div className="flex items-end gap-6 h-64">
            {monthlyPnL.map((month, index) => {
              const maxSales = Math.max(...monthlyPnL.map(m => m.sales));
              const salesHeight = (month.sales / maxSales) * 200;
              const expenseHeight = (month.total / maxSales) * 200;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="flex items-end gap-1 w-full">
                    {/* Sales Bar */}
                    <div className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg relative group"
                         style={{ height: `${salesHeight}px` }}>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Sales: {formatCurrency(month.sales)}
                      </div>
                    </div>
                    {/* Expenses Bar */}
                    <div className="w-4 bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg relative group"
                         style={{ height: `${expenseHeight}px` }}>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Exp: {formatEGP(month.total)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-700">{month.month}</p>
                    <p className="text-xs text-green-600">{formatCurrency(month.profit)} profit</p>
                    <p className="text-xs text-gray-500">{month.profitMargin.toFixed(1)}% margin</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Sales Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          3-Month Forecast (Oct-Dec 2024)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecastMonths.map((forecast, index) => (
            <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="text-center">
                <h4 className="font-semibold text-gray-800 mb-2">{forecast.month}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Projected Sales</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(forecast.projectedSales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Projected Expenses</p>
                    <p className="text-lg font-medium text-red-600">{formatEGP(forecast.projectedExpenses)}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(forecast.projectedSales - (forecast.projectedExpenses * 5.7))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Key Performance Indicators
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Revenue per Employee (Monthly Avg)</span>
              <span className="font-bold text-green-600">{formatCurrency(totalYTD.sales / 4 / teamMembers.length)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Cost per Employee (Monthly Avg)</span>
              <span className="font-bold text-red-600">{formatEGP(totalYTD.salaries / 4 / teamMembers.length)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Profit per Employee (Monthly Avg)</span>
              <span className="font-bold text-blue-600">{formatCurrency(totalYTD.profit / 4 / teamMembers.length)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Revenue Growth Rate</span>
              <span className="font-bold text-green-600">+144.55%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Monthly Sales Performance
          </h3>
          <div className="space-y-3">
            {salesData.map((sales, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">{sales.month} 2024</span>
                <div className="text-right">
                  <div className="font-bold text-green-600">{formatCurrency(sales.sales)}</div>
                  {sales.growth && (
                    <div className={`text-sm ${sales.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sales.growth > 0 ? '+' : ''}{sales.growth.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
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
            // Export complete P&L data as CSV
            const headers = 'Month,Sales Revenue,Total Expenses,Net Profit,Profit Margin %,Growth %';
            const csvData = monthlyPnL.map(m => 
              `${m.month},${m.sales},${m.total},${m.profit},${m.profitMargin.toFixed(1)},${salesData.find(s => s.month === m.month)?.growth?.toFixed(1) || ''}`
            ).join('\n');
            const blob = new Blob([`${headers}\n${csvData}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'team_pnl_complete_report.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Export Complete P&L
        </button>
      </div>
    </div>
  );
};

export default TeamPNL;