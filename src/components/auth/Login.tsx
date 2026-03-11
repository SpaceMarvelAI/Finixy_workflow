import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../store/AuthContext";
import { authService } from "../../services/api";
import { Loader2, Lock, Sparkles, Zap, TrendingUp } from "lucide-react";
import gsap from "gsap";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const [showSplash, setShowSplash] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const splashRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const icon1Ref = useRef<HTMLDivElement>(null);
  const icon2Ref = useRef<HTMLDivElement>(null);
  const icon3Ref = useRef<HTMLDivElement>(null);
  const loginFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSplash) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setShowSplash(false);
        setShowLogin(true);
      },
    });

    // Logo animation
    tl.fromTo(
      logoRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1,
        ease: "elastic.out(1, 0.6)",
      },
    );

    // Logo pulse
    tl.to(logoRef.current, {
      scale: 1.15,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });

    // Floating icons appear
    tl.fromTo(
      [icon1Ref.current, icon2Ref.current, icon3Ref.current],
      { scale: 0, opacity: 0, rotation: -90 },
      {
        scale: 1,
        opacity: 0.6,
        rotation: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
      },
      "-=0.6",
    );

    // Title
    tl.fromTo(
      titleRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.4",
    );

    // Subtitle
    tl.fromTo(
      subtitleRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.4",
    );

    // Tagline
    tl.fromTo(
      taglineRef.current,
      { opacity: 0, scale: 0.9, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
      },
      "-=0.3",
    );

    // Hold for 1.5 seconds
    tl.to({}, { duration: 1.5 });

    // Fade out
    tl.to(splashRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.5,
      ease: "power2.in",
    });

    return () => {
      tl.kill();
    };
  }, [showSplash]);

  useEffect(() => {
    if (showLogin && loginFormRef.current) {
      gsap.fromTo(
        loginFormRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
        },
      );
    }
  }, [showLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await authService.login(email, password);
      if (response.access_token) {
        login(response.access_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-black overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse"></div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-ping"></div>
          <div
            className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-ping"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-pink-400 rounded-full opacity-60 animate-ping"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div ref={splashRef} className="text-center z-10 px-4">
          <div className="relative mb-8">
            <div
              ref={icon1Ref}
              className="absolute -left-24 -top-8 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg opacity-0"
            >
              <Zap className="w-6 h-6 text-white" />
            </div>

            <div
              ref={icon2Ref}
              className="absolute -right-24 -top-8 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg opacity-0"
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </div>

            <div
              ref={icon3Ref}
              className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg opacity-0"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <div
              ref={logoRef}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/50 opacity-0"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1
            ref={titleRef}
            className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 tracking-tight opacity-0"
          >
            Welcome to Finixy
          </h1>

          <p
            ref={subtitleRef}
            className="text-blue-200 text-xl md:text-2xl font-semibold mb-4 opacity-0"
          >
            Your finance automation buddy
          </p>

          <p
            ref={taglineRef}
            className="text-gray-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed px-4 opacity-0"
          >
            We make your financial work{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 font-bold">
              fun and easy
            </span>{" "}
            with Finixy
          </p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-50 to-gray-200 dark:from-gray-900 dark:via-blue-900 dark:to-black px-4 theme-transition">
        <div
          ref={loginFormRef}
          className="max-w-md w-full bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 theme-transition"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Login to continue to Finixy
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 theme-input border rounded-xl transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 theme-input border rounded-xl transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                "LogIn"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
