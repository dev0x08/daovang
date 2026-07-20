const ROLE_BADGE_ID = 'mobile-role-badge';

function ensureRoleBadge() {
  const gamePage = document.querySelector<HTMLElement>('.game-page');
  if (!gamePage || document.getElementById(ROLE_BADGE_ID)) return;

  const settingsButton = document.querySelector<HTMLButtonElement>('.action-settings');
  if (!settingsButton) return;

  document.documentElement.classList.add('role-probe-active');
  settingsButton.click();

  window.setTimeout(() => {
    const settingsCard = document.querySelector<HTMLElement>('.players-settings-card');
    const text = settingsCard?.innerText || '';
    const role = text.includes('THỢ ĐÀO') ? 'THỢ ĐÀO' : text.includes('SÓI') ? 'SÓI' : '';

    const closeButton = settingsCard?.querySelector<HTMLButtonElement>('.prompt-close');
    closeButton?.click();
    document.documentElement.classList.remove('role-probe-active');

    if (!role || document.getElementById(ROLE_BADGE_ID)) return;

    const badge = document.createElement('div');
    badge.id = ROLE_BADGE_ID;
    badge.className = `persistent-role-badge ${role === 'SÓI' ? 'wolf' : 'miner'}`;
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-label', `Vai trò của bạn: ${role}`);
    badge.innerHTML = `<span>${role === 'SÓI' ? '🐺' : '⛏️'}</span><small>VAI TRÒ</small><b>${role}</b>`;

    const top = gamePage.querySelector('.game-top');
    top?.appendChild(badge);
  }, 80);
}

function applyGameFixes() {
  ensureRoleBadge();
}

const observer = new MutationObserver(applyGameFixes);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    applyGameFixes();
  });
} else {
  observer.observe(document.body, { childList: true, subtree: true });
  applyGameFixes();
}
