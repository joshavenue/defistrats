import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface VideoForm {
  title: string;
  x_broadcast_url: string;
  preview_image_url: string;
  description: string;
}

const VIDEO_PLACEHOLDER_IMAGE = '/placeholder.svg';

const AdminLivestream: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<LivestreamVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<LivestreamVideo | null>(null);
  const [formData, setFormData] = useState<VideoForm>({
    title: '',
    x_broadcast_url: '',
    preview_image_url: '',
    description: ''
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('livestream_videos')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to fetch videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.x_broadcast_url.trim()) {
      toast.error('Title and URL are required');
      return;
    }

    // Validate X broadcast URL format
    if (!formData.x_broadcast_url.includes('x.com/i/broadcasts/') && !formData.x_broadcast_url.includes('twitter.com/i/broadcasts/')) {
      toast.error('Please enter a valid X broadcast URL');
      return;
    }

    setIsLoading(true);

    try {
      const videoData = {
        title: formData.title.trim(),
        x_broadcast_url: formData.x_broadcast_url.trim(),
        preview_image_url: formData.preview_image_url.trim() || null,
        description: formData.description.trim() || null,
        is_active: true,
        order_index: videos.length
      };

      if (editingVideo) {
        const { error } = await supabase
          .from('livestream_videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
        toast.success('Video updated successfully');
      } else {
        const { error } = await supabase
          .from('livestream_videos')
          .insert([videoData]);

        if (error) throw error;
        toast.success('Video added successfully');
      }

      resetForm();
      fetchVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Failed to save video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (video: LivestreamVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      x_broadcast_url: video.x_broadcast_url,
      preview_image_url: video.preview_image_url || '',
      description: video.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (video: LivestreamVideo) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('livestream_videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;
      toast.success('Video deleted successfully');
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };

  const toggleVisibility = async (video: LivestreamVideo) => {
    try {
      const { error } = await supabase
        .from('livestream_videos')
        .update({ is_active: !video.is_active })
        .eq('id', video.id);

      if (error) throw error;
      toast.success(`Video ${video.is_active ? 'hidden' : 'shown'} successfully`);
      fetchVideos();
    } catch (error) {
      console.error('Error updating video visibility:', error);
      toast.error('Failed to update video visibility');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      x_broadcast_url: '',
      preview_image_url: '',
      description: ''
    });
    setEditingVideo(null);
    setShowForm(false);
  };

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/\/broadcasts\/([^/?]+)/);
    return match ? match[1] : null;
  };

  const getPreviewImage = (video: LivestreamVideo): string => {
    if (video.preview_image_url) return video.preview_image_url;
    
    const videoId = extractVideoId(video.x_broadcast_url);
    if (!videoId) return VIDEO_PLACEHOLDER_IMAGE;
    
    return `https://ton.twitter.com/1.1/ton/data/dm/broadcast/${videoId}/thumb_128x128.jpg`;
  };

  return (
    <div className="bg-[#0C0E12] min-h-screen relative">
      <Header />
      
      <main className="w-full pt-4 pb-8 sm:pt-6 sm:pb-12 lg:pt-12 lg:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/livestream')}
                className="flex items-center gap-2 text-[#94979C] hover:text-[#F7F7F7] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Livestream
              </button>
              <h1 className="text-2xl font-bold text-[#F7F7F7]">Manage Live Stream Videos</h1>
            </div>
            
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90"
            >
              {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {showForm ? 'Cancel' : 'Add Video'}
            </Button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-[#F7F7F7] mb-4">
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#F7F7F7] mb-2">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter video title"
                    className="bg-[#181B20] border-[#22262F] text-[#F7F7F7]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F7F7F7] mb-2">
                    X Broadcast URL *
                  </label>
                  <Input
                    value={formData.x_broadcast_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, x_broadcast_url: e.target.value }))}
                    placeholder="https://x.com/i/broadcasts/1dRKZYZAVBQxB"
                    className="bg-[#181B20] border-[#22262F] text-[#F7F7F7]"
                    required
                  />
                  <p className="text-xs text-[#94979C] mt-1">
                    Paste the full X broadcast URL (e.g., https://x.com/i/broadcasts/1dRKZYZAVBQxB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F7F7F7] mb-2">
                    Custom Preview Image URL (optional)
                  </label>
                  <Input
                    value={formData.preview_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, preview_image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="bg-[#181B20] border-[#22262F] text-[#F7F7F7]"
                  />
                  <p className="text-xs text-[#94979C] mt-1">
                    Leave empty to use automatic preview from X
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F7F7F7] mb-2">
                    Description (optional)
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter video description"
                    className="bg-[#181B20] border-[#22262F] text-[#F7F7F7]"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingVideo ? 'Update Video' : 'Add Video'}
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="border-[#373A41] text-[#94979C] hover:text-[#F7F7F7]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Videos List */}
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-4 flex items-center gap-4"
              >
                {/* Preview */}
                <div className="w-24 h-14 bg-[#181B20] rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getPreviewImage(video)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = VIDEO_PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#F7F7F7] truncate">{video.title}</h3>
                  <p className="text-sm text-[#94979C] truncate">{video.x_broadcast_url}</p>
                  {video.description && (
                    <p className="text-sm text-[#94979C] truncate">{video.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => toggleVisibility(video)}
                    size="sm"
                    variant="outline"
                    className="border-[#373A41] text-[#94979C] hover:text-[#F7F7F7]"
                  >
                    {video.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => handleEdit(video)}
                    size="sm"
                    variant="outline"
                    className="border-[#373A41] text-[#94979C] hover:text-[#F7F7F7]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(video)}
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {videos.length === 0 && !isLoading && (
              <div className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-8 text-center">
                <h3 className="text-lg font-semibold text-[#F7F7F7] mb-2">No Videos Found</h3>
                <p className="text-[#94979C] mb-4">Start by adding your first livestream video.</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminLivestream;
