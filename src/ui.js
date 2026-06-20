import { stateManager } from './state.js';
import { PERSONAS } from './persona.js';
import { EMISSION_FACTORS } from './calculations.js';
import { getAssistantResponse } from './assistant.js';

class UIManager {
  constructor() {
    this.activeTab = 'dashboard';
  }

  /**
   * Initializes DOM bindings and registers state change subscriber.
   */
  init() {
    this.cacheDOM();
    this.bindEvents();
    
    // Subscribe UI renders to state updates
    stateManager.subscribe((state) => this.render(state));

    // Initialize default states for forms
    if (this.onboardingQuestions) {
      this.renderOnboardingQuestions('commuter');
    }
    if (this.trackerCategory) {
      this.updateTrackerFormFields();
    }

    // Initial render
    this.render(stateManager.state);
  }

  /**
   * Cache DOM elements.
   */
  cacheDOM() {
    this.appContainer = document.getElementById('app');
    this.onboardingScreen = document.getElementById('onboarding-screen');
    this.mainScreen = document.getElementById('main-screen');
    
    // Onboarding Elements
    this.personaSelector = document.getElementById('persona-selector');
    this.onboardingForm = document.getElementById('onboarding-form');
    this.onboardingQuestions = document.getElementById('onboarding-questions');
    
    // Main Layout Elements
    this.navLinks = document.querySelectorAll('.nav-link');
    this.tabPanels = document.querySelectorAll('.tab-panel');
    this.themeToggle = document.getElementById('theme-toggle');
    this.resetBtn = document.getElementById('reset-btn');
    
    // Header Stats
    this.headerXp = document.getElementById('header-xp');
    this.headerLevel = document.getElementById('header-level');
    this.headerSaved = document.getElementById('header-saved');
    
    // Dashboard Tab Elements
    this.dashPersonaIcon = document.getElementById('dash-persona-icon');
    this.dashPersonaTitle = document.getElementById('dash-persona-title');
    this.dashBaselineTotal = document.getElementById('dash-baseline-total');
    this.dashTrackedTotal = document.getElementById('dash-tracked-total');
    this.dashSavedTotal = document.getElementById('dash-saved-total');
    this.chartContainer = document.getElementById('chart-container');
    this.dashboardTips = document.getElementById('dashboard-tips');
    
    // Tracker Tab Elements
    this.trackerForm = document.getElementById('tracker-form');
    this.trackerCategory = document.getElementById('tracker-category');
    this.trackerType = document.getElementById('tracker-type');
    this.trackerAmount = document.getElementById('tracker-amount');
    this.trackerAmountLabel = document.getElementById('tracker-amount-label');
    this.trackerAmountUnit = document.getElementById('tracker-amount-unit');
    this.trackerNote = document.getElementById('tracker-note');
    
    // Logs Tab Elements
    this.logsTableBody = document.getElementById('logs-table-body');
    
    // Challenges Tab Elements
    this.challengesGrid = document.getElementById('challenges-grid');
    
    // Chat Tab Elements
    this.chatMessages = document.getElementById('chat-messages');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    this.chatSendBtn = document.getElementById('chat-send-btn');
  }

