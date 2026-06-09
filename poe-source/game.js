(function () {
  'use strict';

  const demoSummary = 'Repo crystal rally source complete';
  const actionStatuses = {
    charge: 'Player 1 crystal paddle charged',
    release: 'Player 1 released the crystal beam',
  };

  function statusForAction(action) {
    return actionStatuses[action] || demoSummary;
  }

  function runDemo() {
    return { complete: true, summary: demoSummary };
  }

  function bindDemoActions(documentRef) {
    const statusElement = documentRef.getElementById('status');
    if (!statusElement) {
      return;
    }

    documentRef.querySelectorAll('[data-demo-action]').forEach((button) => {
      button.addEventListener('click', () => {
        statusElement.textContent = statusForAction(button.dataset.demoAction);
      });
    });
  }

  globalThis.GameLogic = {
    runDemo,
    statusForAction,
    bindDemoActions,
  };

  if (typeof document !== 'undefined') {
    bindDemoActions(document);
  }
}());
