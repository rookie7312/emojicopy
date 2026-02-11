import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Zap, Pencil, Eye, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmojiPage } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isRunningBulk, setIsRunningBulk] = useState(false);
  const [editingPage, setEditingPage] = useState<EmojiPage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: pages = [] } = useQuery<EmojiPage[]>({
    queryKey: ["/api/pages"],
  });

  const generateMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const res = await apiRequest("POST", "/api/pages/generate", { keyword });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, title, metaDescription, content }: { id: number; title: string; metaDescription: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/pages/${id}`, { title, metaDescription, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setEditingPage(null);
      toast({ title: "Page saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const handleBulkGenerate = async () => {
    setIsRunningBulk(true);
    setGeneratedCount(0);
    let total = 0;
    const maxRounds = 100;

    for (let i = 0; i < maxRounds; i++) {
      try {
        const res = await apiRequest("POST", "/api/pages/generate-batch");
        const data = await res.json();
        if (data.generated === 0) break;
        total += data.generated;
        setGeneratedCount(total);
        queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      } catch {
        toast({ title: "Batch generation error", variant: "destructive" });
        break;
      }
    }

    setIsRunningBulk(false);
    toast({ title: `Generated content for ${total} pages` });
    queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
  };

  const openEditor = (page: EmojiPage) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditMeta(page.metaDescription || "");
    setEditContent(page.content || "");
  };

  const handleSave = () => {
    if (!editingPage) return;
    saveMutation.mutate({
      id: editingPage.id,
      title: editTitle,
      metaDescription: editMeta,
      content: editContent,
    });
  };

  const generatedPages = pages.filter(p => p.isGenerated);
  const ungeneratedPages = pages.filter(p => !p.isGenerated);

  if (editingPage) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Edit Page | Admin | EmojiCopy</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <header className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setEditingPage(null)} data-testid="button-cancel-edit">
                <X className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-bold" data-testid="text-edit-title">Editing: {editingPage.keyword}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/page/${editingPage.slug}`}>
                <Button variant="outline" size="sm" data-testid="button-preview">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </Link>
              <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save">
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Page Title</label>
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              data-testid="input-edit-title"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Meta Description</label>
            <Input
              value={editMeta}
              onChange={e => setEditMeta(e.target.value)}
              data-testid="input-edit-meta"
            />
            <p className="text-xs text-muted-foreground mt-1">{editMeta.length}/155 characters</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
              Content (Markdown)
            </label>
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              data-testid="textarea-edit-content"
            />
            <p className="text-xs text-muted-foreground mt-1">{editContent.length} characters</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin - Page Generator | EmojiCopy</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold" data-testid="text-admin-title">Admin - SEO Page Generator</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold mb-1" data-testid="text-stats-title">Page Statistics</h2>
              <p className="text-muted-foreground text-sm">
                {generatedPages.length} generated / {pages.length} total pages
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" data-testid="badge-pending">
                {ungeneratedPages.length} pending
              </Badge>
              <Badge data-testid="badge-done">
                {generatedPages.length} done
              </Badge>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2 mt-4 mb-6">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${pages.length > 0 ? (generatedPages.length / pages.length) * 100 : 0}%` }}
              data-testid="progress-bar"
            />
          </div>

          <Button
            onClick={handleBulkGenerate}
            disabled={isRunningBulk || ungeneratedPages.length === 0}
            className="w-full"
            data-testid="button-bulk-generate"
          >
            {isRunningBulk ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating... ({generatedCount} done so far)
              </>
            ) : ungeneratedPages.length === 0 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                All pages generated
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate All ({ungeneratedPages.length} remaining)
              </>
            )}
          </Button>
        </Card>

        {ungeneratedPages.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4" data-testid="text-pending-title">
              Pending Pages ({ungeneratedPages.length})
            </h2>
            <div className="grid gap-2">
              {ungeneratedPages.map(page => (
                <Card key={page.id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate" data-testid={`text-page-keyword-${page.id}`}>
                      {page.keyword}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateMutation.mutate(page.keyword)}
                    disabled={generateMutation.isPending}
                    data-testid={`button-generate-${page.id}`}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4" data-testid="text-generated-title">
            Generated Pages ({generatedPages.length})
          </h2>
          <div className="grid gap-2">
            {generatedPages.map(page => (
              <Card key={page.id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm truncate" data-testid={`text-generated-page-${page.id}`}>
                    {page.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/page/${page.slug}`}>
                    <Button size="sm" variant="ghost" data-testid={`button-view-${page.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => openEditor(page)} data-testid={`button-edit-${page.id}`}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
