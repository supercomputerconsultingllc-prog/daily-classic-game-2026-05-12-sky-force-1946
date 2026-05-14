/* Curated licensed/free music source panel for Sky Force 1946.
   No copyrighted commercial tracks are embedded here. Each track must be checked for its license before bundling. */
(function () {
  'use strict';

  const SOURCES = [
    {
      name: 'Kevin MacLeod / Incompetech',
      license: 'Royalty-free Creative Commons Attribution tracks. Attribution required unless a separate no-attribution license is purchased.',
      bestFor: 'Fast arcade, action, comedy, tension, boss themes',
      url: 'https://incompetech.com/music/royalty-free/music.html',
      suggestedSearches: ['Movement Proposition', 'Volatile Reaction', 'Danger Storm', 'Mechanolith', 'Cipher', 'The Complex', 'Monkeys Spinning Monkeys', 'Sneaky Snitch']
    },
    {
      name: 'FreePD',
      license: 'Public-domain / CC0-style music collection associated with Kevin MacLeod. Verify each download page before bundling.',
      bestFor: 'No-attribution prototypes and fast game testing',
      url: 'https://freepd.com/',
      suggestedSearches: ['epic', 'electronic', 'action', 'arcade']
    },
    {
      name: 'OpenGameArt Music',
      license: 'Game-focused music with per-asset licenses. Prefer CC0, CC-BY, or licenses compatible with your final use.',
      bestFor: 'Looping game music, boss tracks, chiptune, orchestral game loops',
      url: 'https://opengameart.org/art-search-advanced?field_art_type_tid%5B%5D=12',
      suggestedSearches: ['shooter music', 'battle loop', 'chiptune action', 'arcade']
    },
    {
      name: 'Free Music Archive',
      license: 'Creative Commons archive. Licenses vary by track.',
      bestFor: 'Large catalog browsing and genre filtering',
      url: 'https://freemusicarchive.org/',
      suggestedSearches: ['electronic', 'cinematic', 'action', 'instrumental']
    },
    {
      name: 'Freesound Music Loops',
      license: 'Creative Commons sound and loop library. Licenses vary by item.',
      bestFor: 'Short loops, stingers, ambient layers, menu loops',
      url: 'https://freesound.org/browse/tags/music-loop/',
      suggestedSearches: ['arcade loop', 'battle loop', 'synth loop']
    },
    {
      name: 'Pixabay Music',
      license: 'Pixabay Content License. Free use with restrictions. Verify before bundling.',
      bestFor: 'Quick background tracks and mobile web prototypes',
      url: 'https://pixabay.com/music/',
      suggestedSearches: ['arcade', 'action', 'epic', 'electronic']
    }
  ];

  window.__SKY_FORCE_CURATED_MUSIC_SOURCES__ = SOURCES;

  function installPanel() {
    if (document.getElementById('curatedMusicSourcesPanel')) return;

    const style = document.createElement('style');
    style.textContent = `
      #curatedMusicSourcesPanel {
        position: fixed;
        inset: auto 10px 116px 10px;
        z-index: 10001;
        max-height: 48vh;
        overflow: auto;
        border: 1px solid rgba(185,235,255,.68);
        border-radius: 14px;
        padding: 12px;
        color: #f4fbff;
        background: rgba(3, 10, 21, .96);
        box-shadow: 0 8px 28px rgba(0,0,0,.45);
        font: 13px/1.35 system-ui, sans-serif;
        display: none;
      }
      #curatedMusicSourcesPanel.open { display: block; }
      #curatedMusicSourcesPanel h2 { margin: 0 0 8px; font-size: 15px; }
      #curatedMusicSourcesPanel a { color: #79dcff; font-weight: 800; }
      #curatedMusicSourcesPanel .source { border-top: 1px solid rgba(185,235,255,.18); padding-top: 8px; margin-top: 8px; }
      #curatedMusicSourcesPanel .license { color: #ffe2a6; }
      #curatedMusicSourcesPanel .tags { color: #bfeeff; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'curatedMusicSourcesPanel';
    panel.innerHTML = '<h2>Licensed music sources</h2><p>Use these sources to pick tracks that can be legally bundled. Each track license still needs verification before committing the actual audio file.</p>' +
      SOURCES.map((source) => `
        <div class="source">
          <a href="${source.url}" target="_blank" rel="noopener">${source.name}</a>
          <div class="license">${source.license}</div>
          <div>${source.bestFor}</div>
          <div class="tags">Try: ${source.suggestedSearches.join(', ')}</div>
        </div>
      `).join('');
    document.body.appendChild(panel);

    const deck = document.getElementById('mobileFeatureDeck');
    if (deck) {
      const musicButton = deck.querySelector('[data-action="music"]');
      if (musicButton) {
        musicButton.addEventListener('click', () => panel.classList.toggle('open'));
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPanel);
  else installPanel();
})();
