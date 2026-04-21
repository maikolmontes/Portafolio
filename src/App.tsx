/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useSpring, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { 
  ArrowUpRight, 
  Download, 
  Layers, 
  Globe, 
  Smartphone, 
  Play, 
  ArrowRight,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Mail,
  ChevronDown,
  Menu,
  X,
  AlertCircle
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import * as React from "react";

// Reveal Animation Component
function Reveal({ children, width = "fit-content", delay = 0.2 }: { children: React.ReactNode, width?: "fit-content" | "100%", delay?: number }) {
  const ref = useRef(null);
  const isInView = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView.current) {
          isInView.current = true;
          setTimeout(() => setVisible(true), delay * 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75, filter: "blur(10px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
        initial="hidden"
        animate={visible ? "visible" : "hidden"}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Magnetic Button Helper
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    x.set(distanceX * 0.3);
    y.set(distanceY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}

// Stars Background Component
function Stars({ count = 50 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          initial={{ 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1
          }}
          animate={{ 
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 3 + Math.random() * 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
          className="absolute w-1 h-1 bg-white rounded-full"
        />
      ))}
    </div>
  );
}

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [notionData, setNotionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Iniciando fetch de Notion...");
        const res = await fetch("/api/notion", {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          const text = await res.text();
          console.error("Respuesta no OK:", res.status, text);
          throw new Error(`Error del servidor (${res.status}): ${text.substring(0, 100)}`);
        }

        const data = await res.json();
        console.log("Datos de Notion recibidos:", data);

        if (data.error === "TOKEN_MISSING") {
          setErrorMsg(data.message);
        } else if (data.error) {
          throw new Error(data.message || data.error);
        } else {
          setNotionData(data);
        }
      } catch (err: any) {
        console.error("Error detallado en fetch:", err);
        const msg = err.name === 'TypeError' && err.message === 'Failed to fetch' 
          ? "Error de conexión: No se pudo contactar con la API. Verifica que la ruta /api/notion esté activa en tu despliegue."
          : err.message;
        setErrorMsg("Error al conectar con Notion: " + msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProject]);

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const bgRotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  // Astronaut parallax effect
  const astroX = useTransform(mouseX, [0, 1920], [-50, 50]);
  const astroY = useTransform(mouseY, [0, 1080], [-50, 50]);
  const astroSpringX = useSpring(astroX, { stiffness: 50, damping: 20 });
  const astroSpringY = useSpring(astroY, { stiffness: 50, damping: 20 });

  const fadeInUp = {
    initial: { opacity: 0, y: 60, scale: 0.95 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: { once: true }
  };

  const floatingAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const services = useMemo(() => {
    if (notionData?.servicios?.length > 0) {
      const icons = [<Layers key="1" />, <Globe key="2" />, <Smartphone key="3" />, <Play key="4" />];
      return notionData.servicios.map((s: any, i: number) => ({
        ...s,
        desc: s.desc || "Servicio profesional de diseño y desarrollo.",
        icon: React.cloneElement(icons[i % icons.length] as React.ReactElement, { className: "w-10 h-10" }),
        highlight: i === 1
      }));
    }
    return [
      { 
        title: "UI/UX", 
        desc: "Creating intuitive and visually appealing designs that enhance user experience.",
        icon: <Layers className="w-10 h-10" />
      },
      { 
        title: "Web Design", 
        desc: "Designing responsive and engaging websites tailored to user needs.",
        icon: <Globe className="w-10 h-10" />,
        highlight: true
      },
      { 
        title: "App Design", 
        desc: "Crafting seamless and user-friendly mobile app interfaces.",
        icon: <Smartphone className="w-10 h-10" />
      },
      { 
        title: "Prototyping & Wireframing", 
        desc: "Building interactive prototypes and structured wireframes for better design flow.",
        icon: <Play className="w-10 h-10" />
      }
    ];
  }, [notionData]);

  const projects = useMemo(() => {
    if (notionData?.proyectos?.length > 0) {
      return notionData.proyectos;
    }
    return [
      {
        title: "Aura Noir",
        category: "Branding / Web",
        image: "https://picsum.photos/seed/aura/800/600",
        link: "#",
        year: "2023",
        client: "Aura Cosmetics",
        fullDesc: "Una identidad visual minimalista y sofisticada para una marca de cosméticos de lujo. El proyecto incluyó el diseño del logotipo, la paleta de colores y una plataforma de comercio electrónico totalmente personalizada.",
        tags: ["React", "Tailwind", "Framer Motion", "Shopify"]
      },
      {
        title: "Kinetic UI",
        category: "App Design",
        image: "https://picsum.photos/seed/kinetic/800/600",
        link: "#",
        year: "2024",
        client: "Kinetic Tech",
        fullDesc: "Diseño de interfaz para una aplicación de seguimiento de actividad física de alto rendimiento. Nos enfocamos en la visualización de datos en tiempo real y una experiencia de usuario fluida y motivadora.",
        tags: ["Mobile App", "UI/UX", "Data Viz", "Figma"]
      },
      {
        title: "Precision Lab",
        category: "E-commerce",
        image: "https://picsum.photos/seed/precision/800/600",
        link: "#",
        year: "2023",
        client: "Precision Optics",
        fullDesc: "Rediseño completo de la experiencia de compra en línea para un fabricante de lentes de precisión. Implementamos un probador virtual y un sistema de filtrado avanzado.",
        tags: ["Next.js", "Three.js", "E-commerce", "Web Design"]
      },
      {
        title: "Editorial Flow",
        category: "Web Design",
        image: "https://picsum.photos/seed/editorial/800/600",
        link: "#",
        year: "2024",
        client: "Flow Magazine",
        fullDesc: "Una plataforma digital para una revista de arte y cultura contemporánea. El diseño prioriza la legibilidad y la presentación de imágenes de gran formato.",
        tags: ["Editorial", "Typography", "Web Design", "CMS"]
      }
    ];
  }, [notionData]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0F0505] text-white selection:bg-red-500 selection:text-white">
      {/* Noise Texture */}
      <div className="fixed inset-0 noise pointer-events-none z-[100]" />
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-orange-500 origin-left z-[60]"
        style={{ scaleX }}
      />

      {/* Integration Error Toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-red-600/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 max-w-[90vw] text-sm"
          >
            <AlertCircle size={20} />
            <div className="flex-1 font-medium">{errorMsg}</div>
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[70] bg-black/40 backdrop-blur-3xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-tighter font-headline flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">M</div>
            MAIKOL
          </motion.div>
          
          <div className="hidden lg:flex items-center gap-10 font-headline text-[10px] uppercase tracking-[0.3em] font-bold">
            {["Inicio", "Proyectos", "Servicios", "Contacto"].map((item) => (
              <a 
                key={item} 
                href={item === "Inicio" ? "#" : `#${item.toLowerCase()}`} 
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="text-white/40 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-red-500 transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Magnetic>
              <motion.button 
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(239,68,68,0.6)" }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:block bg-white text-black px-8 py-3 rounded-full font-headline font-bold text-[10px] tracking-widest"
              >
                HABLEMOS
              </motion.button>
            </Magnetic>

            {/* Mobile Menu Toggle */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white z-[80]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-3xl border-b border-white/5 py-10 px-6"
            >
              <div className="flex flex-col items-center gap-8 font-headline text-lg uppercase tracking-[0.3em] font-bold">
                {["Inicio", "Proyectos", "Servicios", "Contacto"].map((item) => (
                  <a 
                    key={item} 
                    href={item === "Inicio" ? "#" : `#${item.toLowerCase()}`} 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white/60 hover:text-red-500 transition-colors"
                  >
                    {item}
                  </a>
                ))}
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-4 bg-red-600 text-white px-10 py-4 rounded-full font-headline font-bold text-sm tracking-widest w-full max-w-xs"
                >
                  HABLEMOS
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 pt-32 md:pt-20 overflow-hidden">
        <Stars count={20} />
        {/* Creative Background Elements */}
        <div className="absolute inset-0 -z-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [0, -90, 0],
              x: [0, -50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-600/5 rounded-full blur-[120px]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_70%)]" />
          
          {/* Floating Particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%`,
                opacity: 0.1
              }}
              animate={{ 
                y: [0, -40, 0],
                opacity: [0.1, 0.4, 0.1]
              }}
              transition={{ 
                duration: 4 + Math.random() * 6, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: Math.random() * 5
              }}
              className="absolute w-1 h-1 bg-red-400/30 rounded-full"
            />
          ))}
        </div>
        
        <motion.div 
          style={{ y: bgY, rotate: bgRotate }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-radial-red -z-10 opacity-40 blur-[100px]" 
        />

        {/* Floating GitHub Astronaut - Behind Text */}
        <motion.div
          style={{ 
            x: astroSpringX, 
            y: astroSpringY,
          }}
          className="absolute inset-0 pointer-events-none z-[5] overflow-hidden"
        >
          <motion.div
            animate={{ 
              top: ["30%", "60%", "85%", "50%", "30%"],
              left: ["5%", "30%", "10%", "40%", "5%"],
              rotate: [0, 15, -15, 30, 0]
            }}
            transition={{ 
              duration: 35, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute w-[100px] sm:w-[150px] md:w-[250px] opacity-70"
          >
            <img 
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Astronaut.png" 
              alt="Astronaut" 
              className="w-full h-auto drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="font-headline text-red-400 uppercase tracking-[0.5em] text-[10px] font-bold block mb-8">
              MAIKOL DESIGN STUDIO — 2024
            </span>
          </motion.div>
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 relative">
            {/* Decorative Red Moon/Planet - More Central */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="absolute -top-20 -right-20 w-48 h-48 md:w-[30rem] md:h-[30rem] lg:w-[40rem] lg:h-[40rem] pointer-events-none -z-10 opacity-50"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 60, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="w-full h-full rounded-full bg-[#1a1a1a] relative overflow-hidden shadow-[inset_-20px_-20px_60px_rgba(0,0,0,0.9),0_0_100px_rgba(220,38,38,0.25)]"
              >
                {/* Base Texture and Lighting */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-950 to-black opacity-90" />
                
                {/* Craters - Procedural look using CSS */}
                {[
                  { t: '15%', l: '25%', s: 'w-16 h-16', o: '0.5' },
                  { t: '45%', l: '15%', s: 'w-24 h-24', o: '0.4' },
                  { t: '65%', l: '55%', s: 'w-20 h-20', o: '0.5' },
                  { t: '25%', l: '65%', s: 'w-12 h-12', o: '0.4' },
                  { t: '10%', l: '55%', s: 'w-10 h-10', o: '0.3' },
                  { t: '75%', l: '25%', s: 'w-28 h-28', o: '0.4' },
                  { t: '35%', l: '40%', s: 'w-18 h-18', o: '0.5' },
                  { t: '55%', l: '75%', s: 'w-14 h-14', o: '0.3' },
                  { t: '85%', l: '50%', s: 'w-12 h-12', o: '0.2' },
                ].map((crater, i) => (
                  <div 
                    key={i}
                    style={{ top: crater.t, left: crater.l, opacity: crater.o }}
                    className={`absolute ${crater.s} rounded-full bg-black/50 shadow-[inset_4px_4px_12px_rgba(0,0,0,0.9),1px_1px_2px_rgba(255,255,255,0.1)] blur-[1px]`}
                  />
                ))}

                {/* Surface Noise/Grain */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />
                
                {/* Global Shadow for 3D effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent pointer-events-none" />
              </motion.div>
              {/* Atmosphere Glow */}
              <div className="absolute inset-[-40%] rounded-full bg-red-600/10 blur-[120px] -z-10" />
            </motion.div>

            <div className="relative z-10 w-full lg:pr-28 text-center lg:text-left">
              <motion.h1 
                className="font-headline text-5xl sm:text-7xl md:text-8xl lg:text-[8.2rem] font-black leading-[0.8] tracking-tight uppercase"
              >
                {isLoading ? (
                  ["CARGANDO", "..."]
                ) : notionData?.inicio ? (
                  notionData.inicio.split(" ").length > 1 
                    ? [notionData.inicio.split(" ").slice(0, -1).join(" "), notionData.inicio.split(" ").slice(-1)[0]]
                    : [notionData.inicio]
                ) : (
                  ["CREANDO", "EL"]
                ).map((word, i) => (
                  <div key={i} className="overflow-hidden">
                    <motion.span
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="block"
                    >
                      {word}
                    </motion.span>
                  </div>
                ))}
                {!isLoading && !notionData?.inicio && (
                  <div className="overflow-hidden">
                    <motion.span
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="block text-stroke"
                    >
                      FUTURO
                    </motion.span>
                  </div>
                )}
                {notionData?.inicio && notionData.inicio.split(" ").length <= 1 && (
                  <div className="overflow-hidden">
                    <motion.span
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="block text-stroke"
                    >
                      {/* Empty stroke if only one word from notion */}
                    </motion.span>
                  </div>
                )}
                {notionData?.inicio && notionData.inicio.split(" ").length > 1 && (
                  // Re-mapping words for consistent animation if words was extracted
                  null
                )}
                {/* Specific handling for parsed notion text animation */}
                {isLoading === false && notionData?.inicio && (
                  notionData.inicio.split(" ").length > 1 ? (
                    (() => {
                      const words = [
                        notionData.inicio.split(" ").slice(0, -1).join(" "),
                        notionData.inicio.split(" ").slice(-1)[0]
                      ];
                      return words.map((word, i) => (
                        <div key={i} className="overflow-hidden">
                          <motion.span
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className={`block ${i === words.length - 1 ? "text-stroke" : ""}`}
                          >
                            {word}
                          </motion.span>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="overflow-hidden">
                      <motion.span
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="block text-stroke"
                      >
                        {notionData.inicio}
                      </motion.span>
                    </div>
                  )
                ).filter(Boolean).length === 0 && null }
              </motion.h1>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6 text-center lg:text-right w-full lg:w-auto"
            >
              <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-sm mx-auto lg:ml-auto lg:mr-0">
                Diseñador de experiencias digitales que transforman ideas en realidades visuales de alto impacto.
              </p>
              <div className="flex justify-center lg:justify-end gap-4">
                <div className="w-12 h-[1px] bg-white/20 mt-3" />
                <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase">Scroll to explore</span>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mt-12 md:mt-20"
          >
            <Magnetic>
              <motion.button 
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                whileHover={{ scale: 1.05, x: 10 }}
                className="bg-red-600 text-white font-headline font-bold px-8 md:px-12 py-4 md:py-6 rounded-full hover:bg-red-500 transition-all duration-500 flex items-center gap-4 group text-xs md:text-base"
              >
                VER PROYECTOS 
                <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </motion.button>
            </Magnetic>
            <Magnetic>
              <motion.button 
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                whileHover={{ scale: 1.05, x: -10 }}
                className="border border-white/10 text-white font-headline font-bold px-8 md:px-12 py-4 md:py-6 rounded-full hover:bg-white/5 transition-all flex items-center gap-4 text-xs md:text-base"
              >
                DESCARGAR CV
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            </Magnetic>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div 
          animate={{ y: [0, -40, 0], rotate: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-64 h-64 border border-white/5 rounded-full blur-xl -z-10"
        />
        <motion.div 
          animate={{ y: [0, 40, 0], rotate: [0, -20, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 border border-white/5 rounded-full blur-2xl -z-10"
        />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="text-white/20" />
          </motion.div>
        </motion.div>
      </section>

      {/* Services Section (Matching Image) */}
      <section id="servicios" className="py-40 px-6 md:px-12 relative overflow-hidden">
        <Stars count={30} />
        <div className="max-w-7xl mx-auto text-center mb-24 flex flex-col items-center relative z-10">
          <Reveal>
            <h2 className="text-5xl md:text-6xl font-black font-headline mb-6">
              Services
            </h2>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="text-white/50 text-xl max-w-2xl mx-auto">
              Transforming ideas into intuitive digital experiences
            </p>
          </Reveal>
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Vertical Arrows (Unique Buttons) */}
          <div className="absolute -right-12 top-0 flex flex-col gap-4 hidden lg:flex">
            <motion.button 
              whileHover={{ scale: 1.2, backgroundColor: "rgba(239, 68, 68, 0.4)" }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowUpRight className="w-5 h-5 rotate-[-90deg]" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.2, backgroundColor: "rgba(239, 68, 68, 0.4)" }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowUpRight className="w-5 h-5 rotate-[90deg]" />
            </motion.button>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {services.map((service, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -15, scale: 1.02 }}
                className={`p-10 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-8 transition-all duration-500 ${
                  service.highlight 
                  ? "bg-gradient-to-br from-red-600 to-orange-500 shadow-[0_20px_50px_rgba(239,68,68,0.4)]" 
                  : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <motion.div 
                  variants={floatingAnimation}
                  animate="animate"
                  className="p-4 rounded-2xl bg-white/10"
                >
                  {service.icon}
                </motion.div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold font-headline">{service.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">
                    {service.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom Navigation */}
          <div className="mt-20 flex items-center justify-center gap-12">
            <motion.button 
              whileHover={{ scale: 1.2, x: -10, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
            >
              <ArrowUpRight className="w-4 h-4 md:w-6 md:h-6 rotate-[-135deg]" />
            </motion.button>
            
            <div className="flex gap-2 md:gap-3">
              {[0, 1, 2, 3].map((dot) => (
                <motion.div 
                  key={dot} 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: dot === 1 ? 1.2 : 1 }}
                  className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${dot === 1 ? "w-6 md:w-8 bg-red-500" : "w-1.5 md:w-2 bg-white/20"}`} 
                />
              ))}
            </div>

            <motion.button 
              whileHover={{ scale: 1.2, x: 10, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
            >
              <ArrowUpRight className="w-4 h-4 md:w-6 md:h-6 rotate-[45deg]" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="proyectos" className="py-40 px-6 md:px-12 bg-black/20 relative overflow-hidden">
        <Stars count={40} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div>
              <Reveal>
                <span className="text-red-400 font-bold tracking-[0.4em] text-[10px] uppercase mb-4 block">PORTAFOLIO SELECCIONADO</span>
              </Reveal>
              <Reveal delay={0.3}>
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-black font-headline tracking-tighter uppercase">PROYECTOS</h2>
              </Reveal>
            </div>
            <Reveal delay={0.5}>
              <p className="text-white/40 max-w-sm text-right">
                Una colección de trabajos donde la estética y la funcionalidad convergen en una sola pieza.
              </p>
            </Reveal>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            {projects.map((project, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => setSelectedProject(project)}
                className="group cursor-pointer relative"
              >
                <motion.div 
                  whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative aspect-[4/3] overflow-hidden rounded-3xl mb-8 perspective-1000"
                >
                  <motion.img 
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      whileHover={{ scale: 1.1, rotate: 0 }}
                      className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-500 delay-100 shadow-2xl"
                    >
                      <ArrowUpRight className="w-10 h-10" />
                    </motion.div>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0.4 }}
                  whileHover={{ opacity: 1, x: 10 }}
                  className="flex justify-between items-start transition-all"
                >
                  <div>
                    <h3 className="text-3xl font-bold font-headline mb-2 group-hover:text-red-400 transition-colors">{project.title}</h3>
                    <p className="text-white/40 uppercase tracking-widest text-xs font-bold">{project.category}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-24 text-center">
            <motion.button 
              whileHover={{ scale: 1.1, letterSpacing: "0.4em" }}
              className="border-b border-white/20 pb-2 text-white/60 hover:text-white hover:border-white transition-all font-headline font-bold uppercase tracking-widest text-sm"
            >
              Ver todos los proyectos
            </motion.button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-32 px-6 md:px-12 relative overflow-hidden">
        <Stars count={20} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24 flex flex-col items-center">
            <Reveal>
              <h2 className="font-headline font-black text-4xl sm:text-6xl md:text-9xl tracking-tighter uppercase mb-8">
                PONTE EN<br />
                <span className="text-red-500">CONTACTO</span>
              </h2>
            </Reveal>
            <Reveal delay={0.4}>
              <p className="text-white/40 text-xl max-w-2xl mx-auto">
                ¿Tienes una visión que necesita artesanía digital? Construyamos algo cinematográfico juntos.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="lg:col-span-4 space-y-12"
            >
              <motion.div variants={fadeInUp}>
                <h4 className="text-red-500 font-bold tracking-widest text-xs uppercase mb-4">DIRECTO</h4>
                <p className="text-2xl font-headline font-bold hover:text-red-400 transition-colors cursor-pointer">hola@maikol.design</p>
                <p className="text-2xl font-headline font-bold">+1 212 555 0198</p>
              </motion.div>
              <motion.div variants={fadeInUp} className="flex gap-6">
                {[Instagram, Linkedin, Twitter, Facebook].map((Icon, i) => (
                  <motion.a 
                    key={i}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    whileHover={{ y: -10, color: "#EF4444", borderColor: "#EF4444" }}
                    href="#" 
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 transition-all"
                  >
                    <Icon size={20} />
                  </motion.a>
                ))}
              </motion.div>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              className="lg:col-span-8 glass-card p-8 md:p-12 rounded-3xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 aura-glow opacity-30 -z-10" />
              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/30">Nombre Completo</label>
                    <input type="text" className="w-full bg-transparent border-b border-white/10 py-4 focus:border-red-500 outline-none transition-colors" placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/30">Correo Electrónico</label>
                    <input type="email" className="w-full bg-transparent border-b border-white/10 py-4 focus:border-red-500 outline-none transition-colors" placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/30">Mensaje</label>
                  <textarea rows={4} className="w-full bg-transparent border-b border-white/10 py-4 focus:border-red-500 outline-none transition-colors resize-none" placeholder="Cuéntame sobre tu visión..." />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(239,68,68,0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-600 text-white px-12 py-5 rounded-full font-headline font-black tracking-widest text-xs transition-all flex items-center gap-4 group"
                >
                  ENVIAR MENSAJE
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="py-20 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="marquee-content whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-20 px-10">
              {["UI/UX DESIGN", "WEB DEVELOPMENT", "BRANDING", "MOTION GRAPHICS", "APP DESIGN"].map((skill) => (
                <span key={skill} className="text-4xl md:text-6xl font-black font-headline opacity-10 hover:opacity-100 transition-opacity duration-500 cursor-default">
                  {skill}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <motion.div 
            whileHover={{ scale: 1.1, color: "#EF4444" }}
            className="text-4xl font-black tracking-tighter font-headline opacity-20 transition-all"
          >
            MAIKOL
          </motion.div>
          
          <div className="flex gap-12 text-xs font-bold tracking-widest uppercase text-white/30">
            {["Dribbble", "Behance", "LinkedIn", "Instagram"].map((social) => (
              <a key={social} href="#" className="hover:text-red-400 transition-colors">{social}</a>
            ))}
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-white/20">
            © 2024 MAIKOL. TODOS LOS DERECHOS RESERVADOS.
          </div>
        </div>
      </footer>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-5xl bg-[#1a0a0a] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedProject(null)}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <X size={24} />
              </button>

              {/* Image Section */}
              <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                <div className="mb-8">
                  <span className="text-red-500 font-bold tracking-widest text-xs uppercase mb-2 block">{selectedProject.category}</span>
                  <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter uppercase">{selectedProject.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10 border-y border-white/5 py-8">
                  <div>
                    <h4 className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Cliente</h4>
                    <p className="font-bold">{selectedProject.client}</p>
                  </div>
                  <div>
                    <h4 className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Año</h4>
                    <p className="font-bold">{selectedProject.year}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <h4 className="text-white/30 text-[10px] uppercase tracking-widest mb-4">Sobre el proyecto</h4>
                  <p className="text-white/70 leading-relaxed text-lg">
                    {selectedProject.fullDesc}
                  </p>
                </div>

                <div className="mb-12">
                  <h4 className="text-white/30 text-[10px] uppercase tracking-widest mb-4">Tecnologías</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag: string) => (
                      <span key={tag} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
