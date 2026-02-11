import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Flame, 
  Upload, 
  User, 
  LogOut, 
  Menu, 
  X,
  Search
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Trending", href: "/trending", icon: Flame },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
          
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-800 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <span className="text-white font-bold font-display text-lg">V</span>
            </div>
            <span className="text-xl font-display font-bold tracking-wider text-white hidden sm:block">
              VELVET<span className="text-primary">STREAM</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-card/50 p-1 rounded-full border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isActive(item.href) 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"}
              `}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <Link href="/search" className="p-2 text-muted-foreground hover:text-white transition-colors md:hidden">
            <Search size={20} />
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/upload" className="hidden sm:flex">
                <Button 
                  size="sm" 
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-2"
                >
                  <Upload size={16} />
                  Upload
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary transition-all p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {user.firstName?.[0] || user.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="px-2 py-1.5 text-sm font-semibold text-white">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link href="/upload" className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-white">
                      <Upload size={14} /> Upload Video
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-white">
                      <User size={14} /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut size={14} /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              asChild
              className="bg-primary text-white hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
            >
              <a href="/api/login">Sign In</a>
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-30 bg-background md:hidden p-4 flex flex-col gap-2"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200
                    ${isActive(item.href) 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"}
                  `}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
            
            {user && (
              <Link 
                href="/upload"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-secondary hover:text-secondary/80 mt-4 border border-secondary/20 bg-secondary/5"
              >
                <Upload size={20} />
                Upload New Video
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-20 px-4 md:px-8 pb-12 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} VelvetStream. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-50">18+ Content. Please consume responsibly.</p>
      </footer>
    </div>
  );
}
