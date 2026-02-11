import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVideoSchema } from "@shared/schema";
import { useCreateVideo } from "@/hooks/use-videos";
import { useUpload } from "@/hooks/use-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, FileVideo, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const createVideo = useCreateVideo();
  const { uploadFile, progress } = useUpload();

  const form = useForm({
    resolver: zodResolver(insertVideoSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "", // Optional, could add separate upload for this
    }
  });

  const onSubmit = async (data: any) => {
    if (!videoFile) return;

    try {
      setIsUploading(true);
      
      // 1. Upload file to Object Storage
      const uploadRes = await uploadFile(videoFile);
      if (!uploadRes) throw new Error("Upload failed");

      // 2. Create database record
      await createVideo.mutateAsync({
        ...data,
        videoUrl: uploadRes.objectPath,
        userId: "current", // Backend handles this from session
      });

      toast({
        title: "Video Uploaded!",
        description: "Your video is now live.",
      });
      
      onOpenChange(false);
      form.reset();
      setVideoFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">Upload New Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* File Selection Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:bg-muted/10 transition-colors">
            {videoFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileVideo className="w-12 h-12 text-secondary" />
                <p className="font-medium text-white">{videoFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-destructive hover:text-destructive"
                  onClick={() => setVideoFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-white">Drag video here or click to browse</p>
                  <p className="text-xs text-muted-foreground">MP4, WebM up to 500MB</p>
                </div>
                <Input 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  id="video-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setVideoFile(file);
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => document.getElementById('video-upload')?.click()}>
                  Select File
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Give your video a catchy title"
                {...form.register("title")} 
                className="bg-background border-input focus:border-primary"
              />
              {form.formState.errors.title && (
                <p className="text-destructive text-xs flex items-center gap-1">
                  <AlertCircle size={12} /> {form.formState.errors.title.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="What is this video about?"
                {...form.register("description")} 
                className="bg-background border-input focus:border-primary min-h-[100px]"
              />
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={!videoFile || isUploading || createVideo.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg shadow-lg shadow-primary/20"
          >
            {(isUploading || createVideo.isPending) ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload Video"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
