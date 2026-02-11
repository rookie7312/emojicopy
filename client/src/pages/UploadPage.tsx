import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { UploadModal } from "@/components/UploadModal";
import { Button } from "@/components/ui/button";
import { Upload, Lock } from "lucide-react";

export default function UploadPage() {
  const { user, isLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) return <div className="min-h-screen bg-background" />;

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-display text-white mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            You must be signed in to upload videos to VelvetStream. Join our community of creators today.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white">
            <a href="/api/login">Sign In / Register</a>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-display text-white">Creator Studio</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your exclusive content with the world. High quality streaming, secure storage, and premium audience.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-12 text-left">
            {[
              { title: "HD Quality", desc: "Support for up to 4K resolution uploads." },
              { title: "Secure", desc: "Your content is protected and safe with us." },
              { title: "Monetization", desc: "Earn from premium subscribers (Coming Soon)." }
            ].map((feature, i) => (
              <div key={i} className="bg-card border border-white/5 p-6 rounded-xl">
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          <Button 
            size="lg" 
            onClick={() => setIsModalOpen(true)}
            className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-700 shadow-xl shadow-primary/20 transition-all hover:scale-105"
          >
            <Upload className="mr-2 h-6 w-6" />
            Upload New Video
          </Button>
        </div>
      </div>

      <UploadModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </Layout>
  );
}
