/* Professional implementation - Punishment visibility + Evidence locking foundation */

/* Simple punishment overlay for top bar */
function showPunishmentOverlay() {
  const existing = document.getElementById('punishment-overlay');
  if (existing) existing.remove();
  
  const activePunishments = state.punishments.filter(p => p.status === 'active');
  if (activePunishments.length === 0) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'punishment-overlay';
  overlay.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:60;background:rgba(0,0,0,0.85);color:#fff;padding:0.75rem 1.25rem;border-radius:1rem;max-width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
  
  let html = '<div style="font-weight:600;margin-bottom:0.5rem;font-size:0.9rem;">Active Punishments</div>';
  activePunishments.forEach(p => {
    const timeLeft = getTimeLeft(p).text;
    html += `<div style="margin-bottom:0.35rem;font-size:0.85rem;">${escapeText(p.title)} — ${timeLeft}</div>`;
  });
  
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 4500);
}

/* Hook into header timer click to show overlay instead of always going to consequences */
const originalOpenHeaderTimer = window.openHeaderTimer;
window.openHeaderTimer = function() {
  const activeP = state.punishments.filter(p => p.status === 'active');
  if (activeP.length > 0) {
    showPunishmentOverlay();
  } else if (originalOpenHeaderTimer) {
    originalOpenHeaderTimer();
  }
};

/* Evidence locking helper */
function canSubmitEvidence(task) {
  if (!task || !task.requiredEvidence) return true;
  const required = ensureArray(task.requiredEvidence);
  const captured = _pend || { photo: [], video: [], voice: [] };
  
  if (required.includes('photo') && captured.photo.length < 1) return false;
  if (required.includes('video') && captured.video.length < 1) return false;
  if (required.includes('voice') && captured.voice.length < 1) return false;
  if (required.includes('text')) {
    const ta = document.getElementById('evidence-text');
    if (!ta || !ta.value.trim()) return false;
  }
  return true;
}

/* Update submit button state based on evidence */
function updateSubmitButtonState(taskId) {
  const btn = document.querySelector('#evidence-controls button');
  if (!btn) return;
  const task = state.tasks.find(t => String(t.id) === String(taskId));
  if (!task) return;
  
  if (canSubmitEvidence(task)) {
    btn.disabled = false;
    btn.style.opacity = '1';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.5';
  }
}
