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
  Zap,
  AlertTriangle
} from 'lucide-react';

interface TeamMember {
  name: string;
  startDate: string;
  salary: number;
  june: number;
  july: number;
  august: number;
  september: number;
  ytd: number;
}

interface MonthlyPnL {
  month: string;
  salesVolume: number; // USD sales volume
  grossRevenue: number; // EGP commission earned
  totalExpenses: number; // EGP expenses
  netProfit: number; // EGP profit
  profitMargin: number; // %
  growth?: number; // % growth in sales volume
}

const TeamPNL: React.FC = () => {
  // Commission rates
  const COMMISSION_RATE_REGULAR = 2500; // EGP per $1M
  const COMMISSION_RATE_RETRO = 7000; // EGP per $1M with retroactive

  // Calculate revenue from sales volume
  const calculateRevenue = (salesVolumeUSD: number, isRetroactive: boolean = false) => {
    const millionsInSales = salesVolumeUSD / 1000000;
    const commissionRate = isRetroactive ? COMMISSION_RATE_RETRO : COMMISSION_RATE_REGULAR;
    return millionsInSales * commissionRate;
  };

  // Team expense data (updated with September)
  const teamMembers: TeamMember[] = [
    { name: 'Ali', startDate: '6/1/2025', salary: 20000, june: 20000, july: 20000, august: 20000, september: 20000, ytd: 80000 },
    { name: 'Yara', startDate: '15/6/2025', salary: 20000, june: 10000, july: 20000, august: 20000, september: 20000, ytd: 70000 },
    { name: 'Omar', startDate: '7/7/2025', salary: 25000, june: 0, july: 25000, august: 20000, september: 25000, ytd: 70000 },
    { name: 'Aya', startDate: '15/7/2025', salary: 20000, june: 0, july: 10000, august: 20000, september: 20000, ytd: 50000 },
    { name: 'Mohanad', startDate: '15/5/2025', salary: 50000, june: 50000, july: 50000, august: 50000, september: 50000, ytd: 200000 }
  ];

  // Monthly P&L with correct commission calculations
  const monthlyPnL: MonthlyPnL[] = [
    {
      month: 'June',
      salesVolume: 28711980, // $28.7M
      grossRevenue: calculateRevenue(28711980), // 28.7 * 2500 = 71,780 EGP
      totalExpenses: 92000, // EGP 92K
      netProfit: calculateRevenue(28711980) - 92000, // -20,220 EGP (LOSS)
      profitMargin: ((calculateRevenue(28711980) - 92000) / calculateRevenue(28711980)) * 100,
      growth: 0
    },
    {
      month: 'July', 
      salesVolume: 76798190, // $76.8M
      grossRevenue: calculateRevenue(76798190), // 76.8 * 2500 = 191,995 EGP
      totalExpenses: 145000, // EGP 145K
      netProfit: calculateRevenue(76798190) - 145000, // 46,995 EGP profit
      profitMargin: ((calculateRevenue(76798190) - 145000) / calculateRevenue(76798190)) * 100,
      growth: 267.48
    },
    {
      month: 'August',
      salesVolume: 151093390, // $151.1M  
      grossRevenue: calculateRevenue(151093390), // 151.1 * 2500 = 377,734 EGP
      totalExpenses: 150000, // EGP 150K
      netProfit: calculateRevenue(151093390) - 150000, // 227,734 EGP profit
      profitMargin: ((calculateRevenue(151093390) - 150000) / calculateRevenue(151093390)) * 100,
      growth: 196.74
    },
    {
      month: 'September',
      salesVolume: 104885519, // $104.9M
      grossRevenue: calculateRevenue(104885519), // 104.9 * 2500 = 262,214 EGP
      totalExpenses: 150000, // EGP 150K
      netProfit: calculateRevenue(104885519) - 150000, // 112,214 EGP profit
      profitMargin: ((calculateRevenue(104885519) - 150000) / calculateRevenue(104885519)) * 100,
      growth: -30.58
    }
  ];

  const totalYTD = {
    salesVolume: monthlyPnL.reduce((sum, m) => sum + m.salesVolume, 0),
    grossRevenue: monthlyPnL.reduce((sum, m) => sum + m.grossRevenue, 0),
    totalExpenses: monthlyPnL.reduce((sum, m) => sum + m.totalExpenses, 0),
    netProfit: monthlyPnL.reduce((sum, m) => sum + m.netProfit, 0)
  };

  totalYTD.profitMargin = (totalYTD.netProfit / totalYTD.grossRevenue) * 100;

  const formatUSD = (amount: number) => {
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const formatEGP = (amount: number) => {
    return `EGP ${amount.toLocaleString()}`;
  };

  // Forecast next 3 months
  const forecastMonths = [
    { 
      month: 'October', 
      projectedSalesVolume: 120000000, // $120M
      projectedRevenue: calculateRevenue(120000000),
      projectedExpenses: 160000,
      isRetroactive: false
    },
    { 
      month: 'November', 
      projectedSalesVolume: 140000000, // $140M
      projectedRevenue: calculateRevenue(140000000),
      projectedExpenses: 170000,
      isRetroactive: false
    },
    { 
      month: 'December', 
      projectedSalesVolume: 160000000, // $160M
      projectedRevenue: calculateRevenue(160000000, true), // Assuming retroactive bonus
      projectedExpenses: 180000,
      isRetroactive: true
    }
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
            <p className="text-gray-600">Sales Commission Analysis & Profit Tracking</p>
          </div>
        </div>
        
        {/* Commission Rate Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Commission Structure</span>
          </div>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>• <strong>Regular Commission:</strong> {COMMISSION_RATE_REGULAR.toLocaleString()} EGP per $1M sales</div>
            <div>• <strong>Retroactive Bonus:</strong> {COMMISSION_RATE_RETRO.toLocaleString()} EGP per $1M sales</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sales Volume YTD</p>
              <p className="text-2xl font-bold text-green-600">{formatUSD(totalYTD.salesVolume)}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Revenue YTD</p>
              <p className="text-2xl font-bold text-blue-600">{formatEGP(totalYTD.grossRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses YTD</p>
              <p className="text-2xl font-bold text-red-600">{formatEGP(totalYTD.totalExpenses)}</p>
            </div>
            <Building className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit YTD</p>
              <p className={`text-2xl font-bold ${totalYTD.netProfit > 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatEGP(totalYTD.netProfit)}
              </p>
            </div>
            {totalYTD.netProfit > 0 ? (
              <TrendingUp className="h-8 w-8 text-purple-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${totalYTD.profitMargin > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {totalYTD.profitMargin.toFixed(1)}%
              </p>
            </div>
            <Zap className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Monthly P&L Table - Regular Commission */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly P&L Performance - Regular Commission (2,500 EGP per $1M)
            </h2>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">Month</th>
                    <th className="text-right p-3 font-medium text-gray-700">Sales Volume (USD)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Commission Rate</th>
                    <th className="text-right p-3 font-medium text-gray-700">Gross Revenue (EGP)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Total Expenses (EGP)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Net Profit (EGP)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Margin %</th>
                    <th className="text-right p-3 font-medium text-gray-700">Growth %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPnL.map((month, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium">{month.month}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{formatUSD(month.salesVolume)}</td>
                      <td className="p-3 text-right text-sm text-gray-600">2,500/1M</td>
                      <td className="p-3 text-right font-bold text-green-600">{formatEGP(Math.round(month.grossRevenue))}</td>
                      <td className="p-3 text-right text-red-600">{formatEGP(month.totalExpenses)}</td>
                      <td className="p-3 text-right font-bold">
                        <span className={month.netProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatEGP(Math.round(month.netProfit))}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">
                        <span className={month.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}>
                          {month.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {month.growth !== undefined && (
                          <span className={month.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                            {month.growth > 0 ? '+' : ''}{month.growth.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-400 bg-blue-50 font-bold text-lg">
                    <td className="p-3">YTD TOTAL</td>
                    <td className="p-3 text-right text-blue-700">{formatUSD(totalYTD.salesVolume)}</td>
                    <td className="p-3 text-right text-sm">Avg 2,500</td>
                    <td className="p-3 text-right text-green-700">{formatEGP(Math.round(totalYTD.grossRevenue))}</td>
                    <td className="p-3 text-right text-red-700">{formatEGP(totalYTD.totalExpenses)}</td>
                    <td className="p-3 text-right">
                      <span className={totalYTD.netProfit > 0 ? 'text-green-700' : 'text-red-700'}>
                        {formatEGP(Math.round(totalYTD.netProfit))}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={totalYTD.profitMargin > 0 ? 'text-green-700' : 'text-red-700'}>
                        {totalYTD.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Best Month</h4>
                <p className="text-2xl font-bold text-green-600">August</p>
                <p className="text-sm text-green-700">{formatEGP(Math.round(monthlyPnL[2].netProfit))} profit</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Worst Month</h4>
                <p className="text-2xl font-bold text-red-600">June</p>
                <p className="text-sm text-red-700">{formatEGP(Math.round(monthlyPnL[0].netProfit))} loss</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Avg Monthly Profit</h4>
                <p className="text-2xl font-bold text-blue-600">{formatEGP(Math.round(totalYTD.netProfit / 4))}</p>
                <p className="text-sm text-blue-700">4-month average</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly P&L Table - Retroactive Commission */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Monthly P&L Performance - Retroactive Commission (7,000 EGP per $1M)
            </h2>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-yellow-50">
                    <th className="text-left p-3 font-medium text-gray-700">Month</th>
                    <th className="text-right p-3 font-medium text-gray-700">Sales Volume (USD)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Commission Rate</th>
                    <th className="text-right p-3 font-medium text-gray-700">Gross Revenue (EGP)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Total Expenses (EGP)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Net Profit (EGP)</th>
                    <th className="text-right p-3 font-medium text-gray-700">Margin %</th>
                    <th className="text-right p-3 font-medium text-gray-700">Difference vs Regular</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPnL.map((month, index) => {
                    const retroRevenue = calculateRevenue(month.salesVolume, true);
                    const retroProfit = retroRevenue - month.totalExpenses;
                    const retroMargin = (retroProfit / retroRevenue) * 100;
                    const profitDifference = retroProfit - month.netProfit;
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-yellow-50">
                        <td className="p-3 font-medium">{month.month}</td>
                        <td className="p-3 text-right font-bold text-blue-600">{formatUSD(month.salesVolume)}</td>
                        <td className="p-3 text-right text-sm text-yellow-700 font-medium">7,000/1M</td>
                        <td className="p-3 text-right font-bold text-yellow-600">{formatEGP(Math.round(retroRevenue))}</td>
                        <td className="p-3 text-right text-red-600">{formatEGP(month.totalExpenses)}</td>
                        <td className="p-3 text-right font-bold">
                          <span className={retroProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatEGP(Math.round(retroProfit))}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">
                          <span className={retroMargin > 0 ? 'text-green-600' : 'text-red-600'}>
                            {retroMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold">
                          <span className="text-green-600">
                            +{formatEGP(Math.round(profitDifference))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(() => {
                    const totalRetroRevenue = monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0);
                    const totalRetroProfit = totalRetroRevenue - totalYTD.totalExpenses;
                    const totalRetroMargin = (totalRetroProfit / totalRetroRevenue) * 100;
                    const totalDifference = totalRetroProfit - totalYTD.netProfit;
                    
                    return (
                      <tr className="border-t-2 border-yellow-400 bg-yellow-50 font-bold text-lg">
                        <td className="p-3">YTD TOTAL</td>
                        <td className="p-3 text-right text-blue-700">{formatUSD(totalYTD.salesVolume)}</td>
                        <td className="p-3 text-right text-sm text-yellow-700">Avg 7,000</td>
                        <td className="p-3 text-right text-yellow-700">{formatEGP(Math.round(totalRetroRevenue))}</td>
                        <td className="p-3 text-right text-red-700">{formatEGP(totalYTD.totalExpenses)}</td>
                        <td className="p-3 text-right">
                          <span className={totalRetroProfit > 0 ? 'text-green-700' : 'text-red-700'}>
                            {formatEGP(Math.round(totalRetroProfit))}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={totalRetroMargin > 0 ? 'text-green-700' : 'text-red-700'}>
                            {totalRetroMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-green-700">
                          +{formatEGP(Math.round(totalDifference))}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Retroactive Commission Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Total Revenue Boost</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  +{formatEGP(Math.round(monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0) - totalYTD.grossRevenue))}
                </p>
                <p className="text-sm text-yellow-700">vs Regular Commission</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Extra Profit YTD</h4>
                <p className="text-2xl font-bold text-green-600">
                  +{formatEGP(Math.round((monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0) - totalYTD.totalExpenses) - totalYTD.netProfit))}
                </p>
                <p className="text-sm text-green-700">Additional profit</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Improved Margin</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {(((monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0) - totalYTD.totalExpenses) / monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-blue-700">vs {totalYTD.profitMargin.toFixed(1)}% regular</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">Commission Multiplier</h4>
                <p className="text-2xl font-bold text-purple-600">2.8x</p>
                <p className="text-sm text-purple-700">7,000 vs 2,500 EGP</p>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-4">Commission Structure Impact</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-600 mb-2">Regular Commission (Current)</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• 2,500 EGP per $1M sales</li>
                      <li>• YTD Revenue: {formatEGP(Math.round(totalYTD.grossRevenue))}</li>
                      <li>• YTD Profit: {formatEGP(Math.round(totalYTD.netProfit))}</li>
                      <li>• Profit Margin: {totalYTD.profitMargin.toFixed(1)}%</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-yellow-600 mb-2">Retroactive Commission (Potential)</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• 7,000 EGP per $1M sales</li>
                      <li>• YTD Revenue: {formatEGP(Math.round(monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0)))}</li>
                      <li>• YTD Profit: {formatEGP(Math.round((monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0) - totalYTD.totalExpenses)))}</li>
                      <li>• Profit Margin: {(((monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0) - totalYTD.totalExpenses) / monthlyPnL.reduce((sum, m) => sum + calculateRevenue(m.salesVolume, true), 0)) * 100).toFixed(1)}%</li>
                    </ul>
                  </div>
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
                      <td className="p-3 text-right">{member.september.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{member.ytd.toLocaleString()}</td>
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

        {/* Forecast */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            3-Month Forecast (Oct-Dec 2024)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecastMonths.map((forecast, index) => (
              <div key={index} className={`rounded-lg p-4 border ${forecast.isRetroactive ? 'bg-gradient-to-r from-yellow-50 to-green-50 border-yellow-200' : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'}`}>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">{forecast.month}</h4>
                  {forecast.isRetroactive && (
                    <div className="mb-2">
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">RETROACTIVE BONUS</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Sales Volume</p>
                      <p className="text-lg font-bold text-blue-600">{formatUSD(forecast.projectedSalesVolume)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Commission Rate</p>
                      <p className="text-sm font-medium">{forecast.isRetroactive ? '7,000' : '2,500'} EGP/1M</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gross Revenue</p>
                      <p className="text-lg font-bold text-green-600">{formatEGP(Math.round(forecast.projectedRevenue))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Projected Expenses</p>
                      <p className="text-lg font-medium text-red-600">{formatEGP(forecast.projectedExpenses)}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatEGP(Math.round(forecast.projectedRevenue - forecast.projectedExpenses))}
                      </p>
                    </div>
                  </div>
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
            // Export complete P&L data with correct calculations
            const headers = 'Month,Sales Volume USD,Gross Revenue EGP,Total Expenses EGP,Net Profit EGP,Profit Margin %,Growth %';
            const csvData = monthlyPnL.map(m => 
              `${m.month},${m.salesVolume},${Math.round(m.grossRevenue)},${m.totalExpenses},${Math.round(m.netProfit)},${m.profitMargin.toFixed(1)},${m.growth?.toFixed(1) || ''}`
            ).join('\n');
            const blob = new Blob([`${headers}\n${csvData}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'team_pnl_correct_commission_report.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Export Corrected P&L
        </button>
      </div>
    </div>
  );
};

export default TeamPNL;