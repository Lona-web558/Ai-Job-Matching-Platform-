const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const list = v => v.split(',').map(s => s.trim()).filter(Boolean);

// Tabs
document.querySelectorAll('#tabs button').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b === btn));
  $('seeker').classList.toggle('d-none', btn.dataset.view !== 'seeker');
  $('employer').classList.toggle('d-none', btn.dataset.view !== 'employer');
}));

// Find matches
$('matchForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('matchError').classList.add('d-none');
  try {
    const res = await fetch('/api/match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about: $('about').value, skills: list($('skills').value), title: $('title').value,
        location: $('location').value, years: $('years').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    render(data);
  } catch (err) {
    $('matchError').textContent = err.message || 'Something went wrong. Try again.';
    $('matchError').classList.remove('d-none');
  }
});

function render({ detectedSkills, results }) {
  $('detected').classList.remove('d-none');
  $('detected').innerHTML = '<div class="meta mb-1">Skills we found</div>' +
    (detectedSkills.map(s => `<span class="chip have">${esc(s)}</span>`).join('') || '<span class="meta">None detected</span>');
  if (!results.length) {
    $('results').innerHTML = '<div class="empty">No strong matches yet. Add more skills or broaden your location.</div>';
    return;
  }
  $('results').innerHTML = results.map(j => `
    <article class="panel job">
      <div class="ring ${j.score < 60 ? 'mid' : ''}" style="--p:${j.score}"><span>${j.score}%</span></div>
      <div>
        <h2>${esc(j.title)}</h2>
        <div class="meta">${esc(j.company)} · ${esc(j.location)}${j.remote ? ' · Remote friendly' : ''} · ${j.minYears}+ yrs</div>
        ${j.matched.map(s => `<span class="chip have">${esc(s)}</span>`).join('')}
        ${j.missing.map(s => `<span class="chip need">${esc(s)}</span>`).join('')}
      </div>
    </article>`).join('');
}

// Post a job
$('jobForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('jobMsg');
  const res = await fetch('/api/jobs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: $('jTitle').value, company: $('jCompany').value, location: $('jLocation').value,
      minYears: $('jYears').value, remote: $('jRemote').checked, skills: list($('jSkills').value)
    })
  });
  const data = await res.json();
  msg.className = 'alert py-2 mt-3 ' + (res.ok ? 'alert-success' : 'alert-danger');
  msg.textContent = res.ok ? `Published “${data.title}”. It's now matching candidates.` : data.error;
  if (res.ok) e.target.reset();
});
