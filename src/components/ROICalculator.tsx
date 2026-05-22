import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface ROICalculatorProps {
  apy: number;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({ apy }) => {
  const [investmentType, setInvestmentType] = useState<'lumpsum' | 'dca'>('lumpsum');
  const [initialInvestment, setInitialInvestment] = useState<string>('1000');
  const [monthlyInvestment, setMonthlyInvestment] = useState<string>('100');
  const [investmentPeriod, setInvestmentPeriod] = useState<string>('12');

  // Calculate returns
  const calculations = useMemo(() => {
    const initial = parseFloat(initialInvestment) || 0;
    const monthly = parseFloat(monthlyInvestment) || 0;
    const months = Math.min(parseInt(investmentPeriod) || 12, 360); // Cap at 30 years
    const monthlyRate = apy / 100 / 12;

    const data = [];
    let totalInvested = 0;
    let totalValue = 0;

    for (let month = 0; month <= months; month++) {
      if (investmentType === 'lumpsum') {
        // Lump sum investment
        totalInvested = initial;
        totalValue = initial * Math.pow(1 + monthlyRate, month);
      } else {
        // DCA investment
        totalInvested = initial + (monthly * month);
        
        // Calculate value with compound interest
        // Initial investment grows for all months
        let value = initial * Math.pow(1 + monthlyRate, month);
        
        // Each monthly investment grows for remaining months
        for (let i = 1; i <= month; i++) {
          value += monthly * Math.pow(1 + monthlyRate, month - i);
        }
        
        totalValue = value;
      }

      const roi = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
      const profit = totalValue - totalInvested;

      data.push({
        month,
        invested: Math.round(totalInvested),
        value: Math.round(totalValue),
        profit: Math.round(profit),
        roi: Math.round(roi * 100) / 100
      });
    }

    const finalData = data[data.length - 1];
    const totalReturn = finalData.value - finalData.invested;
    const totalROI = finalData.roi;

    return {
      chartData: data,
      totalInvested: finalData.invested,
      totalValue: finalData.value,
      totalReturn,
      totalROI,
      monthlyGrowthRate: monthlyRate * 100
    };
  }, [investmentType, initialInvestment, monthlyInvestment, investmentPeriod, apy]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181B20] border border-[#22262F] rounded-lg p-3 shadow-lg">
          <p className="text-[#94979C] text-xs mb-1">Month {label}</p>
          <p className="text-[#F7F7F7] text-sm font-medium">
            Value: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-[#94979C] text-sm">
            Invested: {formatCurrency(payload[1].value)}
          </p>
          <p className="text-[#75E0A7] text-sm">
            ROI: {payload[0].payload.roi}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#75E0A7]" />
          <h2 className="text-base sm:text-lg font-semibold text-[#F7F7F7]">ROI Calculator</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setInvestmentPeriod('6')}
            className={`text-xs px-2 py-1 rounded ${investmentPeriod === '6' ? 'bg-[#75E0A7] text-[#0C0E12]' : 'bg-[#22262F] text-[#94979C] hover:text-[#F7F7F7]'} transition-colors`}
          >
            6M
          </button>
          <button
            onClick={() => setInvestmentPeriod('12')}
            className={`text-xs px-2 py-1 rounded ${investmentPeriod === '12' ? 'bg-[#75E0A7] text-[#0C0E12]' : 'bg-[#22262F] text-[#94979C] hover:text-[#F7F7F7]'} transition-colors`}
          >
            1Y
          </button>
          <button
            onClick={() => setInvestmentPeriod('24')}
            className={`text-xs px-2 py-1 rounded ${investmentPeriod === '24' ? 'bg-[#75E0A7] text-[#0C0E12]' : 'bg-[#22262F] text-[#94979C] hover:text-[#F7F7F7]'} transition-colors`}
          >
            2Y
          </button>
          <button
            onClick={() => setInvestmentPeriod('60')}
            className={`text-xs px-2 py-1 rounded ${investmentPeriod === '60' ? 'bg-[#75E0A7] text-[#0C0E12]' : 'bg-[#22262F] text-[#94979C] hover:text-[#F7F7F7]'} transition-colors`}
          >
            5Y
          </button>
        </div>
      </div>

      <Tabs value={investmentType} onValueChange={(v) => setInvestmentType(v as 'lumpsum' | 'dca')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="lumpsum" className="data-[state=active]:bg-[#22262F] data-[state=active]:text-[#F7F7F7]">
            Lump Sum
          </TabsTrigger>
          <TabsTrigger value="dca" className="data-[state=active]:bg-[#22262F] data-[state=active]:text-[#F7F7F7]">
            DCA (Monthly)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lumpsum" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial-lumpsum" className="text-sm text-[#CECFD2]">Initial Investment</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94979C]" />
                <Input
                  id="initial-lumpsum"
                  type="number"
                  min="0"
                  step="100"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(e.target.value)}
                  className="pl-10 bg-[#0C0E12] border-[#373A41] text-[#F7F7F7]"
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-lumpsum" className="text-sm text-[#CECFD2]">Investment Period (Months)</Label>
              <Input
                id="period-lumpsum"
                type="number"
                min="1"
                max="360"
                value={investmentPeriod}
                onChange={(e) => setInvestmentPeriod(e.target.value)}
                className="bg-[#0C0E12] border-[#373A41] text-[#F7F7F7]"
                placeholder="12"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dca" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial-dca" className="text-sm text-[#CECFD2]">Initial Investment</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94979C]" />
                <Input
                  id="initial-dca"
                  type="number"
                  min="0"
                  step="100"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(e.target.value)}
                  className="pl-10 bg-[#0C0E12] border-[#373A41] text-[#F7F7F7]"
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly" className="text-sm text-[#CECFD2]">Monthly Investment</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94979C]" />
                <Input
                  id="monthly"
                  type="number"
                  min="0"
                  step="50"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(e.target.value)}
                  className="pl-10 bg-[#0C0E12] border-[#373A41] text-[#F7F7F7]"
                  placeholder="100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-dca" className="text-sm text-[#CECFD2]">Period (Months)</Label>
              <Input
                id="period-dca"
                type="number"
                min="1"
                max="360"
                value={investmentPeriod}
                onChange={(e) => setInvestmentPeriod(e.target.value)}
                className="bg-[#0C0E12] border-[#373A41] text-[#F7F7F7]"
                placeholder="12"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Results Summary */}
      <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
        <div className="bg-[#181B20]/80 border border-[#22262F] rounded-lg p-3">
          <p className="text-xs text-[#94979C] mb-1">Total Invested</p>
          <p className="text-sm sm:text-base font-semibold text-[#F7F7F7]">
            {formatCurrency(calculations.totalInvested)}
          </p>
        </div>
        <div className="bg-[#181B20]/80 border border-[#22262F] rounded-lg p-3">
          <p className="text-xs text-[#94979C] mb-1">Final Value</p>
          <p className="text-sm sm:text-base font-semibold text-[#F7F7F7]">
            {formatCurrency(calculations.totalValue)}
          </p>
        </div>
        <div className="bg-[#181B20]/80 border border-[#22262F] rounded-lg p-3">
          <p className="text-xs text-[#94979C] mb-1">Total Return</p>
          <p className="text-sm sm:text-base font-semibold text-[#75E0A7]">
            {formatCurrency(calculations.totalReturn)}
          </p>
        </div>
        <div className="bg-[#181B20]/80 border border-[#22262F] rounded-lg p-3">
          <p className="text-xs text-[#94979C] mb-1">ROI</p>
          <p className="text-sm sm:text-base font-semibold text-[#75E0A7]">
            {calculations.totalROI}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80 -mx-2 sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={calculations.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#75E0A7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#75E0A7" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94979C" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#94979C" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#22262F" />
            <XAxis 
              dataKey="month" 
              stroke="#94979C"
              tick={{ fill: '#94979C', fontSize: 12 }}
              axisLine={{ stroke: '#373A41' }}
            />
            <YAxis 
              stroke="#94979C"
              tick={{ fill: '#94979C', fontSize: 12 }}
              axisLine={{ stroke: '#373A41' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#75E0A7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
            <Area
              type="monotone"
              dataKey="invested"
              stroke="#94979C"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInvested)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-xs text-[#94979C] text-center">
          <TrendingUp className="inline-block w-3 h-3 mr-1" />
          Based on {apy}% APY compounded monthly ({calculations.monthlyGrowthRate.toFixed(2)}% monthly)
        </div>
        <div className="bg-[#181B20]/50 border border-[#22262F] rounded-lg p-3">
          <p className="text-xs text-[#94979C] leading-relaxed">
            <span className="font-medium text-[#F7F7F7]">Disclaimer:</span> These calculations are estimates based on the current APY and assume constant returns. Actual returns may vary due to market conditions, protocol changes, and other factors. This is not financial advice. Always do your own research and consult with financial professionals before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};