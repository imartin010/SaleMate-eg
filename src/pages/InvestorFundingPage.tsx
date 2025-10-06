import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Calendar, BarChart3, PieChart } from 'lucide-react';

const InvestorFundingPage: React.FC = () => {
  const [animatedNumbers, setAnimatedNumbers] = useState({
    marketSize: 0,
    monthlyLeads: 0,
    targetShare: 0,
    grossProfit: 0
  });

  useEffect(() => {
    const animateNumbers = () => {
      const targets = {
        marketSize: 160788,
        monthlyLeads: 7074672,
        targetShare: 1,
        grossProfit: 7074672
      };

      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setAnimatedNumbers({
          marketSize: Math.floor(targets.marketSize * progress),
          monthlyLeads: Math.floor(targets.monthlyLeads * progress),
          targetShare: Math.floor(targets.targetShare * progress),
          grossProfit: Math.floor(targets.grossProfit * progress)
        });

        if (step >= steps) {
          clearInterval(timer);
          setAnimatedNumbers(targets);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    };

    const timer = setTimeout(animateNumbers, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Professional Header */}
          <div className="text-center space-y-4 sm:space-y-6 py-6 sm:py-8 bg-white rounded-lg shadow-sm border">
            <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 sm:px-6 py-2 text-blue-800 text-sm font-medium">
              <Target className="w-4 h-4" />
              فرصة استثمارية
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight px-4">
              منصة توليد العملاء المحتملين
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
              تحليل مالي شامل وفرصة سوقية لمنصة توليد العملاء المحتملين 
              المستهدفة لسوق الوساطة العقارية في مصر
            </p>
          </div>

          {/* Market Overview Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                نظرة عامة على السوق
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Metrics Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-blue-600 text-sm font-medium">حجم السوق النشط</p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-800">{formatNumber(animatedNumbers.marketSize)}</p>
                        <p className="text-blue-500 text-xs">وسطاء نشطون</p>
                      </div>
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200 hover:bg-green-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-green-600 text-sm font-medium">الطلب الشهري على العملاء المحتملين</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-800">{formatNumber(animatedNumbers.monthlyLeads)}</p>
                        <p className="text-green-500 text-xs">عملاء محتملون مطلوبون</p>
                      </div>
                      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200 hover:bg-purple-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-purple-600 text-sm font-medium">الحصة السوقية المستهدفة</p>
                        <p className="text-2xl sm:text-3xl font-bold text-purple-800">{animatedNumbers.targetShare}%</p>
                        <p className="text-purple-500 text-xs">اختراق السوق</p>
                      </div>
                      <PieChart className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200 hover:bg-orange-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-orange-600 text-sm font-medium">الربح الإجمالي الشهري</p>
                        <p className="text-2xl sm:text-3xl font-bold text-orange-800">{formatCurrency(animatedNumbers.grossProfit)}</p>
                        <p className="text-orange-500 text-xs">الربح المستهدف</p>
                      </div>
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Market Analysis Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2 text-lg sm:text-xl">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      تحليل حجم السوق
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">شركات الوساطة</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs sm:text-sm">28,000</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">الشركات النشطة</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs sm:text-sm">8,000</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">الوسطاء لكل شركة (متوسط)</span>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs sm:text-sm">20</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">إجمالي الوسطاء</span>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs sm:text-sm">160,000</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">العاملين المستقلين النشطين</span>
                        <Badge variant="outline" className="bg-cyan-100 text-cyan-800 border-cyan-300 text-xs sm:text-sm">788</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2 text-lg sm:text-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      مقاييس توليد العملاء المحتملين
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">العملاء المحتملون المطلوبون يومياً</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs sm:text-sm">321,576</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">العملاء المحتملون الشهريون (22 يوم)</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs sm:text-sm">7,074,672</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-gray-700 text-sm sm:text-base">حجم السوق (جنيه مصري)</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs sm:text-sm">2.9 مليار جنيه</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pricing Strategy */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2 text-lg sm:text-xl">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    استراتيجية التسعير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center p-4 sm:p-6 bg-white rounded-lg hover:bg-blue-50 transition-all duration-300 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">تكلفة العميل المحتمل</h4>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">200 جنيه</p>
                      <p className="text-xs sm:text-sm text-blue-500">التكلفة المستهدفة</p>
                    </div>
                    <div className="text-center p-4 sm:p-6 bg-white rounded-lg hover:bg-green-50 transition-all duration-300 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">سعر البيع</h4>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">300 جنيه</p>
                      <p className="text-xs sm:text-sm text-green-500">السعر المستهدف</p>
                    </div>
                    <div className="text-center p-4 sm:p-6 bg-white rounded-lg hover:bg-purple-50 transition-all duration-300 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 text-sm sm:text-base">الربح الإجمالي</h4>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-600">100 جنيه</p>
                      <p className="text-xs sm:text-sm text-purple-500">لكل عميل محتمل</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                التوقعات المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Investment Overview */}
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    إجمالي الاستثمار المطلوب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 mb-2">{formatCurrency(3534300)}</p>
                    <p className="text-lg sm:text-2xl text-blue-500 mb-4">جنيه مصري</p>
                    <p className="text-base sm:text-lg text-blue-600 px-4">إجمالي الاستثمار المطلوب</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">إجمالي الاستثمار</h4>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(3534300)}</p>
                      <p className="text-xs sm:text-sm text-blue-500">33% حصة ملكية</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">قرض رأس المال العامل</h4>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(1800000)}</p>
                      <p className="text-xs sm:text-sm text-green-500">مدة 6 أشهر</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expense Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">الإيجار</h3>
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">360,000 جنيه</p>
                    <p className="text-xs sm:text-sm text-blue-500">6 أشهر</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200 hover:bg-green-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">الرواتب</h3>
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">2,352,000 جنيه</p>
                    <p className="text-xs sm:text-sm text-green-500">فريق من 11 شخص</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200 hover:bg-purple-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">التسويق</h3>
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">600,000 جنيه</p>
                    <p className="text-xs sm:text-sm text-purple-500">الوعي بالعلامة التجارية</p>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200 hover:bg-orange-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">العمليات</h3>
                      <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">49,500 جنيه</p>
                    <p className="text-xs sm:text-sm text-orange-500">المستلزمات والأدوات</p>
                  </CardContent>
                </Card>

                <Card className="bg-cyan-50 border-cyan-200 hover:bg-cyan-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">أدوات الذكاء الاصطناعي</h3>
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-cyan-600 mb-2">172,800 جنيه</p>
                    <p className="text-xs sm:text-sm text-cyan-500">مجموعة التقنيات</p>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100 transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">توليد العملاء المحتملين</h3>
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-2">12,400,000 جنيه</p>
                    <p className="text-xs sm:text-sm text-yellow-500">62,000 عميل محتمل</p>
                  </CardContent>
                </Card>
              </div>


              {/* Lead Generation Budget Timeline */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    الجدول الزمني لميزانية توليد العملاء المحتملين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { month: 'نوفمبر', leads: 2000, budget: 400000 },
                      { month: 'ديسمبر', leads: 4000, budget: 800000 },
                      { month: 'يناير', leads: 2000, budget: 400000 },
                      { month: 'فبراير', leads: 6000, budget: 1200000 },
                      { month: 'مارس', leads: 12000, budget: 2400000 },
                      { month: 'أبريل', leads: 36000, budget: 7200000 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-800 font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-semibold">{item.month}</h4>
                            <p className="text-sm text-blue-600">{item.leads.toLocaleString()} عميل محتمل</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(item.budget)}</p>
                          <p className="text-sm text-gray-500">200 جنيه لكل عميل محتمل</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-blue-800">إجمالي ميزانية توليد العملاء المحتملين</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-lg">
                          {formatCurrency(12400000)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Revenue Analysis Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                تحليل الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Revenue Scenarios */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Worst Case Scenario */}
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      سيناريو أسوأ الحالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { month: 'نوفمبر', leadSales: 456000, deals: 0, total: 456000 },
                        { month: 'ديسمبر', leadSales: 912000, deals: 0, total: 912000 },
                        { month: 'يناير', leadSales: 456000, deals: 0, total: 456000 },
                        { month: 'فبراير', leadSales: 1368000, deals: 561450, total: 1929450 },
                        { month: 'مارس', leadSales: 2736000, deals: 561450, total: 3297450 },
                        { month: 'أبريل', leadSales: 8208000, deals: 561450, total: 8769450 },
                        { month: 'مايو', leadSales: 10670400, deals: 729885, total: 11400285 }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-red-100">
                          <div>
                            <span className="text-gray-900 font-semibold">{item.month}</span>
                            <p className="text-sm text-red-600">
                              العملاء المحتملون: {formatCurrency(item.leadSales)} | الصفقات: {formatCurrency(item.deals)}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            {formatCurrency(item.total)}
                          </Badge>
                        </div>
                      ))}
                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-red-800">إجمالي الإيرادات</span>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-lg">
                            {formatCurrency(27659185)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Best Case Scenario */}
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      سيناريو أفضل الحالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { month: 'نوفمبر', leadSales: 800000, deals: 0, total: 800000 },
                        { month: 'ديسمبر', leadSales: 1600000, deals: 0, total: 1600000 },
                        { month: 'يناير', leadSales: 800000, deals: 0, total: 800000 },
                        { month: 'فبراير', leadSales: 2400000, deals: 561450, total: 2961450 },
                        { month: 'مارس', leadSales: 4800000, deals: 561450, total: 5361450 },
                        { month: 'أبريل', leadSales: 14400000, deals: 561450, total: 14961450 },
                        { month: 'مايو', leadSales: 18720000, deals: 729885, total: 19449885 }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-green-100">
                          <div>
                            <span className="text-gray-900 font-semibold">{item.month}</span>
                            <p className="text-sm text-green-600">
                              العملاء المحتملون: {formatCurrency(item.leadSales)} | الصفقات: {formatCurrency(item.deals)}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            {formatCurrency(item.total)}
                          </Badge>
                        </div>
                      ))}
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-green-800">إجمالي الإيرادات</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-lg">
                            {formatCurrency(45372785)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ROI Analysis */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    تحليل العائد على الاستثمار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-white rounded-lg border border-red-200">
                      <h4 className="font-semibold text-gray-900 mb-2">الاستثمار المطلوب</h4>
                      <p className="text-3xl font-bold text-red-600 mb-2">{formatCurrency(3534300)}</p>
                      <p className="text-sm text-red-500">إجمالي الاستثمار</p>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-gray-900 mb-2">العائد في أسوأ الحالات</h4>
                      <p className="text-3xl font-bold text-orange-600 mb-2">73.6%</p>
                      <p className="text-sm text-orange-500">عائد 7 أشهر</p>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">العائد في أفضل الحالات</h4>
                      <p className="text-3xl font-bold text-green-600 mb-2">184.8%</p>
                      <p className="text-sm text-green-500">عائد 7 أشهر</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Monthly Profit/Loss Analysis */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                تحليل الربح/الخسارة الشهري
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Worst Case Monthly Analysis */}
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      التحليل الشهري لأسوأ الحالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { month: 'نوفمبر', revenue: 456000, expenses: 911000, profit: -455000, status: 'خسارة' },
                        { month: 'ديسمبر', revenue: 912000, expenses: 1338750, profit: -426750, status: 'خسارة' },
                        { month: 'يناير', revenue: 456000, expenses: 960250, profit: -504250, status: 'خسارة' },
                        { month: 'فبراير', revenue: 1929450, expenses: 1759500, profit: 169950, status: 'ربح' },
                        { month: 'مارس', revenue: 3297450, expenses: 3009500, profit: 287950, status: 'ربح' },
                        { month: 'أبريل', revenue: 8769450, expenses: 7859500, profit: 909950, status: 'ربح' },
                        { month: 'مايو', revenue: 11400285, expenses: 7859500, profit: 3540785, status: 'ربح' }
                      ].map((item, index) => (
                        <div key={index} className={`flex justify-between items-center p-3 rounded-lg border ${
                          item.status === 'ربح' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div>
                            <span className="text-gray-900 font-semibold">{item.month}</span>
                            <p className="text-sm text-gray-600">
                              الإيرادات: {formatCurrency(item.revenue)} | المصروفات: {formatCurrency(item.expenses)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={
                              item.status === 'ربح' 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : 'bg-red-100 text-red-800 border-red-300'
                            }>
                              {formatCurrency(item.profit)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{item.status}</p>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">صافي الربح الإجمالي</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-lg">
                            {formatCurrency(27659185 - 3534300)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Best Case Monthly Analysis */}
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      التحليل الشهري لأفضل الحالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { month: 'نوفمبر', revenue: 800000, expenses: 911000, profit: -111000, status: 'خسارة' },
                        { month: 'ديسمبر', revenue: 1600000, expenses: 1338750, profit: 261250, status: 'ربح' },
                        { month: 'يناير', revenue: 800000, expenses: 960250, profit: -160250, status: 'خسارة' },
                        { month: 'فبراير', revenue: 2961450, expenses: 1759500, profit: 1201950, status: 'ربح' },
                        { month: 'مارس', revenue: 5361450, expenses: 3009500, profit: 2351950, status: 'ربح' },
                        { month: 'أبريل', revenue: 14961450, expenses: 7859500, profit: 7101950, status: 'ربح' },
                        { month: 'مايو', revenue: 19449885, expenses: 7859500, profit: 11590385, status: 'ربح' }
                      ].map((item, index) => (
                        <div key={index} className={`flex justify-between items-center p-3 rounded-lg border ${
                          item.status === 'ربح' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div>
                            <span className="text-gray-900 font-semibold">{item.month}</span>
                            <p className="text-sm text-gray-600">
                              الإيرادات: {formatCurrency(item.revenue)} | المصروفات: {formatCurrency(item.expenses)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={
                              item.status === 'ربح' 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : 'bg-red-100 text-red-800 border-red-300'
                            }>
                              {formatCurrency(item.profit)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{item.status}</p>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">صافي الربح الإجمالي</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-lg">
                            {formatCurrency(45372785 - 3534300)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profit/Loss Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    ملخص الربح/الخسارة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">سيناريو أسوأ الحالات</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-gray-700">أشهر الخسارة (3)</span>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">نوف، ديس، يناير</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-gray-700">أشهر الربح (4)</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">فبراير، مارس، أبريل، مايو</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-gray-700">نقطة التعادل</span>
                          <span className="text-sm text-gray-600">فبراير</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">سيناريو أفضل الحالات</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-gray-700">أشهر الخسارة (2)</span>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">نوف، يناير</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-gray-700">أشهر الربح (5)</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">ديسمبر، فبراير، مارس، أبريل، مايو</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-gray-700">نقطة التعادل</span>
                          <span className="text-sm text-gray-600">ديسمبر</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Net Profit Analysis */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                تحليل صافي الربح
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Worst Case Net Profit */}
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      صافي الربح في أسوأ الحالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-red-100">
                        <span className="text-lg font-semibold text-gray-900">إجمالي الإيرادات (7 أشهر)</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-lg">
                          {formatCurrency(27659185)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-red-100">
                        <span className="text-lg font-semibold text-gray-900">إجمالي الاستثمار</span>
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-lg">
                          -{formatCurrency(3534300)}
                        </Badge>
                      </div>
                      <hr className="border-gray-300" />
                      <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-xl font-bold text-gray-900">صافي الربح</span>
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xl font-bold">
                          {formatCurrency(27659185 - 3534300)}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                        <p className="text-sm text-gray-600 mb-1">هامش صافي الربح</p>
                        <p className="text-2xl font-bold text-red-600">
                          {(((27659185 - 3534300) / 3534300) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Best Case Net Profit */}
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      صافي الربح في أفضل الحالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-green-100">
                        <span className="text-lg font-semibold text-gray-900">إجمالي الإيرادات (7 أشهر)</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-lg">
                          {formatCurrency(45372785)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-green-100">
                        <span className="text-lg font-semibold text-gray-900">إجمالي الاستثمار</span>
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-lg">
                          -{formatCurrency(3534300)}
                        </Badge>
                      </div>
                      <hr className="border-gray-300" />
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-xl font-bold text-gray-900">صافي الربح</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xl font-bold">
                          {formatCurrency(45372785 - 3534300)}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">هامش صافي الربح</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(((45372785 - 3534300) / 3534300) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Net Profit Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    ملخص صافي الربح
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-white rounded-lg border border-red-200">
                      <h4 className="font-semibold text-gray-900 mb-2">صافي الربح في أسوأ الحالات</h4>
                      <p className="text-3xl font-bold text-red-600 mb-2">{formatCurrency(27659185 - 3534300)}</p>
                      <p className="text-sm text-red-500">{(((27659185 - 3534300) / 3534300) * 100).toFixed(1)}% عائد على الاستثمار</p>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">صافي الربح في أفضل الحالات</h4>
                      <p className="text-3xl font-bold text-green-600 mb-2">{formatCurrency(45372785 - 3534300)}</p>
                      <p className="text-sm text-green-500">{(((45372785 - 3534300) / 3534300) * 100).toFixed(1)}% عائد على الاستثمار</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Investment Proposal */}
          <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                اقتراح الاستثمار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Investment Structure */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Direct Investment */}
                <Card className="bg-white border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      الاستثمار المباشر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-2xl font-bold text-blue-800 mb-2">3,534,300 جنيه</h4>
                        <p className="text-blue-600 font-semibold">الاستثمار المباشر</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">الحصة المالية</span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                            33%
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">تقييم الشركة</span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                            10,710,000 جنيه
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">غرض الاستثمار</span>
                          <span className="text-sm text-gray-600">العمليات الأولية والإعداد</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Loan Facility */}
                <Card className="bg-white border-green-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      مرفق القرض
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-2xl font-bold text-green-800 mb-2">1,800,000 جنيه</h4>
                        <p className="text-green-600 font-semibold">قرض رأس المال العامل</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">مدة القرض</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            6 أشهر
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">الصرف</span>
                          <span className="text-sm text-gray-600">بعد 3 أشهر</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">الغرض</span>
                          <span className="text-sm text-gray-600">التدفق النقدي لتوليد العملاء المحتملين</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">السداد</span>
                          <span className="text-sm text-gray-600">بعد 3 أشهر</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Investment Terms Summary */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    ملخص شروط الاستثمار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-white rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2">إجمالي الاستثمار</h4>
                      <p className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(3534300)}</p>
                      <p className="text-sm text-blue-500">إجمالي الاستثمار</p>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">الحصة المالية</h4>
                      <p className="text-3xl font-bold text-green-600 mb-2">33%</p>
                      <p className="text-sm text-green-500">ملكية الشركة</p>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-gray-900 mb-2">تقييم الشركة</h4>
                      <p className="text-3xl font-bold text-purple-600 mb-2">{formatCurrency(10710000)}</p>
                      <p className="text-sm text-purple-500">التقييم قبل الاستثمار</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">الجدول الزمني للاستثمار</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">الشهر 0: الاستثمار المباشر</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          {formatCurrency(3534300)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">الشهر 3: صرف القرض</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          {formatCurrency(1800000)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">الشهر 6: سداد القرض</span>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                          {formatCurrency(1800000)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Investment Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2 text-xl sm:text-2xl">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                ملخص فرصة الاستثمار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-white rounded-lg hover:bg-blue-50 transition-all duration-300 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">الاستثمار المباشر</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{formatCurrency(3534300)}</p>
                  <p className="text-xs sm:text-sm text-blue-500">33% حصة ملكية</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-white rounded-lg hover:bg-green-50 transition-all duration-300 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">قرض رأس المال العامل</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{formatCurrency(1800000)}</p>
                  <p className="text-xs sm:text-sm text-green-500">مدة 6 أشهر</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-white rounded-lg hover:bg-orange-50 transition-all duration-300 border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">صافي الربح في أسوأ الحالات</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">{formatCurrency(27659185 - 3534300)}</p>
                  <p className="text-xs sm:text-sm text-orange-500">توقع 7 أشهر</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-white rounded-lg hover:bg-purple-50 transition-all duration-300 border border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">صافي الربح في أفضل الحالات</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{formatCurrency(45372785 - 3534300)}</p>
                  <p className="text-xs sm:text-sm text-purple-500">توقع 7 أشهر</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center py-4 sm:py-6 bg-white rounded-lg border border-blue-200">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">شروط الاستثمار</h4>
                  <div className="space-y-2">
                    <p className="text-gray-700 text-sm sm:text-base">• 33% حصة ملكية مقابل {formatCurrency(3534300)}</p>
                    <p className="text-gray-700 text-sm sm:text-base">• {formatCurrency(1800000)} قرض بعد 3 أشهر</p>
                    <p className="text-gray-700 text-sm sm:text-base">• تقييم الشركة: {formatCurrency(10710000)}</p>
                  </div>
                </div>
                <div className="text-center py-4 sm:py-6 bg-white rounded-lg border border-green-200">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">فرصة السوق</h4>
                  <div className="space-y-2">
                    <p className="text-gray-700 text-sm sm:text-base">• الهدف: 1% من سوق العقارات المصري</p>
                    <p className="text-gray-700 text-sm sm:text-base">• الربح الإجمالي الشهري: {formatCurrency(7074672)}</p>
                    <p className="text-gray-700 text-sm sm:text-base">• حجم السوق النشط: 160,788 وسيط</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvestorFundingPage;
