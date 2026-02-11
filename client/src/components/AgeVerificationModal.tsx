import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isVerified = localStorage.getItem("age-verified");
    if (isVerified !== "true") {
      setIsOpen(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem("age-verified", "true");
    setIsOpen(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-card border border-primary/20 rounded-xl p-8 shadow-2xl shadow-primary/10 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <AlertTriangle className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <h2 className="text-3xl font-display text-primary mb-2">Age Verification</h2>
            <p className="text-muted-foreground mb-8 font-light leading-relaxed">
              This website contains age-restricted content. You must be 18 years or older to enter.
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                onClick={handleVerify}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold tracking-wider uppercase py-6"
              >
                I am 18 or older - Enter
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleExit}
                className="w-full border-muted-foreground/20 text-muted-foreground hover:bg-muted/20 hover:text-white"
              >
                Exit Website
              </Button>
            </div>
            
            <p className="mt-6 text-xs text-muted-foreground/50">
              By entering, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
