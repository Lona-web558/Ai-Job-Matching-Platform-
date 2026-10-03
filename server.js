const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ---- In-memory data (swap for a database later) ----
let nextId = 9;
const jobs = [
  { id: 1, title: 'Frontend Developer', company: 'Karoo Labs', location: 'Johannesburg', remote: true, minYears: 1, skills: ['html', 'css', 'javascript', 'react', 'bootstrap'] },
  { id: 2, title: 'Node.js Backend Developer', company: 'Rand Pay', location: 'Cape Town', remote: true, minYears: 2, skills: ['node.js', 'express', 'mongodb', 'rest api', 'git'] },
  { id: 3, title: 'Full-Stack Developer', company: 'Ubuntu Learn', location: 'Johannesburg', remote: false, minYears: 2, skills: ['javascript', 'node.js', 'express', 'html', 'css', 'sql'] },
  { id: 4, title: 'Data Analyst', company: 'Highveld Insights', location: 'Pretoria', remote: false, minYears: 1, skills: ['sql', 'python', 'excel', 'power bi', 'statistics'] },
  { id: 5, title: 'UX/UI Designer', company: 'Pixel Kraal', location: 'Durban', remote: true, minYears: 2, skills: ['figma', 'ux research', 'prototyping', 'css', 'html'] },
  { id: 6, title: 'Machine Learning Engineer', company: 'Savanna AI', location: 'Cape Town', remote: true, minYears: 3, skills: ['python', 'machine learning', 'tensorflow', 'sql', 'docker'] },
  { id: 7, title: 'DevOps Engineer', company: 'Cloudbase SA', location: 'Johannesburg', remote: true, minYears: 3, skills: ['docker', 'aws', 'linux', 'ci/cd', 'git', 'node.js'] },
  { id: 8, title: 'Junior Web Developer', company: 'Gauteng Digital', location: 'Midrand', remote: false, minYears: 0, skills: ['html', 'css', 'javascript', 'bootstrap', 'git'] }
];

// ---- Matching engine ----
const SKILL_BANK = ['html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular', 'bootstrap', 'tailwind', 'node.js', 'express', 'mongodb', 'sql', 'mysql', 'postgresql', 'python', 'machine learning', 'tensorflow', 'excel', 'power bi', 'statistics', 'figma', 'ux research', 'prototyping', 'docker', 'aws', 'linux', 'ci/cd', 'git', 'rest api', 'java', 'php', 'seo', 'marketing'];
const ALIASES = { node: 'node.js', nodejs: 'node.js', js: 'javascript', ml: 'machine learning', postgres: 'postgresql', api: 'rest api', apis: 'rest api', 'ux': 'ux research' };

const norm = s => String(s).toLowerCase().trim();
const normSkill = s => ALIASES[norm(s)] || norm(s);

function extractSkills(text) {
  const t = ' ' + norm(text).replace(/[,;/\n]/g, ' ') + ' ';
  const found = new Set(SKILL_BANK.filter(s => t.includes(' ' + s + ' ') || t.includes(' ' + s + '.')));
  Object.keys(ALIASES).forEach(a => { if (t.includes(' ' + a + ' ')) found.add(ALIASES[a]); });
  return [...found];
}

function titleScore(want, title) {
  const a = new Set(norm(want).split(/\W+/).filter(Boolean));
  const b = norm(title).split(/\W+/).filter(Boolean);
  if (!a.size || !b.length) return 0;
  return b.filter(w => a.has(w)).length / b.length;
}

function score(job, p) {
  const have = new Set(p.skills);
  const matched = job.skills.filter(s => have.has(s));
  const missing = job.skills.filter(s => !have.has(s));
  const skillPct = matched.length / job.skills.length;
  const titlePct = titleScore(p.title, job.title);
  const locPct = !p.location ? 0.5 : norm(job.location) === norm(p.location) ? 1 : job.remote ? 0.8 : 0;
  const expPct = p.years >= job.minYears ? 1 : Math.max(0, 1 - (job.minYears - p.years) * 0.4);
  const total = skillPct * 0.6 + titlePct * 0.2 + locPct * 0.1 + expPct * 0.1;
  return { ...job, score: Math.round(total * 100), matched, missing };
}

// ---- API ----
app.get('/api/jobs', (req, res) => res.json(jobs));

app.post('/api/match', (req, res) => {
  const { title = '', location = '', years = 0, skills = [], about = '' } = req.body || {};
  const all = new Set([...skills.map(normSkill), ...extractSkills(about)]);
  if (!all.size && !title) return res.status(400).json({ error: 'Add at least one skill, a job title, or a short bio.' });
  const profile = { title, location, years: Number(years) || 0, skills: [...all] };
  const results = jobs.map(j => score(j, profile)).filter(r => r.score > 15).sort((a, b) => b.score - a.score);
  res.json({ detectedSkills: profile.skills, results });
});

app.post('/api/jobs', (req, res) => {
  const { title, company, location, remote, minYears, skills } = req.body || {};
  if (!title || !company || !Array.isArray(skills) || !skills.length)
    return res.status(400).json({ error: 'Title, company and at least one skill are required.' });
  const job = { id: nextId++, title: title.trim(), company: company.trim(), location: (location || 'Remote').trim(), remote: !!remote, minYears: Number(minYears) || 0, skills: skills.map(normSkill) };
  jobs.push(job);
  res.status(201).json(job);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI Job Match running on http://localhost:${PORT}`));