  /**
   * Bind DOM event listeners.
   */
  bindEvents() {
    // Navigation Tabs
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        this.switchTab(tab);
      });
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const tab = link.getAttribute('data-tab');
          this.switchTab(tab);
        }
      });
    });

    // Theme Toggle
    this.themeToggle.addEventListener('click', () => {
      stateManager.toggleTheme();
    });

    // Reset Button
    this.resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all data and reset EcoSphere?')) {
        stateManager.reset();
        this.switchTab('dashboard');
      }
    });

    // Onboarding Persona Selection
    if (this.personaSelector) {
      const selectPersonaCard = (card) => {
        // Remove selection from others
        document.querySelectorAll('.persona-card').forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        
        // Select target
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        
        const personaId = card.getAttribute('data-persona');
        this.renderOnboardingQuestions(personaId);
      };

      this.personaSelector.addEventListener('click', (e) => {
        const card = e.target.closest('.persona-card');
        if (card) selectPersonaCard(card);
      });

      this.personaSelector.addEventListener('keydown', (e) => {
        const card = e.target.closest('.persona-card');
        if (card && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          selectPersonaCard(card);
        }
      });
    }

    // Onboarding Form Submit
    if (this.onboardingForm) {
      this.onboardingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedCard = document.querySelector('.persona-card.selected');
        if (!selectedCard) {
          alert('Please select a persona to begin.');
          return;
        }

        const personaId = selectedCard.getAttribute('data-persona');
        const formData = new FormData(this.onboardingForm);
        const answers = {};
        
        // Parse answers
        formData.forEach((value, key) => {
          answers[key] = isNaN(value) || value === '' ? value : Number(value);
        });

        stateManager.setOnboarding(personaId, answers);
      });
    }

    // Tracker Category Change
    if (this.trackerCategory) {
      this.trackerCategory.addEventListener('change', () => {
        this.updateTrackerFormFields();
      });
    }

    // Tracker Form Submit
    if (this.trackerForm) {
      this.trackerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = this.trackerCategory.value;
        const type = this.trackerType.value;
        const amount = this.trackerAmount.value;
        const note = this.trackerNote.value;

        if (!amount || Number(amount) <= 0) {
          alert('Please enter a valid positive amount.');
          return;
        }

        stateManager.addLogEntry(category, type, amount, note);
        this.trackerForm.reset();
        this.updateTrackerFormFields();
        alert('Activity logged successfully! +10 XP');
        this.switchTab('dashboard'); // Head back to dashboard
      });
    }

    // Chat Form Submit
    if (this.chatForm) {
      this.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = this.chatInput.value.trim();
        if (!msg) return;

        // 1. Add User Message
        stateManager.addChatMessage('user', msg);
        this.chatInput.value = '';

        // 2. Add AI reply with simulated typing delay (500ms)
        const chatContainer = this.chatMessages;
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai typing';
        typingIndicator.setAttribute('aria-live', 'polite');
        typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        chatContainer.appendChild(typingIndicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        setTimeout(() => {
          typingIndicator.remove();
          const aiResponse = getAssistantResponse(msg, stateManager.state);
          stateManager.addChatMessage('ai', aiResponse);
        }, 600);
      });
    }
  }

  /**
   * Switch the active navigation panel view.
   * @param {string} tabName 
   */
  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Update Nav bar highlights
    this.navLinks.forEach(link => {
      const isTarget = link.getAttribute('data-tab') === tabName;
      link.classList.toggle('active', isTarget);
      link.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Show/Hide Panel Content
    this.tabPanels.forEach(panel => {
      const isTarget = panel.id === `${tabName}-tab`;
      panel.classList.toggle('active', isTarget);
      panel.setAttribute('aria-hidden', isTarget ? 'false' : 'true');
      
      // Manage Focus for Screen Readers
      if (isTarget) {
        panel.setAttribute('tabindex', '-1');
        panel.focus();
      }
    });

    // Special scrolling logic for chat
    if (tabName === 'chat') {
      this.scrollToBottom();
    }
  }

  /**
   * Renders the dynamic onboarding questions for the chosen persona.
   * @param {string} personaId 
   */
  renderOnboardingQuestions(personaId) {
    const persona = PERSONAS[personaId];
    if (!persona) return;

    this.onboardingQuestions.innerHTML = '';
    
    // Add custom questionnaire title based on selected persona
    const title = document.createElement('h3');
    title.textContent = `Customize your ${persona.title} baseline:`;
    title.style.marginBottom = '1.25rem';
    title.style.color = 'var(--text-primary)';
    this.onboardingQuestions.appendChild(title);

    persona.questions.forEach(q => {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';
      
      const label = document.createElement('label');
      label.setAttribute('for', `ob-${q.id}`);
      label.textContent = q.label;
      formGroup.appendChild(label);

      if (q.type === 'select') {
        const select = document.createElement('select');
        select.id = `ob-${q.id}`;
        select.name = q.id;
        q.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          if (opt.value === q.default) o.selected = true;
          select.appendChild(o);
        });
        formGroup.appendChild(select);
      } else {
        const input = document.createElement('input');
        input.id = `ob-${q.id}`;
        input.name = q.id;
        input.type = q.type;
        input.value = q.default;
        if (q.placeholder) input.placeholder = q.placeholder;
        formGroup.appendChild(input);
      }

      this.onboardingQuestions.appendChild(formGroup);
    });

    // Add submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Calculate My Carbon Baseline';
    submitBtn.style.marginTop = '1rem';
    this.onboardingQuestions.appendChild(submitBtn);
  }

  /**
   * Updates tracker input options and labels dynamically when category dropdown is modified.
   */
  updateTrackerFormFields() {
    const category = this.trackerCategory.value;
    const subOptions = EMISSION_FACTORS[category] || {};
    
    // Clear select
    this.trackerType.innerHTML = '';
    
    // Populate subcategories
    for (const key in subOptions) {
      const option = document.createElement('option');
      option.value = key;
      // Prettify key
      option.textContent = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      this.trackerType.appendChild(option);
    }

    // Update units and descriptions
    let label = 'Amount';
    let unit = '';
    
    switch (category) {
      case 'transport':
        label = 'Commute Distance';
        unit = 'km';
        break;
      case 'diet':
        label = 'Number of Meals';
        unit = 'meals';
        break;
      case 'energy':
        label = 'Energy Consumed';
        unit = 'kWh';
        break;
      case 'shopping':
        label = 'Items Purchased';
        unit = 'items';
        break;
    }

    this.trackerAmountLabel.textContent = label;
    this.trackerAmountUnit.textContent = unit;
    this.trackerAmount.placeholder = `e.g. ${category === 'transport' ? '15' : '1'}`;
  }

  /**
   * Main render dispatch method.
   * Updates page visibility, layouts, tables, and graphs dynamically.
   * @param {Object} state - The global application state
   */
  render(state) {
    // 1. Manage Dark Mode Classes
    if (state.theme === 'dark') {
      document.body.classList.add('dark-theme');
      this.themeToggle.textContent = '☀️ Light Mode';
    } else {
      document.body.classList.remove('dark-theme');
      this.themeToggle.textContent = '🌙 Dark Mode';
    }

    // 2. Manage Screen Visibility
    if (state.isOnboarded) {
      this.onboardingScreen.style.display = 'none';
      this.mainScreen.style.display = 'grid';
    } else {
      this.onboardingScreen.style.display = 'block';
      this.mainScreen.style.display = 'none';
      return; // Stop here since main app is hidden
    }

    // 3. Render Top Stats Header
    const level = Math.floor(state.xp / 100);
    const xpPercent = state.xp % 100;
    
    this.headerXp.textContent = `${state.xp} XP`;
    this.headerLevel.textContent = `Lvl ${level}`;
    this.headerSaved.textContent = `${state.totalSavedCo2.toFixed(1)} kg`;
    
    // Set progression bar
    const progressBar = document.getElementById('xp-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${xpPercent}%`;
    }

    // 4. Render Dashboard Tab
    this.renderDashboard(state);

    // 5. Render Logs Table
    this.renderLogs(state);

    // 6. Render Challenges Grid
    this.renderChallenges(state);

    // 7. Render Chat History
    this.renderChat(state);
  }

  /**
   * Render Dashboard data, charts, and persona highlights.
   */
  renderDashboard(state) {
    const persona = PERSONAS[state.selectedPersona];
    if (!persona) return;

    this.dashPersonaIcon.textContent = persona.icon;
    this.dashPersonaTitle.textContent = persona.title;
    
    // Update Metrics
    this.dashBaselineTotal.textContent = `${state.baselineFootprint.total} Tons`;
    
    const trackedSumKg = stateManager.getTotalTrackedEmissions();
    this.dashTrackedTotal.textContent = `${trackedSumKg.toFixed(1)} kg`;
    this.dashSavedTotal.textContent = `${state.totalSavedCo2.toFixed(1)} kg`;

    // Render Charts
    this.renderCharts(state);

    // Render Tips list
    this.dashboardTips.innerHTML = '';
    persona.recommendations.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      this.dashboardTips.appendChild(li);
    });
  }

  /**
   * Draws a beautiful, high-contrast, fully accessible native SVG chart.
   */
  renderCharts(state) {
    const categories = stateManager.getEmissionsByCategory();
    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

    this.chartContainer.innerHTML = '';

    if (total === 0) {
      // Empty State
      this.chartContainer.innerHTML = `
        <div class="empty-chart" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; text-align:center; color:var(--text-secondary);">
          <span style="font-size:2.5rem; margin-bottom:0.5rem;">📊</span>
          <p>No carbon entries logged yet.</p>
          <p style="font-size:0.8rem; margin-top:0.25rem;">Start tracking today to populate your footprint chart.</p>
        </div>
      `;
      return;
    }

    // Draw SVG Donut Chart
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 400 240");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Donut chart representing your carbon footprint categories.");

    // Setup colors
    const colors = {
      transport: '#10b981', // Emerald Green
      diet: '#f59e0b',      // Amber Yellow
      energy: '#3b82f6',    // Electric Blue
      shopping: '#8b5cf6'   // Purple
    };

    let startPercent = 0;
    const cx = 120, cy = 120, r = 70, strokeWidth = 24;
    const circumference = 2 * Math.PI * r;

    // Category mappings for display
    const catLabels = {
      transport: 'Transport',
      diet: 'Diet',
      energy: 'Energy',
      shopping: 'Shopping'
    };

    // Keep track of Legend content
    const legendGroup = document.createElementNS(svgNS, "g");
    legendGroup.setAttribute("transform", "translate(240, 40)");

    let yOffset = 0;

    Object.entries(categories).forEach(([category, val]) => {
      if (val <= 0) return;

      const pct = val / total;
      const strokeDasharray = `${pct * circumference} ${circumference}`;
      const strokeDashoffset = `${-startPercent * circumference}`;

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", cx.toString());
      circle.setAttribute("cy", cy.toString());
      circle.setAttribute("r", r.toString());
      circle.setAttribute("fill", "transparent");
      circle.setAttribute("stroke", colors[category]);
      circle.setAttribute("stroke-width", strokeWidth.toString());
      circle.setAttribute("stroke-dasharray", strokeDasharray);
      circle.setAttribute("stroke-dashoffset", strokeDashoffset.toString());
      
      // Accessibility title for screen readers inside SVG
      const title = document.createElementNS(svgNS, "title");
      title.textContent = `${catLabels[category]}: ${val.toFixed(1)} kg (${Math.round(pct * 100)}%)`;
      circle.appendChild(title);

      svg.appendChild(circle);

      // Add Legend Items
      const legendItem = document.createElementNS(svgNS, "g");
      legendItem.setAttribute("transform", `translate(0, ${yOffset})`);

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("width", "12");
      rect.setAttribute("height", "12");
      rect.setAttribute("rx", "3");
      rect.setAttribute("fill", colors[category]);

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", "20");
      text.setAttribute("y", "10");
      text.setAttribute("fill", "var(--text-primary)");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-family", "system-ui, sans-serif");
      text.textContent = `${catLabels[category]}: ${val.toFixed(1)} kg (${Math.round(pct * 100)}%)`;

      legendItem.appendChild(rect);
      legendItem.appendChild(text);
      legendGroup.appendChild(legendItem);

      yOffset += 24;
      startPercent += pct;
    });

    // Draw inner text
    const textTotalVal = document.createElementNS(svgNS, "text");
    textTotalVal.setAttribute("x", cx.toString());
    textTotalVal.setAttribute("y", (cy - 5).toString());
    textTotalVal.setAttribute("text-anchor", "middle");
    textTotalVal.setAttribute("fill", "var(--text-primary)");
    textTotalVal.setAttribute("font-size", "22");
    textTotalVal.setAttribute("font-weight", "bold");
    textTotalVal.textContent = `${Math.round(total)}`;

    const textTotalLbl = document.createElementNS(svgNS, "text");
    textTotalLbl.setAttribute("x", cx.toString());
    textTotalLbl.setAttribute("y", (cy + 15).toString());
    textTotalLbl.setAttribute("text-anchor", "middle");
    textTotalLbl.setAttribute("fill", "var(--text-secondary)");
    textTotalLbl.setAttribute("font-size", "12");
    textTotalLbl.textContent = "Total kg CO2e";

    svg.appendChild(textTotalVal);
    svg.appendChild(textTotalLbl);
    svg.appendChild(legendGroup);

    this.chartContainer.appendChild(svg);
  }

  /**
   * Render activities log grid.
   */
  renderLogs(state) {
    this.logsTableBody.innerHTML = '';

    if (state.logs.length === 0) {
      this.logsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
            No activities logged. Use the 'Track Activity' tab to add your footprint logs.
          </td>
        </tr>
      `;
      return;
    }

    state.logs.forEach(log => {
      const tr = document.createElement('tr');
      if (log.category === 'challenge') {
        tr.className = 'savings-row';
      }

      // Format Date
      const date = new Date(log.timestamp);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Format Category Emoji & Text
      const catIcons = { transport: '🚗', diet: '🥗', energy: '⚡', shopping: '🛍️', challenge: '🌱' };
      const displayCat = `${catIcons[log.category] || '❓'} ${log.category.toUpperCase()}`;

      // Format Details
      let details = log.note;
      if (!details) {
        details = `${log.amount} ${log.category === 'transport' ? 'km' : log.category === 'diet' ? 'meals' : log.category === 'energy' ? 'kWh' : 'items'}`;
      }

      // Format CO2 value with colors
      const co2Val = log.co2;
      const formattedCo2 = co2Val < 0 
        ? `<span class="saving-text" style="color:var(--primary-color); font-weight:600;">-${Math.abs(co2Val).toFixed(2)} kg</span>`
        : `<span class="expense-text" style="color:#ef4444; font-weight:600;">+${co2Val.toFixed(2)} kg</span>`;

      // Build Action Column
      const deleteCol = document.createElement('td');
      if (log.category !== 'challenge') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.setAttribute('aria-label', `Delete log entry from ${dateStr} for ${details}`);
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Remove this ${log.category} entry?`)) {
            stateManager.deleteLogEntry(log.id);
          }
        });
        deleteCol.appendChild(deleteBtn);
      } else {
        deleteCol.innerHTML = '<span style="font-size:0.85rem; color:var(--text-secondary);">Reward</span>';
      }

      tr.innerHTML = `
        <td>${dateStr}</td>
        <td>${displayCat}</td>
        <td>${details}</td>
        <td>${formattedCo2}</td>
      `;
      tr.appendChild(deleteCol);

      this.logsTableBody.appendChild(tr);
    });
  }

  /**
   * Render daily tasks and habits card deck.
   */
  renderChallenges(state) {
    const persona = PERSONAS[state.selectedPersona];
    if (!persona) return;

    this.challengesGrid.innerHTML = '';

    persona.challenges.forEach(ch => {
      const completions = state.completedChallenges[ch.id] || 0;
      
      const card = document.createElement('div');
      card.className = 'challenge-card';
      
      card.innerHTML = `
        <div class="challenge-header">
          <h4>${ch.title}</h4>
          <span class="challenge-badge">${ch.category.toUpperCase()}</span>
        </div>
        <p>${ch.description}</p>
        <div class="challenge-footer">
          <div class="reward-tag">
            <span class="co2-tag">🌱 -${ch.co2Saved} kg</span>
            <span class="xp-tag">⭐ +${ch.xp} XP</span>
          </div>
          <button class="btn btn-action" id="btn-ch-${ch.id}">
            Complete ${completions > 0 ? `(${completions})` : ''}
          </button>
        </div>
      `;

      this.challengesGrid.appendChild(card);

      // Event listener
      const btn = document.getElementById(`btn-ch-${ch.id}`);
      btn.addEventListener('click', () => {
        stateManager.completeChallenge(ch.id);
        alert(`Challenge Completed! Saved -${ch.co2Saved} kg CO₂e. +${ch.xp} XP!`);
      });
    });
  }

  /**
   * Render scrolling chat history inside console.
   */
  renderChat(state) {
    this.chatMessages.innerHTML = '';

    if (state.chatHistory.length === 0) {
      this.chatMessages.innerHTML = `
        <div class="empty-chat" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
          <p>Start a conversation with EcoBuddy to get personalized carbon advice.</p>
        </div>
      `;
      return;
    }

    state.chatHistory.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `message ${msg.sender === 'user' ? 'user' : 'ai'}`;
      
      // Parse markdown-style tags for bold items to look extra professional
      let formattedText = msg.text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/💡/g, '💡')
        .replace(/📊/g, '📊')
        .replace(/🌱/g, '🌱')
        .replace(/📉/g, '📉')
        .replace(/\n/g, '<br>');

      msgDiv.innerHTML = `<div class="msg-bubble">${formattedText}</div>`;
      this.chatMessages.appendChild(msgDiv);
    });

    this.scrollToBottom();
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
}

export const uiManager = new UIManager();
