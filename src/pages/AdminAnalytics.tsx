import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { CalendarDays, MousePointer, Users, Eye, Wallet } from 'lucide-react';
import ActiveSessionsCard from '@/components/analytics/ActiveSessionsCard';
import RefRewardTab from '@/components/analytics/RefRewardTab';

interface AnalyticsData {
  totalPageViews: number;
  totalLinkClicks: number;
  uniqueVisitors: number;
  topPages: { page_path: string; count: number }[];
  topLinks: { link_url: string; link_type: string; count: number }[];
  dailyViews: { date: string; views: number }[];
  clicksByType: { type: string; count: number }[];
}

const AdminAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: async (): Promise<AnalyticsData> => {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get total page views
      const { count: totalPageViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Get total link clicks
      const { count: totalLinkClicks } = await supabase
        .from('link_clicks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Get unique visitors (unique session_ids)
      const { data: uniqueSessionsData } = await supabase
        .from('page_views')
        .select('session_id')
        .gte('created_at', startDate.toISOString());
      
      const uniqueVisitors = new Set(uniqueSessionsData?.map(row => row.session_id) || []).size;

      // Get top pages
      const { data: topPagesData } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', startDate.toISOString());
      
      const pageMap = new Map();
      topPagesData?.forEach(row => {
        pageMap.set(row.page_path, (pageMap.get(row.page_path) || 0) + 1);
      });
      const topPages = Array.from(pageMap.entries())
        .map(([page_path, count]) => ({ page_path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get top links
      const { data: topLinksData } = await supabase
        .from('link_clicks')
        .select('link_url, link_type')
        .gte('created_at', startDate.toISOString());
      
      const linkMap = new Map();
      topLinksData?.forEach(row => {
        const key = `${row.link_url}|${row.link_type}`;
        linkMap.set(key, (linkMap.get(key) || 0) + 1);
      });
      const topLinks = Array.from(linkMap.entries())
        .map(([key, count]) => {
          const [link_url, link_type] = key.split('|');
          return { link_url, link_type, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get daily views for chart
      const { data: dailyViewsData } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at');
      
      const dailyMap = new Map();
      dailyViewsData?.forEach(row => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      });
      const dailyViews = Array.from(dailyMap.entries())
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Get clicks by type
      const typeMap = new Map();
      topLinksData?.forEach(row => {
        typeMap.set(row.link_type, (typeMap.get(row.link_type) || 0) + 1);
      });
      const clicksByType = Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }));

      return {
        totalPageViews: totalPageViews || 0,
        totalLinkClicks: totalLinkClicks || 0,
        uniqueVisitors,
        topPages,
        topLinks,
        dailyViews,
        clicksByType
      };
    }
  });

  const COLORS = ['#75E0A7', '#94A3B8', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (isLoading) {
    return (
      <div className="bg-[#0C0E12] min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="text-[#F7F7F7] text-center py-8">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0C0E12] min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="text-red-400 text-center py-8">Error loading analytics data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0C0E12] min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#F7F7F7] mb-6">Analytics Dashboard</h1>
          
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#22262F] border border-[#373A41]">
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-[#75E0A7] data-[state=active]:text-[#0C0E12] text-[#F7F7F7]"
              >
                <Eye className="w-4 h-4 mr-2" />
                Site Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="ref-reward" 
                className="data-[state=active]:bg-[#75E0A7] data-[state=active]:text-[#0C0E12] text-[#F7F7F7]"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Ref Reward
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-[#F7F7F7]">Site Performance</h2>
                <div className="flex gap-2">
                  {['7d', '30d', '90d'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        dateRange === range
                          ? 'bg-[#75E0A7] text-[#0C0E12]'
                          : 'bg-[#22262F] text-[#F7F7F7] hover:bg-[#2A2F3A]'
                      }`}
                    >
                      {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>
              </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <ActiveSessionsCard />
            
            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#94979C]">Total Page Views</CardTitle>
                <Eye className="h-4 w-4 text-[#75E0A7]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#F7F7F7]">{analytics?.totalPageViews?.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#94979C]">Link Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-[#75E0A7]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#F7F7F7]">{analytics?.totalLinkClicks?.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#94979C]">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-[#75E0A7]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#F7F7F7]">{analytics?.uniqueVisitors?.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#94979C]">Avg. Daily Views</CardTitle>
                <CalendarDays className="h-4 w-4 text-[#75E0A7]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#F7F7F7]">
                  {Math.round((analytics?.totalPageViews || 0) / parseInt(dateRange.replace('d', '')))}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader>
                <CardTitle className="text-[#F7F7F7]">Daily Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22262F" />
                    <XAxis dataKey="date" stroke="#94979C" />
                    <YAxis stroke="#94979C" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#22262F', 
                        border: '1px solid #373A41',
                        borderRadius: '8px',
                        color: '#F7F7F7'
                      }} 
                    />
                    <Line type="monotone" dataKey="views" stroke="#75E0A7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader>
                <CardTitle className="text-[#F7F7F7]">Clicks by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.clicksByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics?.clicksByType?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#22262F', 
                        border: '1px solid #373A41',
                        borderRadius: '8px',
                        color: '#F7F7F7'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader>
                <CardTitle className="text-[#F7F7F7]">Top Pages</CardTitle>
                <CardDescription className="text-[#94979C]">Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.topPages?.map((page, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-[#22262F] last:border-0">
                      <span className="text-[#F7F7F7] truncate">{page.page_path}</span>
                      <span className="text-[#75E0A7] font-medium">{page.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#181B20] border-[#22262F]">
              <CardHeader>
                <CardTitle className="text-[#F7F7F7]">Top Links</CardTitle>
                <CardDescription className="text-[#94979C]">Most clicked links</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.topLinks?.map((link, index) => (
                    <div key={index} className="py-2 border-b border-[#22262F] last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[#F7F7F7] truncate text-sm">{link.link_url}</span>
                        <span className="text-[#75E0A7] font-medium">{link.count}</span>
                      </div>
                      <div className="text-xs text-[#94979C] mt-1">Type: {link.link_type}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </div>
            </TabsContent>

            <TabsContent value="ref-reward" className="mt-6">
              <RefRewardTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
