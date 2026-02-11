import { Link } from "wouter";
import { type VideoResponse } from "@shared/schema";
import { Play, Eye, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VideoCardProps {
  video: VideoResponse;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/video/${video.id}`} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-white/5 shadow-lg transition-all duration-300 group-hover:shadow-primary/20 group-hover:scale-[1.02] group-hover:border-primary/30">
        {/* Thumbnail Image */}
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Play className="text-white/20 w-12 h-12" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-75">
            <Play fill="currentColor" className="ml-1 w-5 h-5" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs font-mono text-white/90">
            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1 px-1">
        <h3 className="font-bold text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {video.author?.username && (
            <span className="hover:text-white transition-colors">
              {video.author.username}
            </span>
          )}
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {video.views}
          </span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(video.createdAt!), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}
