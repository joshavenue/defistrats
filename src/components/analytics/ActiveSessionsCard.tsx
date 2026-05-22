import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wifi } from 'lucide-react';
import { getActiveSessions } from '@/lib/analytics';

const ActiveSessionsCard: React.FC = () => {
  const [isLive, setIsLive] = useState(true);

  const { data: activeSessions, isLoading } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: getActiveSessions,
    refetchInterval: isLive ? 10000 : false, // Refresh every 10 seconds when live
    refetchIntervalInBackground: true,
  });

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  return (
    <Card className="bg-[#181B20] border-[#22262F]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#94979C] flex items-center gap-2">
          Active Users
          <button
            onClick={toggleLive}
            className={`p-1 rounded-full transition-colors ${
              isLive 
                ? 'bg-[#75E0A7] text-[#0C0E12]' 
                : 'bg-[#22262F] text-[#94979C] hover:bg-[#2A2F3A]'
            }`}
            title={isLive ? 'Live updates enabled' : 'Live updates disabled'}
          >
            <Wifi className="h-3 w-3" />
          </button>
        </CardTitle>
        <Users className="h-4 w-4 text-[#75E0A7]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#F7F7F7]">
          {isLoading ? '...' : activeSessions?.toLocaleString()}
        </div>
        <p className="text-xs text-[#94979C] mt-1">
          {isLive ? (
            <>
              <span className="inline-block w-2 h-2 bg-[#75E0A7] rounded-full mr-1 animate-pulse"></span>
              Live (updates every 10s)
            </>
          ) : (
            'Live updates paused'
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default ActiveSessionsCard;