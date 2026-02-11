import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type VideoInput } from "@shared/routes";

// GET /api/videos
export function useVideos(search?: string, sort?: 'newest' | 'popular') {
  return useQuery({
    queryKey: [api.videos.list.path, search, sort],
    queryFn: async () => {
      const url = buildUrl(api.videos.list.path);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (sort) queryParams.append("sort", sort);
      
      const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
      
      const res = await fetch(fullUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch videos");
      return api.videos.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/videos/:id
export function useVideo(id: number) {
  return useQuery({
    queryKey: [api.videos.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.videos.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch video");
      return api.videos.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/videos
export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: VideoInput) => {
      const validated = api.videos.create.input.parse(data);
      const res = await fetch(api.videos.create.path, {
        method: api.videos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        if (res.status === 400) {
          const error = api.videos.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to upload video");
      }
      return api.videos.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.videos.list.path] });
    },
  });
}

// DELETE /api/videos/:id
export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.videos.delete.path, { id });
      const res = await fetch(url, { 
        method: api.videos.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Video not found");
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to delete video");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.videos.list.path] });
    },
  });
}

// COMMENTS HOOKS
export function useComments(videoId: number) {
  return useQuery({
    queryKey: [api.comments.list.path, videoId],
    queryFn: async () => {
      const url = buildUrl(api.comments.list.path, { videoId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return api.comments.list.responses[200].parse(await res.json());
    },
    enabled: !!videoId,
  });
}

export function useCreateComment(videoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const url = buildUrl(api.comments.create.path, { videoId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Please login to comment");
        throw new Error("Failed to post comment");
      }
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.comments.list.path, videoId] });
    },
  });
}
