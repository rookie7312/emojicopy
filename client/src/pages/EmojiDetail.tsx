import { useCallback, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Emoji } from "@shared/schema";

export default function EmojiDetail() {
  const [, params] = useRoute("/emoji/:slug");
  const slug = params?.slug ?? "";
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: emoji, isLoading } = useQuery<Emoji>({
    queryKey: ["/api/emojis", slug],
    queryFn: async () => {
      const res = await fetch(`/api/emojis/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const copyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/emojis/${id}/copy`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emojis/trending"] });
    },
  });

  const handleCopy = useCallback(async () => {
    if (!emoji) return;
    try {
      await navigator.clipboard.writeText(emoji.emoji);
      setCopied(true);
      copyMutation.mutate(emoji.id);
      toast({ title: `${emoji.emoji} Copied!`, description: emoji.name });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }, [emoji, copyMutation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  const emojiTitle = emoji ? `${emoji.emoji} ${emoji.name} Emoji - Copy & Paste | EmojiCopy` : "Emoji Not Found | EmojiCopy";
  const emojiDescription = emoji
    ? `Copy the ${emoji.name} ${emoji.emoji} emoji. ${emoji.description || ''} Click to copy and paste anywhere.`
    : "Emoji not found.";

  if (!emoji) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet>
          <title>Emoji Not Found | EmojiCopy</title>
          <meta name="description" content="The emoji you're looking for could not be found." />
        </Helmet>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Emoji not found</p>
          <Link href="/">
            <Button data-testid="button-back-home">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{emojiTitle}</title>
        <meta name="description" content={emojiDescription} />
        <meta property="og:title" content={emojiTitle} />
        <meta property="og:description" content={emojiDescription} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={emojiTitle} />
        <meta name="twitter:description" content={emojiDescription} />
      </Helmet>
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold" data-testid="text-page-title">EmojiCopy</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center mb-6">
          <div className="text-8xl mb-4" data-testid="text-emoji-large">{emoji.emoji}</div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-emoji-name">{emoji.name}</h2>
          <p className="text-muted-foreground mb-6" data-testid="text-emoji-description">{emoji.description}</p>
          <Button
            size="lg"
            onClick={handleCopy}
            data-testid="button-copy-emoji"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy Emoji"}
          </Button>
        </Card>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Category</h3>
            <Link href={`/category/${encodeURIComponent(emoji.category)}`}>
              <Badge variant="secondary" className="cursor-pointer hover-elevate" data-testid="badge-emoji-category">
                {emoji.category}
              </Badge>
            </Link>
          </div>

          {emoji.subcategory && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Subcategory</h3>
              <Badge variant="outline" data-testid="badge-emoji-subcategory">{emoji.subcategory}</Badge>
            </div>
          )}

          {emoji.keywords && emoji.keywords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-1">
                {emoji.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-keyword-${i}`}>
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Copy Count</h3>
            <p className="text-sm" data-testid="text-copy-count">{emoji.copyCount ?? 0} copies</p>
          </div>
        </div>
      </main>
    </div>
  );
}
