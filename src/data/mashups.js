export const domains = [
  'Web3',
  'Cybersecurity',
  'Gaming',
  'Productivity',
  'Cooking',
  'Fashion',
  'Fitness',
  'Anime',
  'Climate Tech',
  'Music',
  'Education',
  'Space Travel',
  'Mental Health',
  'Robotics',
]

export const filters = ['All', 'SaaS Tools', 'Mini-Games', 'Creative Branding', 'Dev Projects']

const rawMashups = [
  ['CipherKitchen', 'Cybersecurity', 'Cooking', 'Dev Projects', 'Cook your way through real security exploits.', 'A recipe-based learning game where every dish maps to a security concept: salt the hash, sanitize inputs, and prevent buffer overflows before service.', 'Junior developers and bootcamp students', ['React', 'Node.js', 'WebContainers']],
  ['Liquidity Saga', 'Web3', 'Anime', 'Mini-Games', 'DeFi mechanics, told like an epic shonen arc.', 'A narrative simulator that turns liquidity pools, impermanent loss, and governance into character stats and branching battles.', 'Crypto-curious gamers', ['Phaser', 'Solidity', 'WalletConnect']],
  ['Focus Familiar', 'Productivity', 'Gaming', 'SaaS Tools', 'Your to-do list has a tiny guardian.', 'A focus timer where completed tasks feed and evolve a desktop familiar, making consistent deep work feel like creature progression.', 'Remote workers and students', ['Tauri', 'React', 'Supabase']],
  ['Runway Runtime', 'Fashion', 'Dev Projects', 'Creative Branding', 'A design system dressed for every deployment.', 'A visual identity generator that translates software architecture choices into editorial fashion directions and launch assets.', 'Indie hackers and studios', ['Next.js', 'Canvas API', 'OpenAI']],
  ['Rep Rhapsody', 'Fitness', 'Music', 'SaaS Tools', 'Every workout deserves its own score.', 'An adaptive music engine that shifts tempo, instrumentation, and intensity based on live workout cadence and heart rate.', 'Runners and gym members', ['React Native', 'Web Audio', 'HealthKit']],
  ['Pantry Protocol', 'Cooking', 'Climate Tech', 'SaaS Tools', 'Waste less. Improvise better.', 'A household inventory app that predicts spoilage and creates flexible recipes ranked by carbon impact and ingredients saved.', 'Eco-conscious households', ['Expo', 'FastAPI', 'PostgreSQL']],
  ['Firewall Fables', 'Cybersecurity', 'Education', 'Mini-Games', 'Defend a kingdom one packet at a time.', 'A tower-defense game where network topology is the map and attacks teach practical defense, logging, and incident response.', 'High-school CS programs', ['Godot', 'WebSockets', 'SQLite']],
  ['Orbit Office', 'Space Travel', 'Productivity', 'SaaS Tools', 'Async work for teams in different time zones and planets.', 'A collaboration tool that models communication delay, bundles updates, and creates high-context handoff capsules.', 'Globally distributed teams', ['Next.js', 'tRPC', 'PostgreSQL']],
  ['Mood Loom', 'Mental Health', 'Fashion', 'Creative Branding', 'Wear the weather inside your head.', 'A private mood journal that turns emotional patterns into generative textile prints and optional wearable art.', 'Artists and reflective journalers', ['Svelte', 'D3.js', 'Printful API']],
  ['Mecha Mentor', 'Robotics', 'Anime', 'Dev Projects', 'Train your robot like a protagonist.', 'A visual robotics IDE that frames calibration, path planning, and debugging as training arcs with replayable missions.', 'Robotics clubs and makers', ['Electron', 'ROS 2', 'Three.js']],
  ['Proof of Practice', 'Web3', 'Fitness', 'SaaS Tools', 'Verifiable consistency, not speculative calories.', 'A privacy-first credential platform where gyms and coaches issue non-transferable milestones for real training streaks.', 'Coaches and fitness communities', ['React Native', 'Polygon', 'ZK Proofs']],
  ['Syntax Sous-Chef', 'Cooking', 'Education', 'Dev Projects', 'Learn programming through kitchen logic.', 'An interactive course that teaches functions, queues, state, and concurrency by orchestrating a busy virtual kitchen.', 'First-time coding students', ['React', 'XState', 'Monaco Editor']],
  ['Patch Notes IRL', 'Gaming', 'Mental Health', 'Creative Branding', 'Treat personal growth like a balanced live service.', 'A playful weekly reflection tool that publishes private patch notes for habits, boundaries, buffs, and known issues.', 'Young professionals and creators', ['Remix', 'Supabase', 'Resend']],
  ['Carbon Combo', 'Climate Tech', 'Gaming', 'Mini-Games', 'Build the longest low-carbon streak.', 'A cooperative daily challenge where small climate actions chain into team combos, city leaderboards, and unlockable worlds.', 'Schools and community groups', ['Flutter', 'Firebase', 'Mapbox']],
  ['Zero-Day Wardrobe', 'Cybersecurity', 'Fashion', 'Creative Branding', 'Threat modeling for what you wear online.', 'A campaign generator that visualizes digital privacy risks as garments, accessories, and editorial lookbooks.', 'Privacy nonprofits and educators', ['Astro', 'Three.js', 'Stable Diffusion']],
  ['Chord Courier', 'Music', 'Productivity', 'Dev Projects', 'Move tasks through a musical pipeline.', 'A spatial kanban where workflow stages are instruments and project activity composes an ambient team soundtrack.', 'Creative agencies', ['Vue', 'Tone.js', 'Yjs']],
  ['Study Shonen', 'Education', 'Anime', 'Mini-Games', 'Turn the syllabus into your training arc.', 'A study planner that converts modules into sagas, exams into boss fights, and spaced repetition into daily techniques.', 'University students', ['React Native', 'SQLite', 'Notifications API']],
  ['Astro Atelier', 'Space Travel', 'Fashion', 'Creative Branding', 'Dress codes for impossible environments.', 'A speculative design tool that creates clothing systems for Mars dust, lunar temperatures, and zero-gravity movement.', 'Fashion students and sci-fi studios', ['Next.js', 'Three.js', 'Gemini API']],
]

