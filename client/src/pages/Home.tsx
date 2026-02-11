import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Search, Check, TrendingUp, Grid3X3, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Emoji, EmojiPage } from "@shared/schema";

export default function Home() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const [matched, params] = useRoute("/category/:category");
  const activeCategory = matched ? decodeURIComponent(params!.category) : null;
  const { toast } = useToast();

  const { data: emojis = [], isLoading } = useQuery<Emoji[]>({
    queryKey: ["/api/emojis", search, activeCategory].filter(Boolean),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeCategory) params.set("category", activeCategory);
      const res = await fetch(`/api/emojis?${params.toString()}`);
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/emojis/categories"],
  });

  const { data: trending = [] } = useQuery<Emoji[]>({
    queryKey: ["/api/emojis/trending"],
  });

  const { data: pages = [] } = useQuery<EmojiPage[]>({
    queryKey: ["/api/pages"],
  });

  const copyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/emojis/${id}/copy`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emojis/trending"] });
    },
  });

  const handleCopy = useCallback(async (emoji: Emoji) => {
    try {
      await navigator.clipboard.writeText(emoji.emoji);
      setCopiedId(emoji.id);
      copyMutation.mutate(emoji.id);
      toast({
        title: `${emoji.emoji} Copied!`,
        description: emoji.name,
      });
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [copyMutation, toast]);

  const grouped = useMemo(() => {
    if (search || activeCategory) return null;
    const groups: Record<string, Emoji[]> = {};
    emojis.forEach(e => {
      if (!groups[e.category]) groups[e.category] = [];
      groups[e.category].push(e);
    });
    return groups;
  }, [emojis, search, activeCategory]);

  const topTrending = trending.slice(0, 20);
  const generatedPages = pages.filter(p => p.isGenerated).slice(0, 30);

  const pageTitle = activeCategory
    ? `${activeCategory} Emojis - Copy & Paste | EmojiCopy`
    : search
    ? `Search: ${search} - Emojis | EmojiCopy`
    : "EmojiCopy - Copy & Paste Emojis Instantly";
  const pageDescription = activeCategory
    ? `Browse and copy ${activeCategory} emojis. Click to copy any emoji to your clipboard instantly. Free emoji copy and paste tool.`
    : "Copy and paste emojis instantly! Browse 400+ emojis by category, search, and click to copy. Free emoji tool for messages, social media, and more.";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/" data-testid="link-home">
            <h1 className="text-xl font-bold text-foreground cursor-pointer whitespace-nowrap">
              EmojiCopy
            </h1>
          </Link>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search"
              placeholder="Search emojis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`cursor-pointer ${!activeCategory ? 'toggle-elevate toggle-elevated' : 'hover-elevate'}`}
              variant={!activeCategory ? "default" : "secondary"}
              onClick={() => setLocation("/")}
              data-testid="badge-all"
            >
              <Grid3X3 className="w-3 h-3 mr-1" />
              All
            </Badge>
            {categories.slice(0, 6).map(cat => (
              <Badge
                key={cat}
                className={`cursor-pointer ${activeCategory === cat ? 'toggle-elevate toggle-elevated' : 'hover-elevate'}`}
                variant={activeCategory === cat ? "default" : "secondary"}
                onClick={() => setLocation(`/category/${encodeURIComponent(cat)}`)}
                data-testid={`badge-category-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!search && !activeCategory && (
          <section className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-hero-title">
                Copy & Paste Emojis Instantly
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-hero-subtitle">
                Click any emoji to copy it to your clipboard. Works everywhere - messages, social media, emails, and more.
              </p>
            </div>

            {topTrending.length > 0 && (
              <Card className="p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-sm" data-testid="text-trending-title">Trending</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topTrending.map(emoji => (
                    <button
                      key={emoji.id}
                      onClick={() => handleCopy(emoji)}
                      className={`text-2xl p-1.5 rounded-md hover-elevate active-elevate-2 cursor-pointer emoji-grid-item ${copiedId === emoji.id ? 'copied-animation bg-primary/10' : ''}`}
                      title={`${emoji.name} - Click to copy`}
                      data-testid={`emoji-trending-${emoji.id}`}
                    >
                      {emoji.emoji}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </section>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        ) : search || activeCategory ? (
          <section>
            <h2 className="text-lg font-semibold mb-4" data-testid="text-results-title">
              {search ? `Results for "${search}"` : activeCategory}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({emojis.length} emojis)
              </span>
            </h2>
            <EmojiGrid emojis={emojis} copiedId={copiedId} onCopy={handleCopy} />
          </section>
        ) : grouped ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, categoryEmojis]) => (
              <section key={category}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold" data-testid={`text-category-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                    {category}
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      ({categoryEmojis.length})
                    </span>
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(`/category/${encodeURIComponent(category)}`)}
                    data-testid={`button-viewall-${category.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    View all
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <EmojiGrid emojis={categoryEmojis} copiedId={copiedId} onCopy={handleCopy} />
              </section>
            ))}
          </div>
        ) : null}

        {!search && !activeCategory && generatedPages.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-semibold mb-4" data-testid="text-seo-pages-title">
              Popular Emoji Pages
            </h2>
            <div className="flex flex-wrap gap-2">
              {generatedPages.map(page => (
                <Link key={page.id} href={`/page/${page.slug}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover-elevate"
                    data-testid={`link-page-${page.slug}`}
                  >
                    {page.keyword}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!search && !activeCategory && pages.length > 0 && (
          <section className="mt-8 border-t border-border pt-8 pb-12">
            <h2 className="text-lg font-semibold mb-4" data-testid="text-all-pages-title">
              Browse All Emoji Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {pages.slice(0, 100).map(page => (
                <Link key={page.id} href={`/page/${page.slug}`}>
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid={`link-allpage-${page.slug}`}>
                    {page.title.replace(' - Copy & Paste', '')}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p data-testid="text-footer">
            Click any emoji to copy it to your clipboard. Free emoji copy and paste tool.
          </p>
        </div>
      </footer>
    </div>
  );
}

function EmojiGrid({ emojis, copiedId, onCopy }: { emojis: Emoji[]; copiedId: number | null; onCopy: (e: Emoji) => void }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
      {emojis.map(emoji => (
        <div
          key={emoji.id}
          className="relative group"
        >
          <button
            onClick={() => onCopy(emoji)}
            className={`w-full aspect-square flex flex-col items-center justify-center rounded-md hover-elevate active-elevate-2 cursor-pointer p-1 emoji-grid-item ${copiedId === emoji.id ? 'copied-animation bg-primary/10' : ''}`}
            title={`${emoji.name} - Click to copy`}
            data-testid={`emoji-${emoji.id}`}
          >
            <span className="text-2xl sm:text-3xl leading-none">{emoji.emoji}</span>
            {copiedId === emoji.id && (
              <span className="absolute top-0 right-0 p-0.5">
                <Check className="w-3 h-3 text-primary" />
              </span>
            )}
          </button>
          <div className="invisible group-hover:visible absolute -bottom-6 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
            <span className="text-xs bg-card border border-border rounded-md px-2 py-0.5 shadow-sm text-muted-foreground">
              {emoji.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
