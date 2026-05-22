import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Edit, Trash2, Eye } from 'lucide-react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ScrambleText } from '@/components/ScrambleText';

interface LivestreamVideo {
  id: string;
  title: string;
  x_broadcast_url: string;
  preview_image_url: string | null;
  description: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

const Livestream: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<LivestreamVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('livestream_videos')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVideos(data || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setIsLoading(false);
        setPageLoaded(true);
      }
    };

    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, is_superadmin')
            .eq('id', user.id)
            .single();
          
          setIsAdmin(profile?.is_admin || profile?.is_superadmin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    fetchVideos();
    checkAdminStatus();
  }, []);

  const extractVideoId = (url: string): string | null => {
    // Extract video ID from X broadcast URL
    const match = url.match(/\/broadcasts\/([^/?]+)/);
    return match ? match[1] : null;
  };

  const getPreviewImage = (url: string): string => {
    const videoId = extractVideoId(url);
    if (!videoId) return '/api/placeholder/400/225';
    
    // Use X's thumbnail API or fallback to placeholder
    return `https://ton.twitter.com/1.1/ton/data/dm/broadcast/${videoId}/thumb_128x128.jpg`;
  };

  const handleWatchVideo = (video: LivestreamVideo) => {
    // Open the X broadcast in a new tab
    window.open(video.x_broadcast_url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-[#0C0E12] min-h-screen relative">
        <Header />
        <main className="w-full pt-4 pb-8 sm:pt-6 sm:pb-12 lg:pt-12 lg:pb-24">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75E0A7]"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#0C0E12] min-h-screen relative">
      <Header />
      
      <main className="w-full pt-4 pb-8 sm:pt-6 sm:pb-12 lg:pt-12 lg:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <ScrambleText 
                as="h1" 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F7F7] mb-2"
                duration={1.0}
                delay={0.2}
                triggerOnce={true}
                trigger={pageLoaded}
              >
                Live Streams
              </ScrambleText>
              <ScrambleText 
                as="p" 
                className="text-sm sm:text-base text-[#94979C]"
                duration={0.8}
                delay={0.5}
                triggerOnce={true}
                trigger={pageLoaded}
              >
                Watch live streams and recorded broadcasts from our community
              </ScrambleText>
            </div>
            
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin/livestream')}
                className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Videos
              </Button>
            )}
          </div>

          {/* Videos Grid */}
          {videos.length === 0 ? (
            <div className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-8 text-center">
              <Eye className="w-12 h-12 text-[#94979C] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#F7F7F7] mb-2">No Videos Available</h3>
              <p className="text-[#94979C]">Check back later for new live streams and recordings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl overflow-hidden hover:border-[#75E0A7]/50 transition-all duration-300 group"
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-[#181B20]">
                    <img
                      src={video.preview_image_url || getPreviewImage(video.x_broadcast_url)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/400/225';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        onClick={() => handleWatchVideo(video)}
                        size="sm"
                        className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Watch Now
                      </Button>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-[#F7F7F7] mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-[#94979C] mb-4 line-clamp-3">
                        {video.description}
                      </p>
                    )}
                    <Button
                      onClick={() => handleWatchVideo(video)}
                      className="w-full bg-[#22262F] text-[#F7F7F7] hover:bg-[#2A3037] border border-[#373A41]"
                      variant="outline"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Livestream;