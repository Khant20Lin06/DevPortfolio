export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", accent: "primary" },
  { id: "projects", label: "Projects", icon: "folder_open", accent: "primary" },
  { id: "messages", label: "Live Chat", icon: "message", accent: "primary" },
  { id: "tech-stack", label: "Tech Stack", icon: "memory", accent: "secondary" },
  {
    id: "github-sync",
    label: "GitHub Sync",
    icon: "sync",
    accent: "green",
    helper: { label: "Live", kind: "pill" },
  },
  { id: "assets", label: "3D Assets", icon: "view_in_ar", accent: "primary" },
  { id: "inquiries", label: "Inquiries", icon: "mail", accent: "accent" },
];

export const HERO_PROJECTS = [
  {
    title: "FinTech Dashboard",
    category: "Web App",
    visibility: "Public",
    status: "Published",
    version: "v2.4.0",
    views: "12.5k",
    perf: 92,
    updatedAt: "Oct 24, 2023",
    by: "Alex",
    image: "/assets/project-shot-1.png",
    githubUrl: "https://github.com/alex-dev/fintech-dashboard",
    liveDemoUrl: "https://fintech-dashboard-demo.vercel.app",
    tags: ["React", "D3.js", "Node.js"],
  },
  {
    title: "E-Commerce Platform",
    category: "Full Stack",
    visibility: "Public",
    status: "Published",
    version: "v1.1.2",
    views: "8.2k",
    perf: 78,
    updatedAt: "Oct 20, 2023",
    by: "Alex",
    image: "/assets/project-shot-2.png",
    githubUrl: "https://github.com/alex-dev/ecommerce-platform",
    liveDemoUrl: "https://ecommerce-platform-demo.vercel.app",
    tags: ["Next.js", "Stripe", "PostgreSQL"],
  },
  {
    title: "Social Connect App",
    category: "Mobile",
    visibility: "Private",
    status: "Draft",
    version: "v0.9.0",
    views: "--",
    perf: 0,
    updatedAt: "2 days ago",
    by: "Alex",
    image: "/assets/project-shot-3.png",
    githubUrl: "https://github.com/alex-dev/social-connect",
    liveDemoUrl: "https://social-connect-demo.vercel.app",
    tags: ["React Native", "Socket.io", "Firebase"],
  },
];

export const ASSET_LIBRARY = [
  {
    name: "Hero_Character_V2",
    type: "GLB",
    updatedAt: "Updated 2h ago",
    size: "4.2 MB",
    polys: "12.5k",
    materials: "4",
    usedIn: "Landing Page",
    image: "/assets/hero-cube-ref-alpha.png",
    glow: "from-[#00f0ff]/20 to-[#7000ff]/20",
    tag: "primary",
  },
  {
    name: "Floating_Icons_Set",
    type: "GLTF",
    updatedAt: "Updated 1d ago",
    size: "1.8 MB",
    polys: "8.2k",
    materials: "2",
    usedIn: "Services",
    image: "/assets/about-cube.png",
    glow: "from-[#7000ff]/20 to-[#ff003c]/20",
    tag: "secondary",
  },
  {
    name: "Abstract_Sphere_Anim",
    type: "GLB",
    updatedAt: "Updated 3d ago",
    size: "8.5 MB",
    polys: "45k",
    materials: "1",
    usedIn: "About",
    image: "/assets/hero-cube-ref.png",
    glow: "from-[#ff003c]/20 to-[#00f0ff]/20",
    tag: "accent",
  },
  {
    name: "LowPoly_Terrain_04",
    type: "OBJ",
    updatedAt: "Updated 5d ago",
    size: "12.1 MB",
    polys: "62k",
    materials: "3",
    usedIn: "Unused",
    image: "/assets/project-1.png",
    glow: "from-[#22c55e]/20 to-[#00f0ff]/20",
    tag: "green",
  },
  {
    name: "Neon_Sign_Contact",
    type: "GLB",
    updatedAt: "Updated 1w ago",
    size: "0.9 MB",
    polys: "2.1k",
    materials: "5",
    usedIn: "Footer",
    image: "/assets/project-2.png",
    glow: "from-[#ec4899]/20 to-[#7000ff]/20",
    tag: "primary",
  },
];

