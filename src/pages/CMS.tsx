import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Edit } from "lucide-react";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { AdminDataTable } from "@/components/AdminDataTable";
import Header from "@/components/Header";

type Banner = Tables<"banners">;

const CMS = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    description: "",
    is_active: true,
    order_index: 0,
  });

  const handleEdit = (id: string) => {
    navigate(`/admin/add?edit=${id}`);
  };

  // Fetch banners
  const { data: banners = [], isLoading: bannersLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (banner: TablesInsert<"banners">) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(banner)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Banner created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Error creating banner", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"banners"> }) => {
      const { data, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Banner updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Error updating banner", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Banner deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting banner", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('asset-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('asset-logos')
        .getPublicUrl(filePath);

      setBannerForm(prev => ({ ...prev, image_url: publicUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ 
        title: "Error uploading image", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bannerForm.title || !bannerForm.image_url) {
      toast({ 
        title: "Missing required fields", 
        description: "Title and image are required", 
        variant: "destructive" 
      });
      return;
    }

    if (editingBanner) {
      updateBannerMutation.mutate({ 
        id: editingBanner.id, 
        updates: bannerForm 
      });
    } else {
      createBannerMutation.mutate(bannerForm);
    }
  };

  const handleBannerEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      description: banner.description || "",
      is_active: banner.is_active,
      order_index: banner.order_index,
    });
  };

  const resetForm = () => {
    setEditingBanner(null);
    setBannerForm({
      title: "",
      image_url: "",
      link_url: "",
      description: "",
      is_active: true,
      order_index: 0,
    });
  };

  return (
    <div className="bg-[#0C0E12] min-h-screen">
      <Header />
      
      <main className="w-full pt-12 pb-24 rounded-[40px_0px_0px_40px] max-md:max-w-full">
        <section className="flex w-full flex-col items-center max-md:max-w-full">
          <div className="max-w-screen-xl w-full text-2xl text-[#F7F7F7] font-semibold leading-none pr-[var(--container-padding-desktop,] pl-[var(--container-padding-desktop,] gap-5 pt-0 pb-[32px)] max-md:max-w-full max-md:px-5">
            <div className="w-full gap-4 max-md:max-w-full">
              <div className="content-start flex-wrap flex w-full gap-[20px)_var(--spacing-xl,16px;] max-md:max-w-full justify-between items-center">
                <h1 className="text-[#F7F7F7] text-2xl leading-[32px)]">
                  Content Management System
                </h1>
              </div>
            </div>
          </div>

          <div className="max-w-screen-xl w-full px-[var(--container-padding-desktop,] max-md:px-5">
            <Tabs defaultValue="database" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#22262F] border-[#373A41]">
                <TabsTrigger 
                  value="database"
                  className="data-[state=active]:bg-[#373A41] data-[state=active]:text-[#F7F7F7] text-[#94979C] hover:text-[#F7F7F7]"
                >
                  Database Management
                </TabsTrigger>
                <TabsTrigger 
                  value="banners"
                  className="data-[state=active]:bg-[#373A41] data-[state=active]:text-[#F7F7F7] text-[#94979C] hover:text-[#F7F7F7]"
                >
                  Banner Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="database" className="mt-6">
                <div className="bg-[#0C0E12] rounded-lg">
                  <AdminDataTable onEdit={handleEdit} />
                </div>
              </TabsContent>

              <TabsContent value="banners" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Banner Form */}
                  <Card className="bg-[#1A1D23] border-[#373A41]">
                    <CardHeader>
                      <CardTitle className="text-[#F7F7F7]">{editingBanner ? "Edit Banner" : "Create New Banner"}</CardTitle>
                      <CardDescription className="text-[#94979C]">
                        {editingBanner ? "Update existing banner" : "Add a new banner to the homepage"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="title" className="text-[#F7F7F7]">Title *</Label>
                          <Input
                            id="title"
                            value={bannerForm.title}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter banner title"
                            className="bg-[#22262F] border-[#373A41] text-[#F7F7F7] placeholder:text-[#94979C]"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="image" className="text-[#F7F7F7]">Banner Image *</Label>
                          <div className="space-y-2">
                            <Input
                              id="image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                              className="bg-[#22262F] border-[#373A41] text-[#F7F7F7] file:bg-[#373A41] file:text-[#F7F7F7] file:border-0"
                            />
                            {isUploading && (
                              <div className="flex items-center gap-2 text-sm text-[#94979C]">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                              </div>
                            )}
                            {bannerForm.image_url && (
                              <div className="relative">
                                <img 
                                  src={bannerForm.image_url} 
                                  alt="Banner preview" 
                                  className="h-32 w-full object-cover rounded border border-[#373A41]"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="link_url" className="text-[#F7F7F7]">Link URL (Optional)</Label>
                          <Input
                            id="link_url"
                            value={bannerForm.link_url}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, link_url: e.target.value }))}
                            placeholder="https://example.com"
                            type="url"
                            className="bg-[#22262F] border-[#373A41] text-[#F7F7F7] placeholder:text-[#94979C]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-[#F7F7F7]">Description</Label>
                          <Textarea
                            id="description"
                            value={bannerForm.description}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional description"
                            rows={3}
                            className="bg-[#22262F] border-[#373A41] text-[#F7F7F7] placeholder:text-[#94979C]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="order_index" className="text-[#F7F7F7]">Order Index</Label>
                          <Input
                            id="order_index"
                            type="number"
                            value={bannerForm.order_index}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                            className="bg-[#22262F] border-[#373A41] text-[#F7F7F7] placeholder:text-[#94979C]"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active"
                            checked={bannerForm.is_active}
                            onCheckedChange={(checked) => setBannerForm(prev => ({ ...prev, is_active: checked }))}
                          />
                          <Label htmlFor="is_active" className="text-[#F7F7F7]">Active</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
                            className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90 font-semibold"
                          >
                            {(createBannerMutation.isPending || updateBannerMutation.isPending) && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingBanner ? "Update Banner" : "Create Banner"}
                          </Button>
                          {editingBanner && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={resetForm}
                              className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Banner List */}
                  <Card className="bg-[#1A1D23] border-[#373A41]">
                    <CardHeader>
                      <CardTitle className="text-[#F7F7F7]">Existing Banners</CardTitle>
                      <CardDescription className="text-[#94979C]">Manage your homepage banners</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {bannersLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-[#75E0A7]" />
                        </div>
                      ) : banners.length === 0 ? (
                        <p className="text-[#94979C] text-center py-8">No banners created yet</p>
                      ) : (
                        <div className="space-y-4">
                          {banners.map((banner) => (
                            <div key={banner.id} className="border border-[#373A41] rounded-lg p-4 bg-[#22262F]">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-[#F7F7F7]">{banner.title}</h3>
                                  {banner.description && (
                                    <p className="text-sm text-[#94979C] mt-1">{banner.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-sm text-[#94979C]">
                                    <span>Order: {banner.order_index}</span>
                                    <span className={banner.is_active ? "text-[#75E0A7]" : "text-red-400"}>
                                      {banner.is_active ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBannerEdit(banner)}
                                    className="border-[#373A41] text-[#CECFD2] hover:bg-[#373A41] hover:text-[#F7F7F7] bg-transparent"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteBannerMutation.mutate(banner.id)}
                                    disabled={deleteBannerMutation.isPending}
                                    className="border-red-600/50 text-red-400 hover:bg-red-600/20 hover:text-red-300 bg-transparent"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {banner.image_url && (
                                <img 
                                  src={banner.image_url} 
                                  alt={banner.title}
                                  className="h-20 w-full object-cover rounded mt-3 border border-[#373A41]"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CMS;