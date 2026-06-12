(function () {
  'use strict';

  const demoSummary = 'Repo crystal rally source complete';
  const actionStatuses = {
    charge: 'Player 1 crystal paddle charged',
    release: 'Player 1 released the crystal beam',
  };
  const hasOwnProperty = Object.prototype.hasOwnProperty;

  function statusForAction(action) {
    return hasOwnProperty.call(actionStatuses, action) ? actionStatuses[action] : demoSummary;
  }

  function runDemo() {
    return { complete: true, summary: demoSummary };
  }

  function bindDemoActions(documentRef) {
    if (
      !documentRef ||
      typeof documentRef.getElementById !== 'function' ||
      typeof documentRef.querySelectorAll !== 'function'
    ) {
      return;
    }

    let statusElement;
    let buttons;
    try {
      statusElement = documentRef.getElementById('status');
      buttons = documentRef.querySelectorAll('[data-demo-action]');
    } catch (error) {
      return;
    }

    if (!statusElement || !buttons || typeof buttons.forEach !== 'function') {
      return;
    }

    buttons.forEach((button) => {
      if (!button || typeof button.addEventListener !== 'function') {
        return;
      }
      button.addEventListener('click', () => {
        let action;
        try {
          action = button.dataset && button.dataset.demoAction;
        } catch (error) {
          action = undefined;
        }
        statusElement.textContent = statusForAction(action);
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