export const INQUIRIES = [
  {
    id: "inq_1",
    sender: "Sarah Jenkins",
    email: "sarah.j@techstart.io",
    location: "New York, USA",
    subject: "Project Collaboration: FinTech UI",
    preview:
      "Hi Alex, I saw your portfolio and was really impressed by the FinTech dashboard project. We are looking for a frontend specialist...",
    time: "10:42 AM",
    tags: ["New Lead", "Freelance"],
    unread: true,
    body: [
      "Hi Alex,",
      "I saw your portfolio and was really impressed by the FinTech dashboard project you deployed last month. The data visualization specifically caught our eye.",
      "We are a startup based in NY looking for a frontend specialist to help us overhaul our analytics dashboard. Your React and Tailwind experience looks exactly like what we need.",
      "Could you let us know your availability for a quick 15-minute call sometime this week?",
      "Best regards, Sarah Jenkins",
    ],
  },
  {
    id: "inq_2",
    sender: "Michael Chen",
    email: "michael.chen@example.dev",
    location: "Singapore",
    subject: "Question about your Tech Stack",
    preview:
      "Hello! I am a junior dev and I was wondering what resources you used to learn Three.js for your 3D assets...",
    time: "Yesterday",
    tags: ["New"],
    unread: true,
    body: [
      "Hello Alex,",
      "I enjoyed your site. Could you share learning resources for Three.js and React Three Fiber?",
      "Thanks a lot!",
    ],
  },
  {
    id: "inq_3",
    sender: "Design Agency Inc.",
    email: "jobs@designagency.com",
    location: "Remote",
    subject: "Full-time Opportunity",
    preview:
      "We have an opening for a Creative Developer role and think you would be a great fit. Are you available for a call?",
    time: "Oct 24",
    tags: ["Replied", "Recruiter"],
    unread: false,
    body: [
      "Hello Alex,",
      "We are hiring a creative frontend engineer for interactive web experiences.",
      "If interested, please share your resume and portfolio links.",
    ],
  },
];

export const QUICK_REPLIES = [
  "Quick Reply: Availability",
  "Quick Reply: Rates",
  "Quick Reply: Decline",
];

export const accentClass = {
  primary: {
    active:
      "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.12)]",
    icon: "text-[#00f0ff]",
    hoverIcon: "group-hover:text-[#00f0ff]",
  },
  secondary: {
    active:
      "bg-[#7000ff]/10 text-[#b794ff] border border-[#7000ff]/30 shadow-[0_0_10px_rgba(112,0,255,0.18)]",
    icon: "text-[#b794ff]",
    hoverIcon: "group-hover:text-[#b794ff]",
  },
  accent: {
    active:
      "bg-[#ff003c]/10 text-[#ff5b80] border border-[#ff003c]/30 shadow-[0_0_10px_rgba(255,0,60,0.18)]",
    icon: "text-[#ff5b80]",
    hoverIcon: "group-hover:text-[#ff5b80]",
  },
  green: {
    active:
      "bg-[#22c55e]/10 text-[#4ade80] border border-[#22c55e]/30 shadow-[0_0_10px_rgba(34,197,94,0.18)]",
    icon: "text-[#4ade80]",
    hoverIcon: "group-hover:text-[#4ade80]",
  },
};

export const viewMeta = {
  dashboard: { title: "Content Manager", subtitle: "Portfolio overview and content controls." },
  projects: { title: "Projects", subtitle: "Total: 12" },
  messages: { title: "Live Chat", subtitle: "Respond to realtime inquiries." },
  "tech-stack": { title: "Tech Stack Manager", subtitle: "Tune stacks, visibility, and proficiency." },
  "github-sync": { title: "GitHub Sync", subtitle: "Repository metadata and contribution refresh." },
  assets: { title: "3D Assets Library", subtitle: "Manage GLB / GLTF / OBJ assets." },
  inquiries: { title: "Inquiries Inbox", subtitle: "Contact form submissions." },
};