export const mashups = rawMashups.map(([title, domainA, domainB, type, tagline, pitch, audience, stack], index) => ({
  id: `${domainA}-${domainB}-${index}`.toLowerCase().replaceAll(' ', '-'),
  title,
  domainA,
  domainB,
  type,
  tagline,
  pitch,
  audience,
  stack,
  prompt: `Build a polished ${type.toLowerCase()} called “${title}” that combines ${domainA} and ${domainB}. ${pitch} The core audience is ${audience}. Use ${stack.join(', ')}. Prioritize an original visual identity, a clear first-use flow, responsive interactions, realistic sample data, and an MVP architecture that can ship in one week.`,
}))

const typeCycle = filters.slice(1)

export function createCustomMashups(domainA, domainB) {
  const pair = `${domainA} + ${domainB}`
  const stems = [
    ['Crosswire', 'Turn the unlikely overlap into a daily creative instrument.'],
    ['Signal Garden', 'Make hidden connections visible, useful, and delightful.'],
    ['Odd Circuit', 'A small utility powered by a very unexpected combination.'],
  ]

  return stems.map(([name, tagline], index) => ({
    id: `custom-${Date.now()}-${index}`,
    title: `${name} ${String(index + 1).padStart(2, '0')}`,
    domainA,
    domainB,
    type: typeCycle[index % typeCycle.length],
    tagline,
    pitch: `${pair} becomes a focused product that translates the habits and mechanics of ${domainA} into a new workflow for ${domainB}. It starts with a guided generator, then turns the best outputs into reusable challenges and shareable artifacts.`,
    audience: `${domainA} practitioners curious about ${domainB}`,
    stack: ['React', 'Tailwind CSS', index === 0 ? 'Supabase' : 'Framer Motion'],
    prompt: `Design and build “${name}”, a responsive product combining ${domainA} and ${domainB}. Create a distinct visual system derived from both domains, an onboarding flow, a working generator with sample data, saved results, and an accessible mobile experience. Use React, Tailwind CSS, and Framer Motion. Avoid generic dashboard patterns and make the core interaction feel tactile.`,
  }))
}
