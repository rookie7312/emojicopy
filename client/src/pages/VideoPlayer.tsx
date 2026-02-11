import { useParams } from "wouter";
import { useVideo, useComments, useCreateComment } from "@/hooks/use-videos";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import ReactPlayer from "react-player";
import { ThumbsUp, Share2, Flag, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function VideoPlayer() {
  const { id } = useParams();
  const videoId = Number(id);
  const { data: video, isLoading } = useVideo(videoId);
  const { data: comments, isLoading: commentsLoading } = useComments(videoId);
  const { user } = useAuth();
  const createComment = useCreateComment(videoId);
  const { toast } = useToast();
  
  const [commentText, setCommentText] = useState("");

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      await createComment.mutateAsync(commentText);
      setCommentText("");
      toast({ title: "Comment posted" });
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied to clipboard" });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video w-full rounded-xl bg-card" />
            <Skeleton className="h-8 w-3/4 bg-card" />
            <Skeleton className="h-4 w-1/2 bg-card" />
          </div>
          <div className="space-y-4">
             <Skeleton className="h-32 w-full bg-card rounded-xl" />
             <Skeleton className="h-32 w-full bg-card rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-3xl font-display text-white mb-4">Video Not Found</h1>
          <p className="text-muted-foreground mb-6">The video you are looking for does not exist or has been removed.</p>
          <Button asChild>
            <a href="/">Return Home</a>
          </Button>
        </div>
      </Layout>
    );
  }

  // Construct full video URL if it's a relative path from our Object Storage
  const videoSrc = video.videoUrl.startsWith('http') 
    ? video.videoUrl 
    : `/objects/${video.videoUrl.replace(/^\/+/, '')}`;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="rounded-xl overflow-hidden bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10 relative pt-[56.25%]">
            <ReactPlayer
              url={videoSrc}
              width="100%"
              height="100%"
              controls
              playing
              className="absolute top-0 left-0"
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload'
                  }
                }
              }}
            />
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {video.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-white font-medium">{video.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(video.createdAt!), { addSuffix: true })}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="gap-2">
                  <ThumbsUp size={16} /> {video.likes}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
                  <Share2 size={16} /> Share
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
                  <Flag size={16} /> Report
                </Button>
              </div>
            </div>

            {/* Author & Description */}
            <div className="flex gap-4 p-4 bg-card/30 rounded-xl border border-white/5">
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarImage src={video.author?.profileImageUrl} />
                <AvatarFallback>
                  {video.author?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-white">{video.author?.username || 'Unknown User'}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {video.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-6 pt-4">
            <h3 className="text-xl font-display text-white flex items-center gap-2">
              <MessageSquare className="text-primary" /> 
              Comments <span className="text-muted-foreground text-base font-normal">({comments?.length || 0})</span>
            </h3>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>{user.firstName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a public comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[80px] bg-card border-white/10 focus:border-primary"
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!commentText.trim() || createComment.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {createComment.isPending ? "Posting..." : "Comment"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center bg-card/30 rounded-xl border border-white/5">
                <p className="text-muted-foreground mb-4">Please sign in to leave a comment.</p>
                <Button asChild variant="outline">
                  <a href="/api/login">Sign In</a>
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {commentsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full bg-card rounded-xl" />
                  <Skeleton className="h-20 w-full bg-card rounded-xl" />
                </div>
              ) : comments?.map((comment) => (
                <div key={comment.id} className="flex gap-4 group">
                  <Avatar className="h-10 w-10 border border-white/5">
                    {/* Note: Comment schema needs author joined, simplified here */}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">User</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (Recommendations) */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white">Recommended</h3>
          <div className="space-y-4">
            {/* Placeholder recommendations - in real app would query similar videos */}
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="flex gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                 <div className="relative w-40 aspect-video bg-card rounded-md overflow-hidden">
                   <div className="absolute inset-0 bg-muted/20" />
                   <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[10px] text-white">
                     12:34
                   </div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
                     Suggested Video Title That Might Be Long
                   </h4>
                   <p className="text-xs text-muted-foreground mt-1">Channel Name</p>
                   <p className="text-xs text-muted-foreground">15K views • 2 days ago</p>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
